import Constants from 'expo-constants';

export interface AppEnv {
  phantomRedirectUri: string;
  phantomAppUrl: string;
  solanaCluster: 'mainnet-beta' | 'devnet' | 'testnet';
  solanaRpcUrl: string;
  solanaExplorerBaseUrl: string;
  ipfsGatewayUrl: string;
  ipfsUploadUrl: string;
  pinataJwt?: string;
  pinataApiKey?: string;
  pinataApiSecret?: string;
}

const extra = Constants.expoConfig?.extra as Record<string, string | undefined> | undefined;

const cluster = (extra?.SOLANA_CLUSTER ?? 'devnet') as 'mainnet-beta' | 'devnet' | 'testnet';

const fallbackRpcUrl = cluster === 'mainnet-beta'
  ? 'https://api.mainnet-beta.solana.com'
  : cluster === 'testnet'
    ? 'https://api.testnet.solana.com'
    : 'https://api.devnet.solana.com';

export const env: AppEnv = {
  phantomRedirectUri: extra?.PHANTOM_REDIRECT_URI ?? 'scanproof://wallet-callback',
  phantomAppUrl: extra?.PHANTOM_APP_URL ?? 'https://scanproof.app',
  solanaCluster: cluster,
  solanaRpcUrl: extra?.SOLANA_RPC_URL ?? fallbackRpcUrl,
  solanaExplorerBaseUrl: extra?.SOLANA_EXPLORER_BASE_URL ?? 'https://explorer.solana.com',
  ipfsGatewayUrl: extra?.IPFS_GATEWAY_URL ?? 'https://gateway.pinata.cloud/ipfs',
  ipfsUploadUrl: extra?.IPFS_UPLOAD_URL ?? 'https://api.pinata.cloud/pinning/pinJSONToIPFS',
  pinataJwt: extra?.PINATA_JWT,
  pinataApiKey: extra?.PINATA_API_KEY,
  pinataApiSecret: extra?.PINATA_API_SECRET,
};
