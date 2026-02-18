import bs58 from 'bs58';
import nacl from 'tweetnacl';

import { WalletSession } from '../../src/models/wallet-session';
import { PhantomWalletService } from '../../src/services/wallet/phantom-wallet-service';
import { DeepLinkTransport } from '../../src/services/wallet/wallet-types';

interface InMemoryWalletStorage {
  current: WalletSession | null;
  saveWalletSession(session: WalletSession): Promise<void>;
  getWalletSession(): Promise<WalletSession | null>;
  clearWalletSession(): Promise<void>;
}

const utf8Encode = (value: string): Uint8Array => new TextEncoder().encode(value);
const utf8Decode = (value: Uint8Array): string => new TextDecoder().decode(value);

class FakePhantomTransport implements DeepLinkTransport {
  private readonly walletSigner = nacl.sign.keyPair();
  private readonly phantomEncryption = nacl.box.keyPair();

  async openAndWait(url: string): Promise<Record<string, string>> {
    const parsed = new URL(url);

    if (parsed.pathname.endsWith('/connect')) {
      return this.handleConnect(parsed);
    }

    if (parsed.pathname.endsWith('/signMessage')) {
      return this.handleSignMessage(parsed);
    }

    if (parsed.pathname.endsWith('/disconnect')) {
      return {};
    }

    throw new Error('Unhandled deeplink endpoint in test transport');
  }

  private handleConnect(url: URL): Record<string, string> {
    const dappPublicKey = url.searchParams.get('dapp_encryption_public_key');
    if (!dappPublicKey) {
      throw new Error('Missing dapp_encryption_public_key');
    }

    const sharedSecret = nacl.box.before(bs58.decode(dappPublicKey), this.phantomEncryption.secretKey);
    const nonce = nacl.randomBytes(24);

    const payload = {
      public_key: bs58.encode(this.walletSigner.publicKey),
      session: 'session-token-1',
    };

    const encrypted = nacl.box.after(utf8Encode(JSON.stringify(payload)), nonce, sharedSecret);

    return {
      phantom_encryption_public_key: bs58.encode(this.phantomEncryption.publicKey),
      nonce: bs58.encode(nonce),
      data: bs58.encode(encrypted),
    };
  }

  private handleSignMessage(url: URL): Record<string, string> {
    const dappPublicKey = url.searchParams.get('dapp_encryption_public_key');
    const nonce = url.searchParams.get('nonce');
    const encryptedPayload = url.searchParams.get('payload');

    if (!dappPublicKey || !nonce || !encryptedPayload) {
      throw new Error('Missing required signMessage params');
    }

    const sharedSecret = nacl.box.before(bs58.decode(dappPublicKey), this.phantomEncryption.secretKey);
    const decrypted = nacl.box.open.after(bs58.decode(encryptedPayload), bs58.decode(nonce), sharedSecret);

    if (!decrypted) {
      throw new Error('Unable to decrypt sign payload in test transport');
    }

    const request = JSON.parse(utf8Decode(decrypted)) as { message: string };
    const message = bs58.decode(request.message);
    const signature = nacl.sign.detached(message, this.walletSigner.secretKey);

    const responseNonce = nacl.randomBytes(24);
    const responsePayload = {
      signature: bs58.encode(signature),
    };

    const encryptedResponse = nacl.box.after(utf8Encode(JSON.stringify(responsePayload)), responseNonce, sharedSecret);

    return {
      nonce: bs58.encode(responseNonce),
      data: bs58.encode(encryptedResponse),
    };
  }
}

describe('PhantomWalletService integration boundaries', () => {
  const createStorage = (): InMemoryWalletStorage => {
    return {
      current: null,
      async saveWalletSession(session: WalletSession): Promise<void> {
        this.current = session;
      },
      async getWalletSession(): Promise<WalletSession | null> {
        return this.current;
      },
      async clearWalletSession(): Promise<void> {
        this.current = null;
      },
    };
  };

  it('connects, signs, verifies, restores, and disconnects session', async () => {
    const storage = createStorage();
    const transport = new FakePhantomTransport();

    const walletService = new PhantomWalletService(transport, storage, {
      isAccountValid: async () => true,
    });

    const session = await walletService.connect();
    expect(session.walletAddress).toBeTruthy();

    const signed = await walletService.signMessage('sign-in challenge');
    expect(signed.walletAddress).toBe(session.walletAddress);
    expect(walletService.verifySignedPayload(signed)).toBe(true);

    const restored = await walletService.reconnectFromSavedSession();
    expect(restored?.walletAddress).toBe(session.walletAddress);

    await walletService.disconnect();
    const afterDisconnect = await walletService.reconnectFromSavedSession();
    expect(afterDisconnect).toBeNull();
  });
});
