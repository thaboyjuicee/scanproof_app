import { Base64 } from 'js-base64';

import { EntryPass } from '../../models/entry-pass';
import { AppError } from '../../utils/errors';

const PREFIX = 'scanproof:entrypass:';

const utf8Encode = (value: string): Uint8Array => new TextEncoder().encode(value);

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const ensureString = (value: unknown, field: string): string => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(`Invalid ${field}.`, 'ENTRY_PASS_VALIDATION_ERROR');
  }

  return value.trim();
};

export class EntryPassService {
  encodeEntryPassToQr(entryPass: EntryPass): string {
    this.assertValidEntryPass(entryPass);
    // Ensure signature is present
    if (!entryPass.signature || typeof entryPass.signature !== 'string' || !entryPass.signature.trim()) {
      throw new AppError('Entry pass signature is missing.', 'ENTRY_PASS_VALIDATION_ERROR');
    }
    const json = JSON.stringify(entryPass);
    const encoded = Base64.fromUint8Array(utf8Encode(json), true);
    return `${PREFIX}${encoded}`;
  }

  decodeEntryPassFromQr(raw: string): EntryPass {
    if (typeof raw !== 'string' || !raw.startsWith(PREFIX)) {
      throw new AppError('QR is not a ScanProof entry pass.', 'ENTRY_PASS_DECODE_ERROR');
    }

    const encoded = raw.slice(PREFIX.length).trim();
    if (!encoded) {
      throw new AppError('Entry pass payload is missing.', 'ENTRY_PASS_DECODE_ERROR');
    }

    try {
      const decoded = Base64.decode(encoded);
      const parsed = JSON.parse(decoded) as unknown;
      this.assertValidEntryPass(parsed);
      return parsed;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError('Entry pass QR data is invalid.', 'ENTRY_PASS_DECODE_ERROR');
    }
  }

  assertValidEntryPass(value: unknown): asserts value is EntryPass {
    if (!isRecord(value)) {
      throw new AppError('Entry pass must be an object.', 'ENTRY_PASS_VALIDATION_ERROR');
    }

    const type = ensureString(value.type, 'entry pass type');
    if (type !== 'scanproof_entrypass_v1') {
      throw new AppError('Unsupported entry pass version.', 'ENTRY_PASS_VALIDATION_ERROR');
    }

    ensureString(value.eventId, 'entry pass event id');
    ensureString(value.attendeeWallet, 'entry pass attendee wallet');
    const issuedAt = ensureString(value.issuedAt, 'entry pass issuedAt');
    if (Number.isNaN(Date.parse(issuedAt))) {
      throw new AppError('Entry pass issuedAt must be ISO date.', 'ENTRY_PASS_VALIDATION_ERROR');
    }
    ensureString(value.signature, 'entry pass signature');
  }
}
