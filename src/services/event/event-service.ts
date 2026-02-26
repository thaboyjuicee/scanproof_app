export interface EventClaimLookup {
  findClaimSignature(eventId: string, attendeeWallet: string, timeoutMs?: number): Promise<string | null>;
  findRedeemSignature(eventId: string, attendeeWallet: string, timeoutMs?: number): Promise<string | null>;
  countClaimsForEvent(eventId: string, timeoutMs?: number): Promise<number>;
}

export class EventService {
  formatClaimMemo(eventId: string, attendeeWallet: string): string {
    return `scanproof:claim:${eventId}:${attendeeWallet}`;
  }

  formatRedeemMemo(eventId: string, attendeeWallet: string): string {
    return `scanproof:redeem:${eventId}:${attendeeWallet}`;
  }

  parseClaimMemo(memo: string): { eventId: string; attendeeWallet: string } | null {
    const parts = memo.split(':');
    if (parts.length !== 4 || parts[0] !== 'scanproof' || parts[1] !== 'claim') {
      return null;
    }

    return {
      eventId: parts[2],
      attendeeWallet: parts[3],
    };
  }

  parseRedeemMemo(memo: string): { eventId: string; attendeeWallet: string } | null {
    const parts = memo.split(':');
    if (parts.length !== 4 || parts[0] !== 'scanproof' || parts[1] !== 'redeem') {
      return null;
    }

    return {
      eventId: parts[2],
      attendeeWallet: parts[3],
    };
  }

  async isClaimed(
    eventId: string,
    attendeeWallet: string,
    lookup: EventClaimLookup,
    timeoutMs = 12000
  ): Promise<{ claimed: boolean; signature?: string }> {
    const signature = await lookup.findClaimSignature(eventId, attendeeWallet, timeoutMs);
    if (!signature) {
      return { claimed: false };
    }

    return {
      claimed: true,
      signature,
    };
  }

  async isRedeemed(
    eventId: string,
    attendeeWallet: string,
    lookup: EventClaimLookup,
    timeoutMs = 12000
  ): Promise<{ redeemed: boolean; signature?: string }> {
    const signature = await lookup.findRedeemSignature(eventId, attendeeWallet, timeoutMs);
    if (!signature) {
      return { redeemed: false };
    }

    return {
      redeemed: true,
      signature,
    };
  }

  async countClaims(eventId: string, lookup: EventClaimLookup, timeoutMs = 12000): Promise<number> {
    return lookup.countClaimsForEvent(eventId, timeoutMs);
  }
}
