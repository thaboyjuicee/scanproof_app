import bs58 from 'bs58';
import { Base64 } from 'js-base64';
import nacl from 'tweetnacl';

import { SignedPayload } from '../../models/signed-payload';
import { AnyProofEnvelope, NotarizeEnvelopePayload, ProofEnvelope, ProofEnvelopePayloadByType, ProofEnvelopeType, QuestEnvelopePayload, TicketEnvelopePayload } from '../../models/proof-envelope';
import { AppError } from '../../utils/errors';
import { canonicalJsonStringify } from '../../utils/canonical-json';

type PartialEnvelope<T extends ProofEnvelopeType> = Omit<ProofEnvelope<T>, 'issuerSignature'>;

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const isIsoDateString = (value: unknown): value is string => {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
};

const ensureString = (value: unknown, field: string): string => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(`Invalid ${field}.`, 'ENVELOPE_VALIDATION_ERROR');
  }

  return value.trim();
};

const utf8Encode = (value: string): Uint8Array => new TextEncoder().encode(value);

export class EnvelopeService {
  createUnsignedEnvelope<T extends ProofEnvelopeType>(input: {
    type: T;
    id: string;
    issuerPublicKey: string;
    payload: ProofEnvelopePayloadByType[T];
    issuedAt?: string;
  }): PartialEnvelope<T> {
    const issuedAt = input.issuedAt ?? new Date().toISOString();

    return {
      version: 1,
      type: input.type,
      id: input.id.trim(),
      issuedAt,
      issuerPublicKey: input.issuerPublicKey.trim(),
      payload: input.payload,
    };
  }

  getCanonicalSigningMessage<T extends ProofEnvelopeType>(envelope: PartialEnvelope<T>): string {
    return canonicalJsonStringify(envelope as any);
  }

  signEnvelope<T extends ProofEnvelopeType>(envelope: PartialEnvelope<T>, signedPayload: SignedPayload): ProofEnvelope<T> {
    if (signedPayload.walletAddress !== envelope.issuerPublicKey) {
      throw new AppError('Issuer wallet does not match signing wallet.', 'ENVELOPE_SIGNER_MISMATCH');
    }

    return {
      ...envelope,
      issuerSignature: signedPayload.signatureBase58,
    };
  }

  encodeToBase64Url(envelope: AnyProofEnvelope): string {
    this.assertValidEnvelope(envelope);
    return Base64.fromUint8Array(utf8Encode(JSON.stringify(envelope)), true);
  }

  decodeFromBase64Url(raw: string): AnyProofEnvelope {
    try {
      const decoded = Base64.decode(raw.trim());
      const parsed = JSON.parse(decoded) as unknown;
      this.assertValidEnvelope(parsed);
      return parsed;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError('QR data is not a valid ScanProof envelope.', 'ENVELOPE_DECODE_ERROR');
    }
  }

  verifyEnvelopeSignature(envelope: AnyProofEnvelope): boolean {
    try {
      const unsignedEnvelope = {
        version: envelope.version,
        type: envelope.type,
        id: envelope.id,
        issuedAt: envelope.issuedAt,
        issuerPublicKey: envelope.issuerPublicKey,
        payload: envelope.payload,
      };

      const message = this.getCanonicalSigningMessage(unsignedEnvelope);
      return nacl.sign.detached.verify(
        utf8Encode(message),
        bs58.decode(envelope.issuerSignature),
        bs58.decode(envelope.issuerPublicKey)
      );
    } catch {
      return false;
    }
  }

  assertValidEnvelope(value: unknown): asserts value is AnyProofEnvelope {
    if (!isRecord(value)) {
      throw new AppError('Envelope must be a JSON object.', 'ENVELOPE_VALIDATION_ERROR');
    }

    if (value.version !== 1) {
      throw new AppError('Unsupported envelope version.', 'ENVELOPE_VERSION_UNSUPPORTED');
    }

    const type = ensureString(value.type, 'envelope type');
    if (type !== 'quest' && type !== 'notarize' && type !== 'ticket') {
      throw new AppError('Unknown envelope type.', 'ENVELOPE_TYPE_UNSUPPORTED');
    }

    ensureString(value.id, 'envelope id');
    if (!isIsoDateString(value.issuedAt)) {
      throw new AppError('Envelope issuedAt must be ISO date.', 'ENVELOPE_VALIDATION_ERROR');
    }

    ensureString(value.issuerPublicKey, 'issuer public key');
    ensureString(value.issuerSignature, 'issuer signature');

    const payload = value.payload;
    if (!isRecord(payload)) {
      throw new AppError('Envelope payload is missing.', 'ENVELOPE_VALIDATION_ERROR');
    }

    if (type === 'quest') {
      this.assertQuestPayload(payload);
    } else if (type === 'notarize') {
      this.assertNotarizePayload(payload);
    } else {
      this.assertTicketPayload(payload);
    }
  }

  private assertQuestPayload(payload: Record<string, unknown>): void {
    ensureString(payload.title, 'quest title');
    const claimLimit = ensureString(payload.claimLimit, 'quest claim limit');
    if (claimLimit !== 'once' && claimLimit !== 'daily') {
      throw new AppError('Quest claim limit must be once or daily.', 'ENVELOPE_VALIDATION_ERROR');
    }

    if (!isIsoDateString(payload.validFrom) || !isIsoDateString(payload.validTo)) {
      throw new AppError('Quest validity window is invalid.', 'ENVELOPE_VALIDATION_ERROR');
    }
  }

  private assertNotarizePayload(payload: Record<string, unknown>): void {
    ensureString(payload.proofId, 'notarize proof id');
    ensureString(payload.title, 'notarize title');
    ensureString(payload.ownerWallet, 'notarize owner wallet');
    ensureString(payload.hash, 'notarize hash');
    if (!isIsoDateString(payload.timestampIso)) {
      throw new AppError('Notarize timestamp is invalid.', 'ENVELOPE_VALIDATION_ERROR');
    }
  }

  private assertTicketPayload(payload: Record<string, unknown>): void {
    ensureString(payload.eventName, 'ticket event name');
    ensureString(payload.payloadHash, 'ticket payload hash');
    if (!isIsoDateString(payload.validFrom) || !isIsoDateString(payload.validTo)) {
      throw new AppError('Ticket validity window is invalid.', 'ENVELOPE_VALIDATION_ERROR');
    }
  }
}
