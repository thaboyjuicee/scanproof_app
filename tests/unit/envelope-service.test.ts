import { EnvelopeService } from '../../src/services/envelope/envelope-service';

describe('EnvelopeService encode/decode + canonicalization', () => {
  const service = new EnvelopeService();

  it('encodes and decodes envelope via base64url JSON', () => {
    const envelope = {
      version: 1 as const,
      type: 'quest' as const,
      id: 'quest_1',
      issuedAt: '2026-02-20T10:00:00.000Z',
      issuerPublicKey: '11111111111111111111111111111111',
      payload: {
        title: 'Seeker Quest',
        claimLimit: 'once' as const,
        validFrom: '2026-02-20T10:00:00.000Z',
        validTo: '2026-02-21T10:00:00.000Z',
      },
      issuerSignature: '11111111111111111111111111111111',
    };

    const encoded = service.encodeToBase64Url(envelope);
    const decoded = service.decodeFromBase64Url(encoded);

    expect(decoded).toEqual(envelope);
  });

  it('canonical signing message is stable for same logical object', () => {
    const unsignedA = {
      version: 1 as const,
      type: 'ticket' as const,
      id: 'ticket_1',
      issuedAt: '2026-02-20T10:00:00.000Z',
      issuerPublicKey: 'issuer',
      payload: {
        eventName: 'Event',
        validFrom: '2026-02-20T10:00:00.000Z',
        validTo: '2026-02-21T10:00:00.000Z',
        payloadHash: 'hash123',
      },
    };

    const unsignedB = {
      payload: {
        payloadHash: 'hash123',
        validTo: '2026-02-21T10:00:00.000Z',
        eventName: 'Event',
        validFrom: '2026-02-20T10:00:00.000Z',
      },
      issuerPublicKey: 'issuer',
      id: 'ticket_1',
      type: 'ticket' as const,
      version: 1 as const,
      issuedAt: '2026-02-20T10:00:00.000Z',
    };

    const messageA = service.getCanonicalSigningMessage(unsignedA);
    const messageB = service.getCanonicalSigningMessage(unsignedB);

    expect(messageA).toBe(messageB);
  });
});
