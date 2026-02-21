import bs58 from 'bs58';
import nacl from 'tweetnacl';

import { EnvelopeService } from '../../src/services/envelope/envelope-service';

describe('EnvelopeService signature verification', () => {
  const service = new EnvelopeService();

  it('verifies issuer signature for untampered envelope', () => {
    const keypair = nacl.sign.keyPair();
    const issuerPublicKey = bs58.encode(keypair.publicKey);
    const unsigned = service.createUnsignedEnvelope({
      type: 'quest',
      id: 'quest_abc',
      issuerPublicKey,
      payload: {
        title: 'Quest',
        claimLimit: 'once',
        validFrom: '2026-02-20T10:00:00.000Z',
        validTo: '2026-02-21T10:00:00.000Z',
      },
      issuedAt: '2026-02-20T10:00:00.000Z',
    });

    const message = service.getCanonicalSigningMessage(unsigned);
    const signature = nacl.sign.detached(new TextEncoder().encode(message), keypair.secretKey);

    const envelope = service.signEnvelope(unsigned, {
      walletAddress: issuerPublicKey,
      message,
      signatureBase58: bs58.encode(signature),
    });

    expect(service.verifyEnvelopeSignature(envelope)).toBe(true);
  });

  it('fails verification when payload is tampered', () => {
    const keypair = nacl.sign.keyPair();
    const issuerPublicKey = bs58.encode(keypair.publicKey);
    const unsigned = service.createUnsignedEnvelope({
      type: 'quest',
      id: 'quest_abc',
      issuerPublicKey,
      payload: {
        title: 'Quest',
        claimLimit: 'once',
        validFrom: '2026-02-20T10:00:00.000Z',
        validTo: '2026-02-21T10:00:00.000Z',
      },
      issuedAt: '2026-02-20T10:00:00.000Z',
    });

    const message = service.getCanonicalSigningMessage(unsigned);
    const signature = nacl.sign.detached(new TextEncoder().encode(message), keypair.secretKey);

    const envelope = service.signEnvelope(unsigned, {
      walletAddress: issuerPublicKey,
      message,
      signatureBase58: bs58.encode(signature),
    });

    const tampered = {
      ...envelope,
      payload: {
        ...envelope.payload,
        title: 'Quest (tampered)',
      },
    };

    expect(service.verifyEnvelopeSignature(tampered)).toBe(false);
  });
});
