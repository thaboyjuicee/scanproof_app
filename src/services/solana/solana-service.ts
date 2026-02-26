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

  async createUnsignedMemoTransactionBase64(feePayer: string, memo: string): Promise<string> {
    const latestBlockhash = await this.connection.getLatestBlockhash('confirmed');

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
    const bytes = Base64.toUint8Array(serializedSignedTransactionBase64);
    return this.connection.sendRawTransaction(Buffer.from(bytes), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
      maxRetries: 3,
    });
  }

  async findRedemptionSignature(ticketId: string, timeoutMs = 12000): Promise<string | null> {
    const deadline = Date.now() + timeoutMs;
    const maxPages = 10; // Check up to 1000 transactions (10 pages × 100)
    let lastSignature: string | undefined;

    for (let page = 0; page < maxPages; page++) {
      if (Date.now() > deadline) {
        break;
      }

      let signatures;
      try {
        signatures = await this.connection.getSignaturesForAddress(
          MEMO_PROGRAM_ID,
          { limit: 100, before: lastSignature },
          'confirmed'
        );
      } catch {
        break;
      }

      if (signatures.length === 0) {
        break;
      }

      for (const item of signatures) {
        if (Date.now() > deadline) {
          return null;
        }

        let tx;
        try {
          tx = await this.connection.getTransaction(item.signature, {
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0,
          });
        } catch {
          continue;
        }

        if (!tx) {
          continue;
        }

        const instructions = (tx.transaction as any).message.instructions as any[];
        for (const instruction of instructions) {
          const memo = this.extractMemoFromInstruction(instruction);
          if (!memo) {
            continue;
          }

          if (memo.startsWith(`scanproof:redeem:${ticketId}:`)) {
            return item.signature;
          }
        }
      }

      lastSignature = signatures[signatures.length - 1]?.signature;
    }

    return null;
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
