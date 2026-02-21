import bs58 from 'bs58';
import nacl from 'tweetnacl';

import { env } from '../../config/env';
import { SignedPayload } from '../../models/signed-payload';
import { WalletSession } from '../../models/wallet-session';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { DeepLinkTransport, WalletService } from './wallet-types';

interface WalletStorage {
  saveWalletSession(session: WalletSession): Promise<void>;
  getWalletSession(): Promise<WalletSession | null>;
  clearWalletSession(): Promise<void>;
}

interface AccountValidator {
  isAccountValid(address: string): Promise<boolean>;
}

interface ConnectResponseData {
  public_key: string;
  session: string;
}

interface SignResponseData {
  signature: string;
}

const PHANTOM_BASE_URL = 'https://phantom.app/ul/v1';

const utf8Encode = (value: string): Uint8Array => new TextEncoder().encode(value);
const utf8Decode = (value: Uint8Array): string => new TextDecoder().decode(value);

const buildQuery = (params: Record<string, string>): string => {
  return Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
};

const decryptPayload = <T>(encryptedDataBase58: string, nonceBase58: string, sharedSecret: Uint8Array): T => {
  const decrypted = nacl.box.open.after(bs58.decode(encryptedDataBase58), bs58.decode(nonceBase58), sharedSecret);
  if (!decrypted) {
    throw new AppError('Unable to decrypt wallet response.', 'WALLET_DECRYPT_FAILED');
  }

  return JSON.parse(utf8Decode(decrypted)) as T;
};

const encryptPayload = (payload: Record<string, string>, sharedSecret: Uint8Array): { nonceBase58: string; dataBase58: string } => {
  const nonce = nacl.randomBytes(24);
  const encrypted = nacl.box.after(utf8Encode(JSON.stringify(payload)), nonce, sharedSecret);
  return {
    nonceBase58: bs58.encode(nonce),
    dataBase58: bs58.encode(encrypted),
  };
};

export class PhantomWalletService implements WalletService {
  private activeSession: WalletSession | null = null;

  constructor(
    private readonly transport: DeepLinkTransport,
    private readonly storage: WalletStorage,
    private readonly solanaService: AccountValidator
  ) {}

  async connect(): Promise<WalletSession> {
    const dappKeypair = nacl.box.keyPair();
    const dappPublicKeyBase58 = bs58.encode(dappKeypair.publicKey);

    const query = buildQuery({
      dapp_encryption_public_key: dappPublicKeyBase58,
      cluster: env.solanaCluster,
      app_url: env.phantomAppUrl,
      redirect_link: env.phantomRedirectUri,
    });

    const response = await this.transport.openAndWait(
      `${PHANTOM_BASE_URL}/connect?${query}`,
      env.phantomRedirectUri
    );

    const phantomEncryptionPublicKey = response.phantom_encryption_public_key;
    const nonce = response.nonce;
    const encryptedData = response.data;

    if (!phantomEncryptionPublicKey || !nonce || !encryptedData) {
      throw new AppError('Malformed wallet connect response.', 'WALLET_CONNECT_INVALID_RESPONSE');
    }

    const sharedSecret = nacl.box.before(bs58.decode(phantomEncryptionPublicKey), dappKeypair.secretKey);
    const connectPayload = decryptPayload<ConnectResponseData>(encryptedData, nonce, sharedSecret);

    const session: WalletSession = {
      walletAddress: connectPayload.public_key,
      sessionToken: connectPayload.session,
      sharedSecretBase58: bs58.encode(sharedSecret),
      dappSecretKeyBase58: bs58.encode(dappKeypair.secretKey),
      phantomEncryptionPublicKeyBase58: phantomEncryptionPublicKey,
      cluster: env.solanaCluster,
      connectedAtIso: new Date().toISOString(),
    };

    this.activeSession = session;
    await this.storage.saveWalletSession(session);
    logger.info('Wallet connected', { address: session.walletAddress });

    return session;
  }

  async signMessage(message: string): Promise<SignedPayload> {
    const session = await this.requireSession();
    const sharedSecret = bs58.decode(session.sharedSecretBase58);
    const dappSecretKey = bs58.decode(session.dappSecretKeyBase58);
    const dappPublicKeyBase58 = bs58.encode(nacl.box.keyPair.fromSecretKey(dappSecretKey).publicKey);

    const payload = encryptPayload(
      {
        message: bs58.encode(utf8Encode(message)),
        session: session.sessionToken,
        display: 'utf8',
      },
      sharedSecret
    );

    const query = buildQuery({
      dapp_encryption_public_key: dappPublicKeyBase58,
      nonce: payload.nonceBase58,
      redirect_link: env.phantomRedirectUri,
      payload: payload.dataBase58,
    });

    const response = await this.transport.openAndWait(
      `${PHANTOM_BASE_URL}/signMessage?${query}`,
      env.phantomRedirectUri
    );

    const nonce = response.nonce;
    const encryptedData = response.data;

    if (!nonce || !encryptedData) {
      throw new AppError('Malformed wallet sign response.', 'WALLET_SIGN_INVALID_RESPONSE');
    }

    const signPayload = decryptPayload<SignResponseData>(encryptedData, nonce, sharedSecret);

    const signedPayload: SignedPayload = {
      message,
      signatureBase58: signPayload.signature,
      walletAddress: session.walletAddress,
    };

    if (!this.verifySignedPayload(signedPayload)) {
      throw new AppError('Wallet signature verification failed.', 'WALLET_SIGNATURE_INVALID');
    }

    return signedPayload;
  }

  async sendTransaction(): Promise<string> {
    throw new AppError('Transaction sending is not implemented for Phantom deep-link service.', 'WALLET_TX_UNSUPPORTED');
  }

  verifySignedPayload(payload: SignedPayload): boolean {
    return nacl.sign.detached.verify(
      utf8Encode(payload.message),
      bs58.decode(payload.signatureBase58),
      bs58.decode(payload.walletAddress)
    );
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
        const sharedSecret = bs58.decode(session.sharedSecretBase58);
        const dappSecretKey = bs58.decode(session.dappSecretKeyBase58);
        const dappPublicKeyBase58 = bs58.encode(nacl.box.keyPair.fromSecretKey(dappSecretKey).publicKey);

        const payload = encryptPayload(
          {
            session: session.sessionToken,
          },
          sharedSecret
        );

        const query = buildQuery({
          dapp_encryption_public_key: dappPublicKeyBase58,
          nonce: payload.nonceBase58,
          redirect_link: env.phantomRedirectUri,
          payload: payload.dataBase58,
        });

        await this.transport.openAndWait(`${PHANTOM_BASE_URL}/disconnect?${query}`, env.phantomRedirectUri, 30000);
      } catch (error) {
        logger.warn('Wallet disconnect deep-link failed, continuing with local session clear.', error);
      }
    }

    this.activeSession = null;
    await this.storage.clearWalletSession();
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
