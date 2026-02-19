import nacl from 'tweetnacl';
import bs58 from 'bs58';

import { Proof } from '../../src/models/proof';
import { hashProofInput } from '../../src/utils/hash';
import { VerificationService } from '../../src/services/verification/verification-service';

describe('VerificationService', () => {
  const service = new VerificationService();

  it('validates integrity and signature for untampered proof', () => {
    const signer = nacl.sign.keyPair();
    const message = 'ScanProof signed message';
    const signature = nacl.sign.detached(new TextEncoder().encode(message), signer.secretKey);

    const proof: Proof = {
      id: 'proof-1',
      title: 'Title',
      description: 'Description',
      ownerWallet: bs58.encode(signer.publicKey),
      timestampIso: '2026-02-18T12:00:00.000Z',
      hash: hashProofInput({
        title: 'Title',
        description: 'Description',
        ownerWallet: bs58.encode(signer.publicKey),
        timestampIso: '2026-02-18T12:00:00.000Z',
      }),
      proofType: 'text',
      signedMessage: message,
      signature: bs58.encode(signature),
    };

    const result = service.verifyProof(proof);

    expect(result.isValid).toBe(true);
    expect(result.integrityValid).toBe(true);
    expect(result.signatureValid).toBe(true);
  });

  it('flags tampered proof hash', () => {
    const proof: Proof = {
      id: 'proof-2',
      title: 'Original',
      description: 'Changed',
      ownerWallet: 'owner',
      timestampIso: '2026-02-18T12:00:00.000Z',
      hash: 'bad_hash',
      proofType: 'text',
    };

    const result = service.verifyProof(proof);

    expect(result.isValid).toBe(false);
    expect(result.integrityValid).toBe(false);
    expect(result.reasons.length).toBeGreaterThan(0);
  });
});
