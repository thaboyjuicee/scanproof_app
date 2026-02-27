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
  sendSignedTransactionBase64(serializedSignedTransactionBase64: string): Promise<string>;
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
    const messageBytes = utf8Encode(message);
    let signingWalletAddress = session.walletAddress;

    const signResult = await transact(async (wallet) => {
      const auth = await this.ensureAuthorized(wallet as any, session);
      signingWalletAddress = auth.walletAddress;

      const signatures = await wallet.signMessages({
        addresses: [auth.addressBase64],
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
      walletAddress: signingWalletAddress,
    };

    if (!this.verifySignedPayload(signedPayload)) {
      throw new AppError('Wallet signature verification failed.', 'WALLET_SIGNATURE_INVALID');
    }

    return signedPayload;
  }

  async sendTransaction(serializedTransactionBase64: string): Promise<string> {
    const session = await this.requireSession();

    const sendResult = await transact(async (wallet) => {
      const auth = await this.ensureAuthorized(wallet as any, session);

      const walletAny = wallet as any;
      const txBase64 = serializedTransactionBase64;
      const txBytes = base64ToUint8Array(txBase64);

      const attempts: Array<() => Promise<any>> = [
        () => walletAny.signAndSendTransactions({
          addresses: [auth.addressBase64],
          payloads: [txBase64],
        }),
        () => walletAny.signAndSendTransactions({
          addresses: [auth.addressBase64],
          transactions: [txBase64],
        }),
        () => walletAny.signAndSendTransactions({
          addresses: [auth.addressBase64],
          payloads: [uint8ArrayToBase64(txBytes)],
        }),
        () => walletAny.signAndSendTransactions({
          addresses: [auth.addressBase64],
          transactions: [txBytes],
        }),
      ];

      let lastError: unknown;
      for (const attempt of attempts) {
        try {
          return await attempt();
        } catch (error) {
          lastError = error;
        }
      }

      const signAttempts: Array<() => Promise<any>> = [
        () => walletAny.signTransactions({
          addresses: [auth.addressBase64],
          payloads: [txBase64],
        }),
        () => walletAny.signTransactions({
          addresses: [auth.addressBase64],
          transactions: [txBase64],
        }),
        () => walletAny.signTransactions({
          addresses: [auth.addressBase64],
          payloads: [uint8ArrayToBase64(txBytes)],
        }),
        () => walletAny.signTransactions({
          addresses: [auth.addressBase64],
          transactions: [txBytes],
        }),
      ];

      let signResult: any;
      for (const attempt of signAttempts) {
        try {
          signResult = await attempt();
          break;
        } catch (error) {
          lastError = error;
        }
      }

      const signedTxBase64 = this.extractSignedTransactionBase64(signResult);
      if (!signedTxBase64) {
        throw lastError ?? new AppError('Wallet transaction failed.', 'WALLET_TX_FAILED');
      }

      const signature = await this.solanaService.sendSignedTransactionBase64(signedTxBase64);
      return { signatures: [signature] };
    });

    const signatures = (sendResult as any)?.signatures as string[] | undefined;
    if (!signatures || signatures.length === 0) {
      throw new AppError('No transaction signature returned by wallet.', 'WALLET_TX_FAILED');
    }

    const first = signatures[0];
    return first.length > 80 ? first : base64ToString(first);
  }

  private async ensureAuthorized(wallet: any, session: WalletSession): Promise<{ addressBase64: string; walletAddress: string }> {
    try {
      await wallet.reauthorize({
        auth_token: session.sessionToken,
        identity: this.appIdentity,
      });

      const addressBase64 = uint8ArrayToBase64(bs58.decode(session.walletAddress));
      return {
        addressBase64,
        walletAddress: session.walletAddress,
      };
    } catch (error) {
      if (!this.isAuthorizationFailure(error)) {
        throw error;
      }

      const authorization = await wallet.authorize({
        cluster: session.cluster,
        identity: this.appIdentity,
      });

      if (!authorization.accounts || authorization.accounts.length === 0) {
        throw new AppError('No wallet accounts returned from authorization.', 'WALLET_NO_ACCOUNTS');
      }

      const addressBase64 = authorization.accounts[0].address;
      const addressBytes = base64ToUint8Array(addressBase64);
      const walletAddress = bs58.encode(addressBytes);

      const refreshedSession: WalletSession = {
        ...session,
        walletAddress,
        sessionToken: authorization.auth_token,
        connectedAtIso: new Date().toISOString(),
      };

      this.activeSession = refreshedSession;
      await this.storage.saveWalletSession(refreshedSession);

      return {
        addressBase64,
        walletAddress,
      };
    }
  }

  private isAuthorizationFailure(error: unknown): boolean {
    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    return message.includes('authorization request failed') || message.includes('reauthorize');
  }

  private extractSignedTransactionBase64(result: any): string | null {
    const candidate = result?.signed_payloads?.[0] ?? result?.transactions?.[0] ?? result?.signedTransactions?.[0];
    if (!candidate) {
      return null;
    }

    if (typeof candidate === 'string') {
      return candidate;
    }

    if (candidate instanceof Uint8Array) {
      return uint8ArrayToBase64(candidate);
    }

    if (Array.isArray(candidate)) {
      return uint8ArrayToBase64(new Uint8Array(candidate));
    }

    return null;
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
}
