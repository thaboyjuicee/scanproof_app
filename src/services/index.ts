import { env } from '../config/env';
import { EnvelopeService } from './envelope/envelope-service';
import { EntryPassService } from './entry-pass/entry-pass-service';
import { EventService } from './event/event-service';
import { FileUploadService } from './file-upload/file-upload-service';
import { IpfsService } from './ipfs/ipfs-service';
import { ProofService } from './proof/proof-service';
import { SolanaService } from './solana/solana-service';
import { StorageService } from './storage/storage-service';
import { TicketService } from './ticket/ticket-service';
import { VerificationService } from './verification/verification-service';
import { MwaWalletService } from './wallet/mwa-wallet-service';

const storageService = new StorageService();
const solanaService = new SolanaService(env.solanaRpcUrl);

export const services = {
  storageService,
  solanaService,
  envelopeService: new EnvelopeService(),
  entryPassService: new EntryPassService(),
  eventService: new EventService(),
  ticketService: new TicketService(),
  ipfsService: new IpfsService(env.ipfsUploadUrl, env.ipfsGatewayUrl, env.pinataJwt),
  proofService: new ProofService(),
  verificationService: new VerificationService(),
  fileUploadService: new FileUploadService(),
  walletService: new MwaWalletService(
    storageService,
    solanaService,
    {
      name: env.phantomAppUrl.replace('https://', '').replace('http://', ''),
      uri: env.phantomAppUrl,
      icon: 'favicon.ico',
    }
  ),
};
