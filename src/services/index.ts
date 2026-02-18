import { env } from '../config/env';
import { IpfsService } from './ipfs/ipfs-service';
import { ProofService } from './proof/proof-service';
import { SolanaService } from './solana/solana-service';
import { StorageService } from './storage/storage-service';
import { VerificationService } from './verification/verification-service';
import { ExpoDeepLinkTransport } from './wallet/deep-link-transport';
import { PhantomWalletService } from './wallet/phantom-wallet-service';

const storageService = new StorageService();
const solanaService = new SolanaService(env.solanaRpcUrl);

export const services = {
  storageService,
  solanaService,
  ipfsService: new IpfsService(env.ipfsUploadUrl, env.ipfsGatewayUrl, env.pinataJwt),
  proofService: new ProofService(),
  verificationService: new VerificationService(),
  walletService: new PhantomWalletService(new ExpoDeepLinkTransport(), storageService, solanaService),
};
