export type ProofType = 'text' | 'photo' | 'document';

export interface Proof {
  id: string;
  title: string;
  description: string;
  ownerWallet: string;
  timestampIso: string;
  hash: string;
  proofType: ProofType;
  fileUrl?: string;
  fileName?: string;
  ipfsCid?: string;
  qrCode?: string;
  signedMessage?: string;
  signature?: string;
}
