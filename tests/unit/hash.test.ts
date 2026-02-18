import { hashProofInput } from '../../src/utils/hash';

describe('hashProofInput', () => {
  it('returns deterministic hash for same logical input', () => {
    const input = {
      title: 'Invoice #42',
      description: 'Signed receipt',
      ownerWallet: 'owner-wallet',
      timestampIso: '2026-02-18T12:00:00.000Z',
    };

    const first = hashProofInput(input);
    const second = hashProofInput({ ...input });

    expect(first).toBe(second);
  });

  it('normalizes whitespace before hashing', () => {
    const base = hashProofInput({
      title: 'Proof A',
      description: 'Hello world',
      ownerWallet: 'wallet-123',
      timestampIso: '2026-02-18T12:00:00.000Z',
    });

    const withWhitespace = hashProofInput({
      title: '  Proof A  ',
      description: '  Hello world  ',
      ownerWallet: '  wallet-123  ',
      timestampIso: '2026-02-18T12:00:00.000Z',
    });

    expect(base).toBe(withWhitespace);
  });

  it('changes hash when data changes', () => {
    const first = hashProofInput({
      title: 'Proof A',
      description: 'Hello world',
      ownerWallet: 'wallet-123',
      timestampIso: '2026-02-18T12:00:00.000Z',
    });

    const second = hashProofInput({
      title: 'Proof B',
      description: 'Hello world',
      ownerWallet: 'wallet-123',
      timestampIso: '2026-02-18T12:00:00.000Z',
    });

    expect(first).not.toBe(second);
  });
});
