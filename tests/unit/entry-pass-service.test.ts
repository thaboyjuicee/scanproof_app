import { EntryPassService } from '../../src/services/entry-pass/entry-pass-service';

describe('EntryPassService', () => {
  const service = new EntryPassService();

  it('encodes and decodes entry pass QR payload', () => {
    const pass = {
      type: 'scanproof_entrypass_v1' as const,
      eventId: 'event_123',
      attendeeWallet: 'wallet_abc',
      issuedAt: '2026-02-24T10:00:00.000Z',
    };

    const qr = service.encodeEntryPassToQr(pass);
    expect(qr.startsWith('scanproof:entrypass:')).toBe(true);

    const decoded = service.decodeEntryPassFromQr(qr);
    expect(decoded).toEqual(pass);
  });

  it('throws on invalid QR prefix', () => {
    expect(() => service.decodeEntryPassFromQr('scanproof:ticket:abc')).toThrow();
  });

  it('throws on invalid payload shape', () => {
    const invalidBase64Url = 'eyJ0eXBlIjoic2NhbnByb29mX2VudHJ5cGFzc192MSIsImV2ZW50SWQiOiIiLCJhdHRlbmRlZVdhbGxldCI6IiIsImlzc3VlZEF0Ijoibm90LWRhdGUifQ';
    expect(() => service.decodeEntryPassFromQr(`scanproof:entrypass:${invalidBase64Url}`)).toThrow();
  });
});
