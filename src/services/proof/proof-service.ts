import { Proof, ProofType } from '../../models/proof';
import { SignedPayload } from '../../models/signed-payload';
import { hashProofInput } from '../../utils/hash';

interface CreateProofInput {
  title: string;
  description: string;
  ownerWallet: string;
  proofType: ProofType;
  fileUrl?: string;
  fileName?: string;
  fileHash?: string;
  signedPayload?: SignedPayload;
}

const createProofId = (): string => {
  const random = Math.random().toString(36).slice(2, 10);
  return `proof_${Date.now()}_${random}`;
};

export class ProofService {
  createProof(input: CreateProofInput): Proof {
    const timestampIso = new Date().toISOString();

    const hash = hashProofInput({
      title: input.title,
      description: input.description,
      ownerWallet: input.ownerWallet,
      timestampIso,
    });

    return {
      id: createProofId(),
      title: input.title.trim(),
      description: input.description.trim(),
      ownerWallet: input.ownerWallet.trim(),
      timestampIso,
      hash,
      proofType: input.proofType,
      fileUrl: input.fileUrl,
      fileName: input.fileName,
      fileHash: input.fileHash,
      signedMessage: input.signedPayload?.message,
      signature: input.signedPayload?.signatureBase58,
    };
  }
}
