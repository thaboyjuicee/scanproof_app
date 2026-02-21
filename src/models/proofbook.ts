import { AnyProofEnvelope } from './proof-envelope';

export interface QuestClaimRecord {
  id: string;
  envelopeId: string;
  walletAddress: string;
  claimedAt: string;
  claimDateKey: string;
  claimSignature: string;
}

export interface ScanHistoryRecord {
  id: string;
  envelopeId: string;
  envelopeType: AnyProofEnvelope['type'];
  scannedAt: string;
  status: 'ok' | 'error';
  message: string;
}

export interface TicketRedemptionRecord {
  id: string;
  envelopeId: string;
  ticketId: string;
  redeemerWallet: string;
  redeemedAt: string;
  txSignature: string;
}
