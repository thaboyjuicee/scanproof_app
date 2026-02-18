import nacl from 'tweetnacl';
import bs58 from 'bs58';

import { Proof } from '../../models/proof';
import { VerificationResult } from '../../models/verification-result';
import { hashProofInput } from '../../utils/hash';

const utf8Encode = (value: string): Uint8Array => new TextEncoder().encode(value);

export class VerificationService {
  verifyProof(proof: Proof): VerificationResult {
    const reasons: string[] = [];

    const expectedHash = hashProofInput({
      title: proof.title,
      description: proof.description,
      ownerWallet: proof.ownerWallet,
      timestampIso: proof.timestampIso,
    });

    const integrityValid = expectedHash === proof.hash;
    if (!integrityValid) {
      reasons.push('Proof hash does not match deterministic hash of content.');
    }

    const ownerValid = Boolean(proof.ownerWallet);
    if (!ownerValid) {
      reasons.push('Owner wallet is missing.');
    }

    let signatureValid = false;
    if (proof.signature && proof.signedMessage) {
      try {
        signatureValid = nacl.sign.detached.verify(
          utf8Encode(proof.signedMessage),
          bs58.decode(proof.signature),
          bs58.decode(proof.ownerWallet)
        );
      } catch {
        signatureValid = false;
      }
    }

    if (proof.signature && proof.signedMessage && !signatureValid) {
      reasons.push('Signature verification failed for owner wallet.');
    }

    const isValid = integrityValid && ownerValid && (!proof.signature || signatureValid);

    return {
      isValid,
      integrityValid,
      ownerValid,
      signatureValid,
      reasons,
    };
  }
}
