export interface Proof {
  id: string;
  title: string;
  description: string;
  ownerWallet: string;
  timestampIso: string;
  hash: string;
  ipfsCid?: string;
  signedMessage?: string;
  signature?: string;
}
