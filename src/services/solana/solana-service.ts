import { Connection, PublicKey } from '@solana/web3.js';

export class SolanaService {
  private readonly connection: Connection;

  constructor(rpcUrl: string) {
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  async isAccountValid(address: string): Promise<boolean> {
    try {
      const key = new PublicKey(address);
      const accountInfo = await this.connection.getAccountInfo(key, 'confirmed');
      return accountInfo !== null;
    } catch {
      return false;
    }
  }

  async isSignatureConfirmed(signature: string): Promise<boolean> {
    try {
      const result = await this.connection.getSignatureStatuses([signature]);
      const status = result.value[0];
      return Boolean(status?.confirmationStatus === 'confirmed' || status?.confirmationStatus === 'finalized');
    } catch {
      return false;
    }
  }
}
