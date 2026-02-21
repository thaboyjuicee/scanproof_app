import { TicketService } from '../../src/services/ticket/ticket-service';

describe('TicketService memo formatting', () => {
  it('formats redemption memo as scanproof:redeem:<ticketId>:<payloadHash>', () => {
    const service = new TicketService();
    const memo = service.formatRedeemMemo('ticket_123', 'hash_abc');

    expect(memo).toBe('scanproof:redeem:ticket_123:hash_abc');
  });
});
