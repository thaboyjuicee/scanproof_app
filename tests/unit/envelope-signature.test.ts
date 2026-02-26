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

  it('verifies legacy notarize envelope where compact QR dropped empty optional fields', () => {
    const keypair = nacl.sign.keyPair();
    const issuerPublicKey = bs58.encode(keypair.publicKey);

    const unsignedLegacy = {
      version: 1 as const,
      type: 'notarize' as const,
      id: 'proof_legacy',
      issuedAt: '2026-02-20T10:00:00.000Z',
      issuerPublicKey,
      payload: {
        proofId: 'proof_legacy',
        title: 'Legacy Proof',
        description: 'Legacy description',
        ownerWallet: issuerPublicKey,
        hash: 'abc123',
        timestampIso: '2026-02-20T10:00:00.000Z',
        fileName: '',
        ipfsCid: '',
      },
    };

    const message = service.getCanonicalSigningMessage(unsignedLegacy);
    const signature = nacl.sign.detached(new TextEncoder().encode(message), keypair.secretKey);

    const envelope = {
      ...unsignedLegacy,
      issuerSignature: bs58.encode(signature),
    };

    const encoded = service.encodeToBase64Url(envelope);
    const decoded = service.decodeFromBase64Url(encoded);

    expect(decoded.payload).not.toHaveProperty('fileName');
    expect(decoded.payload).not.toHaveProperty('ipfsCid');
    expect(service.verifyEnvelopeSignature(decoded)).toBe(true);
  });

  it('verifies legacy notarize envelope where compact QR dropped undefined optional fields', () => {
    const keypair = nacl.sign.keyPair();
    const issuerPublicKey = bs58.encode(keypair.publicKey);

    const unsignedLegacy = {
      version: 1 as const,
      type: 'notarize' as const,
      id: 'proof_legacy_undef',
      issuedAt: '2026-02-20T10:00:00.000Z',
      issuerPublicKey,
      payload: {
        proofId: 'proof_legacy_undef',
        title: 'Legacy Undefined Proof',
        description: 'Legacy description',
        ownerWallet: issuerPublicKey,
        hash: 'abc456',
        timestampIso: '2026-02-20T10:00:00.000Z',
        fileName: undefined,
        ipfsCid: undefined,
      },
    };

    const message = service.getCanonicalSigningMessage(unsignedLegacy as any);
    const signature = nacl.sign.detached(new TextEncoder().encode(message), keypair.secretKey);

    const envelope = {
      ...unsignedLegacy,
      issuerSignature: bs58.encode(signature),
    };

    const encoded = service.encodeToBase64Url(envelope as any);
    const decoded = service.decodeFromBase64Url(encoded);

    expect(decoded.payload).not.toHaveProperty('fileName');
    expect(decoded.payload).not.toHaveProperty('ipfsCid');
    expect(service.verifyEnvelopeSignature(decoded)).toBe(true);
  });

  it('normalizes empty optional fields before signing new envelopes', () => {
    const unsigned = service.createUnsignedEnvelope({
      type: 'notarize',
      id: 'proof_new',
      issuerPublicKey: 'issuer_pubkey',
      payload: {
        proofId: 'proof_new',
        title: 'New Proof',
        description: 'New description',
        ownerWallet: 'owner_pubkey',
        hash: 'hash_new',
        timestampIso: '2026-02-20T10:00:00.000Z',
        fileName: '',
        ipfsCid: '',
      },
      issuedAt: '2026-02-20T10:00:00.000Z',
    });

    expect(unsigned.payload).not.toHaveProperty('fileName');
    expect(unsigned.payload).not.toHaveProperty('ipfsCid');
  });
});
