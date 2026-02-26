import bs58 from 'bs58';
import { Buffer } from 'buffer';
import { Base64 } from 'js-base64';
import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

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

  async waitForSignatureConfirmation(signature: string, timeoutMs = 45000, pollIntervalMs = 2000): Promise<boolean> {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() <= deadline) {
      const confirmed = await this.isSignatureConfirmed(signature);
      if (confirmed) {
        return true;
      }

      await this.sleep(pollIntervalMs);
    }

    return false;
  }

  async createUnsignedMemoTransactionBase64(feePayer: string, memo: string): Promise<string> {
    const latestBlockhash = await this.withRpcRetry(() => this.connection.getLatestBlockhash('confirmed'));

    const transaction = new Transaction({
      feePayer: new PublicKey(feePayer),
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    });

    transaction.add(
      new TransactionInstruction({
        keys: [],
        programId: MEMO_PROGRAM_ID,
        data: Buffer.from(new TextEncoder().encode(memo)),
      })
    );

    const serialized = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

    return Base64.fromUint8Array(new Uint8Array(serialized));
  }

  async sendSignedTransactionBase64(serializedSignedTransactionBase64: string): Promise<string> {
    const rawTransaction = Buffer.from(Base64.toUint8Array(serializedSignedTransactionBase64));
    return this.withRpcRetry(() => this.connection.sendRawTransaction(rawTransaction, {
      preflightCommitment: 'confirmed',
      maxRetries: 3,
    }));
  }

  async findRedemptionSignature(ticketId: string, timeoutMs = 12000): Promise<string | null> {
    return this.findMatchingMemoSignature((memo) => memo.startsWith(`scanproof:redeem:${ticketId}:`), timeoutMs);
  }

  async findClaimSignature(eventId: string, attendeeWallet: string, timeoutMs = 12000): Promise<string | null> {
    const expected = `scanproof:claim:${eventId}:${attendeeWallet}`;
    return this.findMatchingMemoSignatureForWallet(attendeeWallet, (memo) => memo === expected, timeoutMs);
  }

  async findRedeemSignature(eventId: string, attendeeWallet: string, timeoutMs = 12000): Promise<string | null> {
    const expected = `scanproof:redeem:${eventId}:${attendeeWallet}`;
    return this.findMatchingMemoSignature((memo) => memo === expected, timeoutMs);
  }

  async countClaimsForEvent(eventId: string, timeoutMs = 12000): Promise<number> {
    const deadline = Date.now() + timeoutMs;
    const maxPages = 2;
    let lastSignature: string | undefined;
    const wallets = new Set<string>();

    for (let page = 0; page < maxPages; page++) {
      if (Date.now() > deadline) {
        break;
      }

      const signatures = await this.fetchMemoSignaturesPage(lastSignature);
      if (!signatures || signatures.length === 0) {
        break;
      }

      for (const item of signatures) {
        if (Date.now() > deadline) {
          return wallets.size;
        }

        const tx = await this.fetchTransaction(item.signature);
        if (!tx) {
          continue;
        }

        const instructions = this.getTransactionInstructions(tx);
        for (const instruction of instructions) {
          const memo = this.extractMemoFromInstruction(instruction);
          if (!memo) {
            continue;
          }

          const parsed = this.parseClaimMemo(memo);
          if (!parsed || parsed.eventId !== eventId) {
            continue;
          }

          wallets.add(parsed.attendeeWallet);
        }
      }

      lastSignature = signatures[signatures.length - 1]?.signature;
    }

    return wallets.size;
  }

  private parseClaimMemo(memo: string): { eventId: string; attendeeWallet: string } | null {
    const parts = memo.split(':');
    if (parts.length !== 4 || parts[0] !== 'scanproof' || parts[1] !== 'claim') {
      return null;
    }

    return {
      eventId: parts[2],
      attendeeWallet: parts[3],
    };
  }

  private async findMatchingMemoSignature(matcher: (memo: string) => boolean, timeoutMs: number): Promise<string | null> {
    const deadline = Date.now() + timeoutMs;
    const maxPages = 8;
    let lastSignature: string | undefined;

    for (let page = 0; page < maxPages; page++) {
      if (Date.now() > deadline) {
        break;
      }

      const signatures = await this.fetchMemoSignaturesPage(lastSignature);
      if (!signatures) {
        break;
      }

      if (signatures.length === 0) {
        break;
      }

      for (const item of signatures) {
        if (Date.now() > deadline) {
          return null;
        }

        const tx = await this.fetchTransaction(item.signature);

        if (!tx) {
          continue;
        }

        const instructions = this.getTransactionInstructions(tx);
        for (const instruction of instructions) {
          const memo = this.extractMemoFromInstruction(instruction);
          if (!memo) {
            continue;
          }

          if (matcher(memo)) {
            return item.signature;
          }
        }
      }

      lastSignature = signatures[signatures.length - 1]?.signature;
    }

    return null;
  }

  private async findMatchingMemoSignatureForWallet(
    wallet: string,
    matcher: (memo: string) => boolean,
    timeoutMs: number
  ): Promise<string | null> {
    const deadline = Date.now() + timeoutMs;
    const maxPages = 4;
    let lastSignature: string | undefined;
    let walletPublicKey: PublicKey;

    try {
      walletPublicKey = new PublicKey(wallet);
    } catch {
      return null;
    }

    for (let page = 0; page < maxPages; page++) {
      if (Date.now() > deadline) {
        break;
      }

      const signatures = await this.fetchSignaturesForAddress(walletPublicKey, lastSignature);
      if (!signatures || signatures.length === 0) {
        break;
      }

      for (const item of signatures) {
        if (Date.now() > deadline) {
          return null;
        }

        const tx = await this.fetchTransaction(item.signature);
        if (!tx) {
          continue;
        }

        const instructions = this.getTransactionInstructions(tx);
        for (const instruction of instructions) {
          const memo = this.extractMemoFromInstruction(instruction);
          if (!memo) {
            continue;
          }

          if (matcher(memo)) {
            return item.signature;
          }
        }
      }

      lastSignature = signatures[signatures.length - 1]?.signature;
    }

    return null;
  }

  private async fetchMemoSignaturesPage(before?: string): Promise<Array<{ signature: string }> | null> {
    try {
      return await this.withRpcRetry(() => this.connection.getSignaturesForAddress(
        MEMO_PROGRAM_ID,
        { limit: 30, before },
        'confirmed'
      ));
    } catch {
      return null;
    }
  }

  private async fetchSignaturesForAddress(address: PublicKey, before?: string): Promise<Array<{ signature: string }> | null> {
    try {
      return await this.withRpcRetry(() => this.connection.getSignaturesForAddress(
        address,
        { limit: 50, before },
        'confirmed'
      ));
    } catch {
      return null;
    }
  }

  private async fetchTransaction(signature: string): Promise<any | null> {
    try {
      return await this.withRpcRetry(() => this.connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      }));
    } catch {
      return null;
    }
  }

  private async withRpcRetry<T>(operation: () => Promise<T>, maxAttempts = 3, baseDelayMs = 250): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (!this.isRetryableRpcError(error) || attempt === maxAttempts) {
          throw error;
        }

        const jitter = Math.floor(Math.random() * 100);
        const delayMs = baseDelayMs * Math.pow(2, attempt - 1) + jitter;
        await this.sleep(delayMs);
      }
    }

    throw lastError instanceof Error ? lastError : new Error('RPC request failed');
  }

  private isRetryableRpcError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return /429|too many requests|timeout|timed out|fetch failed|network request failed|econnreset|socket hang up/i.test(message);
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  private getTransactionInstructions(tx: any): any[] {
    const message = tx?.transaction?.message;
    if (!message || typeof message !== 'object') {
      return [];
    }

    if (Array.isArray(message.instructions)) {
      return message.instructions;
    }

    if (Array.isArray(message.compiledInstructions)) {
      return message.compiledInstructions;
    }

    return [];
  }

  private extractMemoFromInstruction(instruction: any): string | null {
    if (instruction?.program === 'spl-memo' && typeof instruction?.parsed === 'string') {
      return instruction.parsed;
    }

    if (typeof instruction?.data === 'string') {
      try {
        return new TextDecoder().decode(bs58.decode(instruction.data));
      } catch {
        return null;
      }
    }

    return null;
  }
}
