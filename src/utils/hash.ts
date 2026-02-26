import { sha256 } from 'js-sha256';
import * as FileSystem from 'expo-file-system/legacy';

import { canonicalJsonStringify } from './canonical-json';

export interface HashableProofInput {
  title: string;
  description: string;
  ownerWallet: string;
  timestampIso: string;
}

export const hashProofInput = (input: HashableProofInput): string => {
  const normalized: Record<string, string> = {
    title: input.title.trim(),
    description: input.description.trim(),
    ownerWallet: input.ownerWallet.trim(),
    timestampIso: input.timestampIso,
  };

  const canonical = canonicalJsonStringify(normalized);
  return sha256(canonical);
};

export const hashFileFromUri = async (fileUri: string): Promise<string> => {
  if (!fileUri || typeof fileUri !== 'string') {
    throw new Error('Invalid file URI for hashing.');
  }

  const contentBase64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  if (!contentBase64) {
    throw new Error('Selected file could not be read for hashing.');
  }

  return sha256(contentBase64);
};
