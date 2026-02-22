export type ProofEnvelopeType = 'quest' | 'notarize' | 'ticket';

export type QuestClaimLimit = 'once' | 'daily';

export interface QuestEnvelopePayload {
  title: string;
  description?: string;
  label?: string;
  location?: string;
  community?: string;
  badgeImage?: string;
  claimLimit: QuestClaimLimit;
  validFrom: string;
  validTo: string;
}

export interface NotarizeEnvelopePayload {
  proofId: string;
  title: string;
  description: string;
  ownerWallet: string;
  hash: string;
  timestampIso: string;
  fileName?: string;
  ipfsCid?: string;
}

export interface TicketEnvelopePayload {
  title: string;
  description?: string;
  eventName: string;
  venue?: string;
  validFrom: string;
  validTo: string;
  recipientWallet?: string;
  payloadHash: string;
}

export type ProofEnvelopePayloadByType = {
  quest: QuestEnvelopePayload;
  notarize: NotarizeEnvelopePayload;
  ticket: TicketEnvelopePayload;
};

export interface ProofEnvelope<T extends ProofEnvelopeType = ProofEnvelopeType> {
  version: 1;
  type: T;
  id: string;
  issuedAt: string;
  issuerPublicKey: string;
  payload: ProofEnvelopePayloadByType[T];
  issuerSignature: string;
}

export type AnyProofEnvelope =
  | ProofEnvelope<'quest'>
  | ProofEnvelope<'notarize'>
  | ProofEnvelope<'ticket'>;
