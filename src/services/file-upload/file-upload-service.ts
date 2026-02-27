import { AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';

/**
 * FileUploadService handles file uploads to a backend storage service
 * For MVP, simulates file upload with local storage
 * In production, integrate with Supabase Storage, Cloudinary, or similar
 */
export interface FileUploadResponse {
  url: string;
  fileName: string;
  size: number;
}

export class FileUploadService {
  constructor(
    private readonly gatewayUrl: string,
    private readonly uploadUrl = 'https://api.pinata.cloud/pinning/pinFileToIPFS',
    private readonly pinataJwt?: string,
    private readonly pinataApiKey?: string,
    private readonly pinataApiSecret?: string
  ) {}

  private buildAuthHeaders(): Record<string, string> {
    if (this.pinataJwt) {
      return { Authorization: `Bearer ${this.pinataJwt}` };
    }

    if (this.pinataApiKey && this.pinataApiSecret) {
      return {
        pinata_api_key: this.pinataApiKey,
        pinata_secret_api_key: this.pinataApiSecret,
      };
    }

    throw new AppError(
      'Missing Pinata configuration for file upload. Set PINATA_JWT or PINATA_API_KEY + PINATA_API_SECRET.',
      'FILE_UPLOAD_CONFIG_MISSING'
    );
  }

  private inferMimeType(fileName: string): string {
    const lower = fileName.toLowerCase();
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.gif')) return 'image/gif';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.pdf')) return 'application/pdf';
    return 'application/octet-stream';
  }

  async uploadFile(fileUri: string, fileName: string): Promise<FileUploadResponse> {
    try {
      logger.info('File upload initiated', { fileName });

      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        name: fileName,
        type: this.inferMimeType(fileName),
      } as any);
      formData.append('pinataMetadata', JSON.stringify({
        name: fileName,
      }));

      const fetchResponse = await fetch(this.uploadUrl, {
        method: 'POST',
        headers: this.buildAuthHeaders(),
        body: formData,
      });

      if (!fetchResponse.ok) {
        const text = await fetchResponse.text();
        throw new AppError(`File upload failed (${fetchResponse.status}): ${text}`, 'FILE_UPLOAD_FAILED');
      }

      const payload = await fetchResponse.json() as { IpfsHash?: string; PinSize?: number };
      if (!payload.IpfsHash) {
        throw new AppError('File upload succeeded but no CID returned.', 'FILE_UPLOAD_INVALID_RESPONSE');
      }

      const normalizedGateway = this.gatewayUrl.endsWith('/') ? this.gatewayUrl.slice(0, -1) : this.gatewayUrl;
      const fileUrl = `${normalizedGateway}/${payload.IpfsHash}`;

      const uploadResponse: FileUploadResponse = {
        url: fileUrl,
        fileName,
        size: payload.PinSize ?? 0,
      };

      logger.info('File uploaded successfully', { fileName, url: fileUrl });

      return uploadResponse;
    } catch (error) {
      logger.error('File upload failed', error);
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(`Failed to upload file: ${fileName}`, 'FILE_UPLOAD_FAILED');
    }
  }

  /**
   * Integration point for production backend
   * Example: Supabase Storage integration
   * export async function uploadToSupabase(fileUri: string, bucket: string): Promise<string> {
   *   const response = await supabase.storage
   *     .from(bucket)
   *     .upload(`proofs/${Date.now()}_${fileName}`, file);
   *   return response.data?.path || throw error;
   * }
   */
}
