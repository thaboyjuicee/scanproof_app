export interface WalletSession {
  walletAddress: string;
  sessionToken: string;
  sharedSecretBase58: string;
  dappSecretKeyBase58: string;
  phantomEncryptionPublicKeyBase58: string;
  cluster: 'mainnet-beta' | 'devnet' | 'testnet';
  connectedAtIso: string;
}
