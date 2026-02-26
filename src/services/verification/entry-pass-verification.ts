import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { EntryPass } from '../../models/entry-pass';

export function verifyEntryPassSignature(entryPass: EntryPass, organizerPublicKey: string): boolean {
  if (!entryPass.signature) return false;
  // Prepare message: concatenate eventId, attendeeWallet, issuedAt
  const message = `${entryPass.eventId}|${entryPass.attendeeWallet}|${entryPass.issuedAt}`;
  try {
    return nacl.sign.detached.verify(
      new TextEncoder().encode(message),
      bs58.decode(entryPass.signature),
      bs58.decode(organizerPublicKey)
    );
  } catch {
    return false;
  }
}
