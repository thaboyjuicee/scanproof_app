import { ProofEnvelope } from '../models/proof-envelope';
import { EntryPass } from '../models/entry-pass';
import { Proof } from '../models/proof';

export type RootStackParamList = {
  Home: undefined;
  NotarizeCreate: undefined;
  VerifyProof: undefined;
  QuestCreate: undefined;
  TicketCreate: undefined;
  EventCreate: undefined;
  QuestClaimVerify: { envelope: ProofEnvelope<'quest'> };
  NotarizeVerify: { envelope: ProofEnvelope<'notarize'> };
  TicketVerifyRedeem: { envelope: ProofEnvelope<'ticket'> };
  EventClaim: { envelope: ProofEnvelope<'event'> };
  EntryPass: { entryPass: EntryPass; eventEnvelope: ProofEnvelope<'event'> };
  EventDoorVerifyRedeem: { entryPass: EntryPass };
  ProofDetails: { proof: Proof };
  WalletConnect: undefined;
  QRScanner: undefined;
};

export type TabParamList = {
  HomeTab: undefined;
  CreateTab: undefined;
  ScanTab: undefined;
  ProofbookTab: undefined;
};
