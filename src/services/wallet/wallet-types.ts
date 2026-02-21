import { SignedPayload } from '../../models/signed-payload';
import { WalletSession } from '../../models/wallet-session';

export interface WalletService {
  connect(): Promise<WalletSession>;
  signMessage(message: string): Promise<SignedPayload>;
  sendTransaction(serializedTransactionBase64: string): Promise<string>;
  verifySignedPayload(payload: SignedPayload): boolean;
  reconnectFromSavedSession(): Promise<WalletSession | null>;
  disconnect(): Promise<void>;
}

export interface DeepLinkTransport {
  openAndWait(url: string, redirectBase: string, timeoutMs?: number): Promise<Record<string, string>>;
}
