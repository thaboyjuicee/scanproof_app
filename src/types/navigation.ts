import { ProofEnvelope } from '../models/proof-envelope';
import { Proof } from '../models/proof';

export type RootStackParamList = {
  Home: undefined;
  NotarizeCreate: undefined;
  VerifyProof: undefined;
  QuestCreate: undefined;
  TicketCreate: undefined;
  QuestClaimVerify: { envelope: ProofEnvelope<'quest'> };
  NotarizeVerify: { envelope: ProofEnvelope<'notarize'> };
  TicketVerifyRedeem: { envelope: ProofEnvelope<'ticket'> };
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
