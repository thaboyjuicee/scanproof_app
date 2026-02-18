import { sha256 } from 'js-sha256';

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
