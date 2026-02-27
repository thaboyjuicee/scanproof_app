import { EnvelopeService } from '../../src/services/envelope/envelope-service';
import { Base64 } from 'js-base64';

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

  it('produces shorter QR payload than verbose envelope JSON', () => {
    const envelope = {
      version: 1 as const,
      type: 'ticket' as const,
      id: 'ticket_1',
      issuedAt: '2026-02-20T10:00:00.000Z',
      issuerPublicKey: '6JYQ37kEE4g2ptXmWQKx3S5nqSDs8z3aJQj3sWQ2L5x9',
      payload: {
        title: 'Summit Ticket',
        eventName: 'ScanProof Summit',
        venue: 'Solana Hall',
        validFrom: '2026-02-20T10:00:00.000Z',
        validTo: '2026-02-21T10:00:00.000Z',
        recipientWallet: '9MBf8tmN6wEyguSqwBLvYUNqQvqj8P57N4RJjaWh2FK8',
        payloadHash: 'c33a300f5ebf3f32f95f1f8e2c37a0d14f8bf2d734cb4b8f5872bfcf0e4d6c3a',
      },
      issuerSignature: '5fW3JX4Fz5hW3x5f4cYsvHnL8YmUt6zL8Qby5LmSv7WmLhSbL5KTRr7jXK5pu7wNf2T3pFFkgM1RvQfJm5Qx3zF',
    };

    const compactEncoded = service.encodeToBase64Url(envelope);
    const legacyEncoded = Base64.fromUint8Array(new TextEncoder().encode(JSON.stringify(envelope)), true);

    expect(compactEncoded.length).toBeLessThan(legacyEncoded.length);
  });

  it('canonical signing message is stable for same logical object', () => {
    const unsignedA = {
      version: 1 as const,
      type: 'ticket' as const,
      id: 'ticket_1',
      issuedAt: '2026-02-20T10:00:00.000Z',
      issuerPublicKey: 'issuer',
      payload: {
        title: 'Event Ticket',
        eventName: 'Event',
        validFrom: '2026-02-20T10:00:00.000Z',
        validTo: '2026-02-21T10:00:00.000Z',
        payloadHash: 'hash123',
      },
    };

    const unsignedB = {
      payload: {
        title: 'Event Ticket',
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
