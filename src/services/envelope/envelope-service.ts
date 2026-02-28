import bs58 from 'bs58';
import { Base64 } from 'js-base64';
import nacl from 'tweetnacl';

import { SignedPayload } from '../../models/signed-payload';
import { AnyProofEnvelope, NotarizeEnvelopePayload, ProofEnvelope, ProofEnvelopePayloadByType, ProofEnvelopeType, QuestEnvelopePayload, TicketEnvelopePayload } from '../../models/proof-envelope';
import { AppError } from '../../utils/errors';
import { canonicalJsonStringify } from '../../utils/canonical-json';

type PartialEnvelope<T extends ProofEnvelopeType> = Omit<ProofEnvelope<T>, 'issuerSignature'>;
type CompactEnvelopeType = 'q' | 'n' | 't';

interface CompactEnvelope {
  v: 1;
  t: CompactEnvelopeType;
  i: string;
  a: string;
  k: string;
  p: Record<string, unknown>;
  s: string;
}

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

const assignIfNonEmptyString = (target: Record<string, unknown>, key: string, value: unknown): void => {
  if (typeof value === 'string' && value.trim()) {
    target[key] = value;
  }
};

const assignIfString = (target: Record<string, unknown>, key: string, value: unknown): void => {
  if (typeof value === 'string') {
    target[key] = value;
  }
};

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
      payload: this.normalizePayloadForSigning(input.type, input.payload),
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
    const compact = this.toCompactEnvelope(envelope);
    return Base64.fromUint8Array(utf8Encode(JSON.stringify(compact)), true);
  }

  decodeFromBase64Url(raw: string): AnyProofEnvelope {
    try {
      const decoded = Base64.decode(raw.trim());
      const parsed = JSON.parse(decoded) as unknown;

      if (this.isCompactEnvelope(parsed)) {
        const expanded = this.fromCompactEnvelope(parsed);
        this.assertValidEnvelope(expanded);
        return expanded;
      }

      this.assertValidEnvelope(parsed);
      return parsed;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError('QR data is not a valid ScanProof envelope.', 'ENVELOPE_DECODE_ERROR');
    }
  }

  private toCompactEnvelope(envelope: AnyProofEnvelope): CompactEnvelope {
    return {
      v: 1,
      t: this.toCompactType(envelope.type),
      i: envelope.id,
      a: envelope.issuedAt,
      k: envelope.issuerPublicKey,
      p: this.toCompactPayload(envelope.type, envelope.payload as unknown as Record<string, unknown>),
      s: envelope.issuerSignature,
    };
  }

  private fromCompactEnvelope(compact: CompactEnvelope): AnyProofEnvelope {
    const type = this.fromCompactType(compact.t);

    return {
      version: 1,
      type,
      id: compact.i,
      issuedAt: compact.a,
      issuerPublicKey: compact.k,
      payload: this.fromCompactPayload(type, compact.p),
      issuerSignature: compact.s,
    } as unknown as AnyProofEnvelope;
  }

  private isCompactEnvelope(value: unknown): value is CompactEnvelope {
    if (!isRecord(value)) {
      return false;
    }

    return value.v === 1
      && (value.t === 'q' || value.t === 'n' || value.t === 't')
      && typeof value.i === 'string'
      && typeof value.a === 'string'
      && typeof value.k === 'string'
      && isRecord(value.p)
      && typeof value.s === 'string';
  }

  private toCompactType(type: ProofEnvelopeType): CompactEnvelopeType {
    if (type === 'quest') {
      return 'q';
    }
    if (type === 'notarize') {
      return 'n';
    }
    return 't';
  }

  private fromCompactType(type: CompactEnvelopeType): ProofEnvelopeType {
    if (type === 'q') {
      return 'quest';
    }
    if (type === 'n') {
      return 'notarize';
    }
    return 'ticket';
  }

  private toCompactPayload(type: ProofEnvelopeType, payload: Record<string, unknown>): Record<string, unknown> {
    if (type === 'quest') {
      const compact: Record<string, unknown> = {
        ti: payload.title,
        cl: payload.claimLimit,
        vf: payload.validFrom,
        vt: payload.validTo,
      };
      assignIfNonEmptyString(compact, 'de', payload.description);
      assignIfNonEmptyString(compact, 'la', payload.label);
      assignIfNonEmptyString(compact, 'lo', payload.location);
      assignIfNonEmptyString(compact, 'co', payload.community);
      assignIfNonEmptyString(compact, 'bi', payload.badgeImage);
      assignIfNonEmptyString(compact, 'tx', payload.txSignature);
      return compact;
    }

    if (type === 'notarize') {
      const compact: Record<string, unknown> = {
        pi: payload.proofId,
        ti: payload.title,
        de: payload.description,
        ow: payload.ownerWallet,
        ha: payload.hash,
        ts: payload.timestampIso,
      };
      assignIfNonEmptyString(compact, 'fn', payload.fileName);
      assignIfNonEmptyString(compact, 'fh', payload.fileHash);
      assignIfNonEmptyString(compact, 'ic', payload.ipfsCid);
      assignIfNonEmptyString(compact, 'tx', payload.txSignature);
      return compact;
    }

    const compact: Record<string, unknown> = {
      ti: payload.title,
      de: payload.description,
      en: payload.eventName,
      vf: payload.validFrom,
      vt: payload.validTo,
      ph: payload.payloadHash,
    };
    assignIfNonEmptyString(compact, 've', payload.venue);
    assignIfNonEmptyString(compact, 'rw', payload.recipientWallet);
    assignIfNonEmptyString(compact, 'um', payload.usageMode);
    assignIfNonEmptyString(compact, 'tx', payload.txSignature);
    return compact;
  }

  private fromCompactPayload(type: ProofEnvelopeType, payload: Record<string, unknown>): Record<string, unknown> {
    if (type === 'quest') {
      const expanded: Record<string, unknown> = {
        title: payload.ti,
        claimLimit: payload.cl,
        validFrom: payload.vf,
        validTo: payload.vt,
      };
      assignIfString(expanded, 'description', payload.de);
      assignIfString(expanded, 'label', payload.la);
      assignIfString(expanded, 'location', payload.lo);
      assignIfString(expanded, 'community', payload.co);
      assignIfString(expanded, 'badgeImage', payload.bi);
      assignIfString(expanded, 'txSignature', payload.tx);
      return expanded;
    }

    if (type === 'notarize') {
      const expanded: Record<string, unknown> = {
        proofId: payload.pi,
        title: payload.ti,
        description: payload.de,
        ownerWallet: payload.ow,
        hash: payload.ha,
        timestampIso: payload.ts,
      };
      assignIfString(expanded, 'fileName', payload.fn);
      assignIfString(expanded, 'fileHash', payload.fh);
      assignIfString(expanded, 'ipfsCid', payload.ic);
      assignIfString(expanded, 'txSignature', payload.tx);
      return expanded;
    }

    const expanded: Record<string, unknown> = {
      title: payload.ti ?? payload.en,
      description: payload.de,
      eventName: payload.en,
      validFrom: payload.vf,
      validTo: payload.vt,
      payloadHash: payload.ph,
    };
    assignIfString(expanded, 'venue', payload.ve);
    assignIfString(expanded, 'recipientWallet', payload.rw);
    assignIfString(expanded, 'usageMode', payload.um);
    assignIfString(expanded, 'txSignature', payload.tx);
    return expanded;
  }

  verifyEnvelopeSignature(envelope: AnyProofEnvelope): boolean {
    try {
      const signature = bs58.decode(envelope.issuerSignature);
      const issuerPublicKey = bs58.decode(envelope.issuerPublicKey);
      const unsignedEnvelope = {
        version: envelope.version,
        type: envelope.type,
        id: envelope.id,
        issuedAt: envelope.issuedAt,
        issuerPublicKey: envelope.issuerPublicKey,
        payload: envelope.payload,
      };

      const message = this.getCanonicalSigningMessage(unsignedEnvelope as any);
      if (nacl.sign.detached.verify(utf8Encode(message), signature, issuerPublicKey)) {
        return true;
      }

      const legacyCandidates = this.getLegacyPayloadCandidates(envelope.type, envelope.payload as unknown as Record<string, unknown>);
      for (const payloadCandidate of legacyCandidates) {
        const legacyMessage = this.getCanonicalSigningMessage({
          ...unsignedEnvelope,
          payload: payloadCandidate,
        } as any);

        if (nacl.sign.detached.verify(utf8Encode(legacyMessage), signature, issuerPublicKey)) {
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  private normalizePayloadForSigning<T extends ProofEnvelopeType>(
    type: T,
    payload: ProofEnvelopePayloadByType[T]
  ): ProofEnvelopePayloadByType[T] {
    const normalized = { ...(payload as unknown as Record<string, unknown>) };
    const optionalKeys = this.getOptionalPayloadKeys(type);

    for (const key of optionalKeys) {
      if (normalized[key] === '' || normalized[key] === undefined || normalized[key] === null) {
        delete normalized[key];
      }
    }

    return normalized as unknown as ProofEnvelopePayloadByType[T];
  }

  private getLegacyPayloadCandidates(type: ProofEnvelopeType, payload: Record<string, unknown>): Record<string, unknown>[] {
    const optionalKeys = this.getOptionalPayloadKeys(type);
    const missingOptionalKeys = optionalKeys.filter((key) => !(key in payload));
    if (missingOptionalKeys.length === 0) {
      return [];
    }

    const legacyValues: Array<'' | undefined | null> = ['', undefined, null];
    let frontier: Record<string, unknown>[] = [{ ...payload }];

    for (const key of missingOptionalKeys) {
      const nextFrontier: Record<string, unknown>[] = [...frontier];
      for (const base of frontier) {
        for (const legacyValue of legacyValues) {
          const candidate = { ...base, [key]: legacyValue };
          nextFrontier.push(candidate);
        }
      }
      frontier = nextFrontier;
    }

    return frontier.filter((candidate) => {
      return missingOptionalKeys.some((key) => key in candidate);
    });
  }

  private getOptionalPayloadKeys(type: ProofEnvelopeType): string[] {
    if (type === 'quest') {
      return ['description', 'label', 'location', 'community', 'badgeImage', 'txSignature'];
    }
    if (type === 'notarize') {
      return ['fileName', 'fileHash', 'ipfsCid', 'txSignature'];
    }
    return ['description', 'venue', 'recipientWallet', 'usageMode', 'txSignature'];
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

    if (payload.txSignature !== undefined && payload.txSignature !== null) {
      ensureString(payload.txSignature, 'quest transaction signature');
    }
  }

  private assertNotarizePayload(payload: Record<string, unknown>): void {
    ensureString(payload.proofId, 'notarize proof id');
    ensureString(payload.title, 'notarize title');
    ensureString(payload.ownerWallet, 'notarize owner wallet');
    ensureString(payload.hash, 'notarize hash');
    if (payload.fileHash !== undefined && payload.fileHash !== null) {
      ensureString(payload.fileHash, 'notarize file hash');
    }
    if (!isIsoDateString(payload.timestampIso)) {
      throw new AppError('Notarize timestamp is invalid.', 'ENVELOPE_VALIDATION_ERROR');
    }

    if (payload.txSignature !== undefined && payload.txSignature !== null) {
      ensureString(payload.txSignature, 'notarize transaction signature');
    }
  }

  private assertTicketPayload(payload: Record<string, unknown>): void {
    const eventName = ensureString(payload.eventName, 'ticket event name');
    if (typeof payload.title !== 'string' || !payload.title.trim()) {
      payload.title = eventName;
    }
    ensureString(payload.title, 'ticket title');
    if (payload.usageMode !== undefined && payload.usageMode !== null) {
      const usageMode = ensureString(payload.usageMode, 'ticket usage mode');
      if (usageMode !== 'single' && usageMode !== 'multi') {
        throw new AppError('Ticket usage mode must be single or multi.', 'ENVELOPE_VALIDATION_ERROR');
      }
    }
    ensureString(payload.payloadHash, 'ticket payload hash');
    if (!isIsoDateString(payload.validFrom) || !isIsoDateString(payload.validTo)) {
      throw new AppError('Ticket validity window is invalid.', 'ENVELOPE_VALIDATION_ERROR');
    }

    if (payload.txSignature !== undefined && payload.txSignature !== null) {
      ensureString(payload.txSignature, 'ticket transaction signature');
    }
  }
}
