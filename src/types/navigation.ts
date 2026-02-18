import { Proof } from '../models/proof';

export type RootStackParamList = {
  Home: undefined;
  CreateProof: undefined;
  VerifyProof: undefined;
  ProofList: undefined;
  ProofDetails: { proof: Proof };
  WalletConnect: undefined;
};
