import { sha256 } from 'js-sha256';

import { TicketEnvelopePayload } from '../../models/proof-envelope';
import { canonicalJsonStringify } from '../../utils/canonical-json';

export interface TicketRedemptionLookup {
  findRedemptionSignature(ticketId: string, timeoutMs?: number): Promise<string | null>;
}

export class TicketService {
  buildPayloadHash(payload: Omit<TicketEnvelopePayload, 'payloadHash'>): string {
    return sha256(canonicalJsonStringify(payload));
  }

  formatRedeemMemo(ticketId: string, payloadHash: string): string {
    return `scanproof:redeem:${ticketId}:${payloadHash}`;
  }

  parseRedeemMemo(memo: string): { ticketId: string; payloadHash: string } | null {
    const parts = memo.split(':');
    if (parts.length !== 4 || parts[0] !== 'scanproof' || parts[1] !== 'redeem') {
      return null;
    }

    return {
      ticketId: parts[2],
      payloadHash: parts[3],
    };
  }

  async isRedeemed(ticketId: string, lookup: TicketRedemptionLookup, timeoutMs = 12000): Promise<{ redeemed: boolean; signature?: string }> {
    const signature = await lookup.findRedemptionSignature(ticketId, timeoutMs);
    if (!signature) {
      return { redeemed: false };
    }

    return {
      redeemed: true,
      signature,
    };
  }
}
