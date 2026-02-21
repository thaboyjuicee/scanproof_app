import { TicketService } from '../../src/services/ticket/ticket-service';

describe('TicketService redeemed check logic', () => {
  it('returns redeemed true when lookup finds a signature', async () => {
    const service = new TicketService();
    const result = await service.isRedeemed(
      'ticket_1',
      {
        findRedemptionSignature: async () => 'tx_signature_1',
      }
    );

    expect(result.redeemed).toBe(true);
    expect(result.signature).toBe('tx_signature_1');
  });

  it('returns redeemed false when lookup returns null', async () => {
    const service = new TicketService();
    const result = await service.isRedeemed(
      'ticket_2',
      {
        findRedemptionSignature: async () => null,
      }
    );

    expect(result.redeemed).toBe(false);
    expect(result.signature).toBeUndefined();
  });
});
