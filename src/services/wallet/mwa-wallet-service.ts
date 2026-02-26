import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol';
import bs58 from 'bs58';
import nacl from 'tweetnacl';

import { SignedPayload } from '../../models/signed-payload';
import { WalletSession } from '../../models/wallet-session';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { WalletService } from './wallet-types';

interface WalletStorage {
  saveWalletSession(session: WalletSession): Promise<void>;
  getWalletSession(): Promise<WalletSession | null>;
  clearWalletSession(): Promise<void>;
}

interface AccountValidator {
  isAccountValid(address: string): Promise<boolean>;
  sendSignedTransactionBase64?(serializedSignedTransactionBase64: string): Promise<string>;
}

const utf8Encode = (value: string): Uint8Array => new TextEncoder().encode(value);
const base64ToUint8Array = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};
const uint8ArrayToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const base64ToString = (base64: string): string => {
  const bytes = base64ToUint8Array(base64);
  return bs58.encode(bytes);
};

export class MwaWalletService implements WalletService {
  private activeSession: WalletSession | null = null;

  constructor(
    private readonly storage: WalletStorage,
    private readonly solanaService: AccountValidator,
    private readonly appIdentity: { name: string; uri: string; icon: string }
  ) {}

  async connect(): Promise<WalletSession> {
    const authResult = await transact(async (wallet) => {
      const authorization = await wallet.authorize({
        cluster: 'devnet',
        identity: this.appIdentity,
      });

      return authorization;
    });

    if (!authResult.accounts || authResult.accounts.length === 0) {
      throw new AppError('No wallet accounts returned from authorization.', 'WALLET_NO_ACCOUNTS');
    }

    // MWA returns addresses as base64-encoded strings
    const addressBase64 = authResult.accounts[0].address;
    const addressBytes = base64ToUint8Array(addressBase64);
    const walletAddress = bs58.encode(addressBytes);
    const authToken = authResult.auth_token;

    const session: WalletSession = {
      walletAddress,
      sessionToken: authToken,
      sharedSecretBase58: '', // MWA manages encryption internally
      dappSecretKeyBase58: '', // MWA manages encryption internally
      phantomEncryptionPublicKeyBase58: '', // Not used in MWA
      cluster: 'devnet',
      connectedAtIso: new Date().toISOString(),
    };

    this.activeSession = session;
    await this.storage.saveWalletSession(session);
    logger.info('Wallet connected via MWA', { address: session.walletAddress });

    return session;
  }

  async signMessage(message: string): Promise<SignedPayload> {
    const session = await this.requireSession();
    let activeSession = session;
    const messageBytes = utf8Encode(message);

    const signResult = await transact(async (wallet) => {
      activeSession = await this.ensureAuthorizedSession(wallet, activeSession);
      const addressBytes = bs58.decode(activeSession.walletAddress);

      const signatures = await wallet.signMessages({
        addresses: [uint8ArrayToBase64(addressBytes)],
        payloads: [uint8ArrayToBase64(messageBytes)],
      });

      return signatures;
    });

    if (!signResult.signed_payloads || signResult.signed_payloads.length === 0) {
      throw new AppError('No signatures returned from wallet.', 'WALLET_SIGN_FAILED');
    }

    const signatureBase64 = signResult.signed_payloads[0];
    const signatureBytes = base64ToUint8Array(signatureBase64);
    const signatureBase58 = bs58.encode(signatureBytes);

    const signedPayload: SignedPayload = {
      message,
      signatureBase58,
      walletAddress: activeSession.walletAddress,
    };

    if (!this.verifySignedPayload(signedPayload)) {
      throw new AppError('Wallet signature verification failed.', 'WALLET_SIGNATURE_INVALID');
    }

    return signedPayload;
  }

  async sendTransaction(serializedTransactionBase64: string): Promise<string> {
    const session = await this.requireSession();
    let activeSession = session;

    logger.info('Starting MWA transaction signing flow');

    const signAndSend = async (forceAuthorize: boolean): Promise<string> => {
      const sendResult = await transact(async (wallet) => {
        activeSession = await this.ensureAuthorizedSession(wallet, activeSession, forceAuthorize);
        const addressBytes = bs58.decode(activeSession.walletAddress);

        return (wallet as any).signAndSendTransactions({
          addresses: [uint8ArrayToBase64(addressBytes)],
          payloads: [serializedTransactionBase64],
        });
      });

      const signatures = (sendResult as any)?.signatures as string[] | undefined;
      if (!signatures || signatures.length === 0) {
        logger.warn('MWA returned no signatures', sendResult);
        throw new AppError('No transaction signature returned by wallet.', 'WALLET_TX_FAILED');
      }

      const first = signatures[0];
      logger.info('MWA transaction signature received');
      return first.length > 80 ? first : base64ToString(first);
    };

    const signThenBroadcast = async (forceAuthorize: boolean): Promise<string> => {
      const signResult = await transact(async (wallet) => {
        activeSession = await this.ensureAuthorizedSession(wallet, activeSession, forceAuthorize);
        const addressBytes = bs58.decode(activeSession.walletAddress);

        if (typeof (wallet as any).signTransactions !== 'function') {
          throw new AppError('Wallet does not support signTransactions fallback.', 'WALLET_TX_FAILED');
        }

        return (wallet as any).signTransactions({
          addresses: [uint8ArrayToBase64(addressBytes)],
          payloads: [serializedTransactionBase64],
        });
      });

      const signedPayloads = (signResult as any)?.signed_payloads as string[] | undefined;
      if (!signedPayloads || signedPayloads.length === 0) {
        throw new AppError('Wallet returned no signed transaction payload.', 'WALLET_TX_FAILED');
      }

      if (!this.solanaService.sendSignedTransactionBase64) {
        throw new AppError('RPC broadcast fallback is unavailable.', 'WALLET_TX_FAILED');
      }

      logger.warn('Broadcasting signed transaction via app RPC fallback.');
      return this.solanaService.sendSignedTransactionBase64(signedPayloads[0]);
    };

    try {
      return await signThenBroadcast(false);
    } catch (primaryError) {
      logger.warn('Primary signTransactions + RPC broadcast path failed. Falling back to signAndSend.', primaryError);

      try {
        return await signAndSend(false);
      } catch (error) {
        if (this.isAdapterTimeoutError(error)) {
          logger.warn('MWA adapter response timed out; retrying signAndSend with fresh authorization.', error);
          try {
            return await signAndSend(true);
          } catch (retryError) {
            logger.error('MWA retry signAndSendTransactions failed', retryError);
            const retryMessage = retryError instanceof Error ? retryError.message : 'Wallet transaction retry failed.';
            throw new AppError(retryMessage, 'WALLET_TX_FAILED');
          }
        }

        logger.error('MWA signAndSendTransactions failed', error);
        const message = error instanceof Error ? error.message : 'Wallet failed to sign/send transaction.';
        throw new AppError(message, 'WALLET_TX_FAILED');
      }
    }
  }

  verifySignedPayload(payload: SignedPayload): boolean {
    try {
      const messageBytes = utf8Encode(payload.message);
      const signatureBytes = bs58.decode(payload.signatureBase58);
      const publicKeyBytes = bs58.decode(payload.walletAddress);

      return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
    } catch {
      return false;
    }
  }

  async reconnectFromSavedSession(): Promise<WalletSession | null> {
    const stored = await this.storage.getWalletSession();
    if (!stored) {
      this.activeSession = null;
      return null;
    }

    const accountValid = await this.solanaService.isAccountValid(stored.walletAddress);
    if (!accountValid) {
      await this.storage.clearWalletSession();
      this.activeSession = null;
      return null;
    }

    this.activeSession = stored;
    return stored;
  }

  async disconnect(): Promise<void> {
    const session = await this.storage.getWalletSession();

    if (session) {
      try {
        await transact(async (wallet) => {
          await wallet.deauthorize({ auth_token: session.sessionToken });
        });
      } catch (error) {
        logger.warn('MWA deauthorize failed, continuing with local session clear.', error);
      }
    }

    this.activeSession = null;
    await this.storage.clearWalletSession();
    logger.info('Wallet disconnected');
  }

  private async requireSession(): Promise<WalletSession> {
    if (this.activeSession) {
      return this.activeSession;
    }

    const restored = await this.reconnectFromSavedSession();
    if (!restored) {
      throw new AppError('Wallet not connected.', 'WALLET_NOT_CONNECTED');
    }

    return restored;
  }

  private async ensureAuthorizedSession(wallet: any, session: WalletSession, forceAuthorize = false): Promise<WalletSession> {
    if (!forceAuthorize) {
      try {
        await wallet.reauthorize({
          auth_token: session.sessionToken,
          identity: this.appIdentity,
        });
        return session;
      } catch (error) {
        logger.warn('MWA reauthorize failed; falling back to authorize.', error);
      }
    } else {
      logger.warn('Forcing fresh MWA authorize for transaction retry.');
    }

    const authorization = await wallet.authorize({
      cluster: 'devnet',
      identity: this.appIdentity,
    });

    if (!authorization.accounts || authorization.accounts.length === 0) {
      throw new AppError('No wallet accounts returned from authorization.', 'WALLET_NO_ACCOUNTS');
    }

    const refreshedWalletAddress = bs58.encode(base64ToUint8Array(authorization.accounts[0].address));
    const refreshedSession: WalletSession = {
      ...session,
      walletAddress: refreshedWalletAddress,
      sessionToken: authorization.auth_token,
    };

    this.activeSession = refreshedSession;
    await this.storage.saveWalletSession(refreshedSession);
    logger.info('MWA session refreshed via authorize', { address: refreshedSession.walletAddress });

    return refreshedSession;
  }

  private isAdapterTimeoutError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return /timeout|timed out waiting for response|timeoutexception/i.test(message);
  }
}
