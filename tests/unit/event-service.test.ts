import { EventService } from '../../src/services/event/event-service';

describe('EventService', () => {
  const service = new EventService();

  it('formats and parses claim memo', () => {
    const memo = service.formatClaimMemo('event_1', 'wallet_1');
    expect(memo).toBe('scanproof:claim:event_1:wallet_1');

    const parsed = service.parseClaimMemo(memo);
    expect(parsed).toEqual({ eventId: 'event_1', attendeeWallet: 'wallet_1' });
  });

  it('formats and parses redeem memo', () => {
    const memo = service.formatRedeemMemo('event_1', 'wallet_1');
    expect(memo).toBe('scanproof:redeem:event_1:wallet_1');

    const parsed = service.parseRedeemMemo(memo);
    expect(parsed).toEqual({ eventId: 'event_1', attendeeWallet: 'wallet_1' });
  });

  it('returns null for invalid memo format', () => {
    expect(service.parseClaimMemo('scanproof:claim:event_1')).toBeNull();
    expect(service.parseRedeemMemo('scanproof:redeem:event_1')).toBeNull();
  });

  it('enforces one-claim-per-wallet via lookup', async () => {
    const lookup = {
      findClaimSignature: async (eventId: string, wallet: string) => (eventId === 'event_1' && wallet === 'wallet_1' ? 'sig_123' : null),
      findRedeemSignature: async () => null,
      countClaimsForEvent: async () => 1,
    };

    const existing = await service.isClaimed('event_1', 'wallet_1', lookup);
    expect(existing).toEqual({ claimed: true, signature: 'sig_123' });

    const missing = await service.isClaimed('event_1', 'wallet_2', lookup);
    expect(missing).toEqual({ claimed: false });
  });
});
