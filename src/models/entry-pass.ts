export interface EntryPass {
  type: 'scanproof_entrypass_v1';
  eventId: string;
  attendeeWallet: string;
  issuedAt: string;
  signature: string; // base58 encoded signature
}
