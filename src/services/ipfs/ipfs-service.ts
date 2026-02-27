import { Proof } from '../../models/proof';
import { AppError } from '../../utils/errors';

interface IpfsUploadResponse {
  IpfsHash?: string;
}

export class IpfsService {
  constructor(
    private readonly uploadUrl: string,
    private readonly gatewayUrl: string,
    private readonly pinataJwt?: string,
    private readonly pinataApiKey?: string,
    private readonly pinataApiSecret?: string
  ) {}

  async uploadProof(proof: Proof, timeoutMs = 15000): Promise<string> {
    const hasJwt = Boolean(this.pinataJwt);
    const hasApiKeys = Boolean(this.pinataApiKey && this.pinataApiSecret);

    if (!hasJwt && !hasApiKeys) {
      throw new AppError(
        'Missing Pinata configuration for IPFS upload. Set PINATA_JWT or PINATA_API_KEY + PINATA_API_SECRET.',
        'IPFS_CONFIG_MISSING'
      );
    }

    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (hasJwt && this.pinataJwt) {
        headers.Authorization = `Bearer ${this.pinataJwt}`;
      } else if (this.pinataApiKey && this.pinataApiSecret) {
        headers.pinata_api_key = this.pinataApiKey;
        headers.pinata_secret_api_key = this.pinataApiSecret;
      }

      const response = await fetch(this.uploadUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          pinataMetadata: {
            name: `scanproof-${proof.id}`,
          },
          pinataContent: proof,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new AppError(`IPFS upload failed (${response.status}): ${text}`, 'IPFS_UPLOAD_FAILED');
      }

      const payload = (await response.json()) as IpfsUploadResponse;
      if (!payload.IpfsHash) {
        throw new AppError('IPFS upload succeeded but no CID returned.', 'IPFS_UPLOAD_INVALID_RESPONSE');
      }

      return payload.IpfsHash;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new AppError('IPFS upload timed out.', 'IPFS_UPLOAD_TIMEOUT');
      }

      throw new AppError('Unexpected IPFS upload failure.', 'IPFS_UPLOAD_UNKNOWN');
    } finally {
      clearTimeout(timeoutHandle);
    }
  }

  async fetchProof(cid: string, timeoutMs = 15000): Promise<Proof> {
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      const response = await fetch(`${this.gatewayUrl}/${cid}`, {
        method: 'GET',
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new AppError(`IPFS fetch failed (${response.status})`, 'IPFS_FETCH_FAILED');
      }

      return (await response.json()) as Proof;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new AppError('IPFS fetch timed out.', 'IPFS_FETCH_TIMEOUT');
      }

      throw new AppError('Unexpected IPFS fetch failure.', 'IPFS_FETCH_UNKNOWN');
    } finally {
      clearTimeout(timeoutHandle);
    }
  }
}
