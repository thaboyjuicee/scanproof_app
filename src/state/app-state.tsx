import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { env } from '../config/env';
import { AnyProofEnvelope, NotarizeEnvelopePayload, ProofEnvelope, QuestClaimLimit, QuestEnvelopePayload, TicketEnvelopePayload } from '../models/proof-envelope';
import { QuestClaimRecord, ScanHistoryRecord, TicketRedemptionRecord } from '../models/proofbook';
import { Proof, ProofType } from '../models/proof';
import { VerificationResult } from '../models/verification-result';
import { WalletSession } from '../models/wallet-session';
import { services } from '../services';
import { logger } from '../utils/logger';
import { withTimeout } from '../utils/timeout';
import { hashFileFromUri } from '../utils/hash';

const createId = (prefix: string): string => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export interface EnvelopeVerificationResult {
  isValid: boolean;
  signatureValid: boolean;
  timeWindowValid: boolean;
  reasons: string[];
}

interface AppStateContextValue {
  proofs: Proof[];
  issuedEnvelopes: AnyProofEnvelope[];
  questClaims: QuestClaimRecord[];
  scanHistory: ScanHistoryRecord[];
  ticketRedemptions: TicketRedemptionRecord[];
  walletSession: WalletSession | null;
  loading: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  reconnectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  createProof: (title: string, description: string, proofType: ProofType, uploadToIpfs: boolean, fileUri?: string) => Promise<Proof | null>;
  verifyProof: (proof: Proof) => VerificationResult;
  verifyMultipleProofs: (proofs: Proof[]) => VerificationResult[];
  deleteProofbookItem: (id: string, type: 'legacy' | 'quest' | 'notarize' | 'ticket') => Promise<void>;
  createQuestEnvelope: (input: {
    title: string;
    description: string;
    label?: string;
    location?: string;
    community?: string;
    badgeImage?: string;
    validFrom: string;
    validTo: string;
    claimLimit: QuestClaimLimit;
  }) => Promise<ProofEnvelope<'quest'> | null>;
  createTicketEnvelope: (input: {
    title: string;
    description?: string;
    eventName: string;
    venue?: string;
    validFrom: string;
    validTo: string;
  }) => Promise<ProofEnvelope<'ticket'> | null>;
  issueNotarizeEnvelope: (proof: Proof) => Promise<ProofEnvelope<'notarize'> | null>;
  encodeEnvelopeToQr: (envelope: AnyProofEnvelope) => string;
  decodeEnvelopeFromQr: (rawData: string) => AnyProofEnvelope;
  verifyEnvelope: (envelope: AnyProofEnvelope) => EnvelopeVerificationResult;
  claimQuest: (envelope: ProofEnvelope<'quest'>) => Promise<QuestClaimRecord>;
  checkTicketRedeemed: (envelope: ProofEnvelope<'ticket'>) => Promise<{ redeemed: boolean; signature?: string }>;
  redeemTicket: (envelope: ProofEnvelope<'ticket'>) => Promise<{ signature: string; explorerUrl: string }>;
  addScanHistory: (entry: Omit<ScanHistoryRecord, 'id' | 'scannedAt'>) => Promise<void>;
  loadProofs: () => Promise<void>;
  clearError: () => void;
}

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

export const AppStateProvider = ({ children }: { children: React.ReactNode }): React.JSX.Element => {
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [issuedEnvelopes, setIssuedEnvelopes] = useState<AnyProofEnvelope[]>([]);
  const [questClaims, setQuestClaims] = useState<QuestClaimRecord[]>([]);
  const [scanHistory, setScanHistory] = useState<ScanHistoryRecord[]>([]);
  const [ticketRedemptions, setTicketRedemptions] = useState<TicketRedemptionRecord[]>([]);
  const [walletSession, setWalletSession] = useState<WalletSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const handleError = useCallback((unknownError: unknown) => {
    const message = unknownError instanceof Error ? unknownError.message : 'Unexpected error';
    logger.error('App state operation failed', unknownError);
    setError(message);
  }, []);

  const loadProofs = useCallback(async () => {
    try {
      const [stored, storedEnvelopes, storedClaims, storedScanHistory, storedRedemptions] = await Promise.all([
        services.storageService.getProofs(),
        services.storageService.getIssuedEnvelopes(),
        services.storageService.getQuestClaims(),
        services.storageService.getScanHistory(),
        services.storageService.getTicketRedemptions(),
      ]);

      setProofs(stored.sort((a, b) => b.timestampIso.localeCompare(a.timestampIso)));
      setIssuedEnvelopes(storedEnvelopes.sort((a, b) => b.issuedAt.localeCompare(a.issuedAt)));
      setQuestClaims(storedClaims.sort((a, b) => b.claimedAt.localeCompare(a.claimedAt)));
      setScanHistory(storedScanHistory.sort((a, b) => b.scannedAt.localeCompare(a.scannedAt)));
      setTicketRedemptions(storedRedemptions.sort((a, b) => b.redeemedAt.localeCompare(a.redeemedAt)));
    } catch (unknownError) {
      handleError(unknownError);
    }
  }, [handleError]);

  const reconnectWallet = useCallback(async () => {
    try {
      const session = await services.walletService.reconnectFromSavedSession();
      setWalletSession(session);
    } catch (unknownError) {
      handleError(unknownError);
    }
  }, [handleError]);

  const connectWallet = useCallback(async () => {
    setLoading(true);
    clearError();
    try {
      const session = await withTimeout(
        services.walletService.connect(),
        15000,
        'WALLET_CONNECT_TIMEOUT',
        'Wallet connection timed out. Please try again.'
      );
      const signInMessage = `ScanProof sign-in ${new Date().toISOString()}`;
      const signed = await withTimeout(
        services.walletService.signMessage(signInMessage),
        12000,
        'WALLET_SIGN_TIMEOUT',
        'Wallet signature request timed out.'
      );

      if (!services.walletService.verifySignedPayload(signed)) {
        throw new Error('Wallet sign-in signature verification failed.');
      }

      setWalletSession(session);
    } catch (unknownError) {
      handleError(unknownError);
    } finally {
      setLoading(false);
    }
  }, [clearError, handleError]);

  const disconnectWallet = useCallback(async () => {
    setLoading(true);
    clearError();
    try {
      await services.walletService.disconnect();
      setWalletSession(null);
    } catch (unknownError) {
      handleError(unknownError);
    } finally {
      setLoading(false);
    }
  }, [clearError, handleError]);

  const createProof = useCallback(async (title: string, description: string, proofType: ProofType, uploadToIpfs: boolean, fileUri?: string): Promise<Proof | null> => {
    if (!walletSession) {
      setError('Connect wallet before creating a proof.');
      return null;
    }

    setLoading(true);
    clearError();

    try {
      let fileUrl: string | undefined;
      let fileName: string | undefined;
      let fileHash: string | undefined;

      // Upload file if provided
      if (fileUri) {
        const urlParts = fileUri.split('/');
        fileName = urlParts[urlParts.length - 1];
        fileHash = await hashFileFromUri(fileUri);
        const uploadResponse = await services.fileUploadService.uploadFile(fileUri, fileName);
        fileUrl = uploadResponse.url;
        logger.info('File uploaded', { fileName, fileUrl, fileHash });
      }

      const signedPayload = await withTimeout(
        services.walletService.signMessage(`Proof:${title}:${Date.now()}`),
        12000,
        'WALLET_SIGN_TIMEOUT',
        'Wallet signature request timed out.'
      );
      const proof = services.proofService.createProof({
        title,
        description,
        ownerWallet: walletSession.walletAddress,
        proofType,
        fileUrl,
        fileName,
        fileHash,
        signedPayload,
      });

      let nextProof: Proof = proof;
      if (uploadToIpfs) {
        const cid = await withTimeout(
          services.ipfsService.uploadProof(proof),
          20000,
          'IPFS_UPLOAD_TIMEOUT',
          'IPFS upload timed out.'
        );
        nextProof = {
          ...proof,
          ipfsCid: cid,
        };
      }

      const updated = [nextProof, ...proofs];
      setProofs(updated);
      await services.storageService.saveProofs(updated);

      return nextProof;
    } catch (unknownError) {
      handleError(unknownError);
      return null;
    } finally {
      setLoading(false);
    }
  }, [clearError, handleError, proofs, walletSession]);

  const persistIssuedEnvelope = useCallback(async (envelope: AnyProofEnvelope): Promise<void> => {
    const next = [envelope, ...issuedEnvelopes];
    setIssuedEnvelopes(next);
    await services.storageService.saveIssuedEnvelopes(next);
  }, [issuedEnvelopes]);

  const createQuestEnvelope = useCallback(async (input: {
    title: string;
    description: string;
    label?: string;
    location?: string;
    community?: string;
    badgeImage?: string;
    validFrom: string;
    validTo: string;
    claimLimit: QuestClaimLimit;
  }): Promise<ProofEnvelope<'quest'> | null> => {
    if (!walletSession) {
      setError('Connect wallet before issuing a quest QR.');
      return null;
    }

    setLoading(true);
    clearError();

    try {
      const label = input.label?.trim() || input.community?.trim() || input.location?.trim() || undefined;

      const payload: QuestEnvelopePayload = {
        title: input.title.trim(),
        description: input.description.trim(),
        label,
        location: input.location?.trim() || undefined,
        community: input.community?.trim() || undefined,
        badgeImage: input.badgeImage?.trim() || undefined,
        validFrom: input.validFrom,
        validTo: input.validTo,
        claimLimit: input.claimLimit,
      };

      const unsignedEnvelope = services.envelopeService.createUnsignedEnvelope({
        type: 'quest',
        id: createId('quest'),
        issuerPublicKey: walletSession.walletAddress,
        payload,
      });

      const message = services.envelopeService.getCanonicalSigningMessage(unsignedEnvelope);
      const signedPayload = await withTimeout(
        services.walletService.signMessage(message),
        12000,
        'WALLET_SIGN_TIMEOUT',
        'Wallet signature request timed out.'
      );

      const signedEnvelope = services.envelopeService.signEnvelope(unsignedEnvelope, signedPayload);
      await persistIssuedEnvelope(signedEnvelope);
      return signedEnvelope;
    } catch (unknownError) {
      handleError(unknownError);
      return null;
    } finally {
      setLoading(false);
    }
  }, [walletSession, clearError, persistIssuedEnvelope, handleError]);

  const createTicketEnvelope = useCallback(async (input: {
    title: string;
    description?: string;
    eventName: string;
    venue?: string;
    validFrom: string;
    validTo: string;
  }): Promise<ProofEnvelope<'ticket'> | null> => {
    if (!walletSession) {
      setError('Connect wallet before issuing a ticket QR.');
      return null;
    }

    setLoading(true);
    clearError();

    try {
      const unsignedPayload: Omit<TicketEnvelopePayload, 'payloadHash'> = {
        title: input.title.trim(),
        description: input.description?.trim() || undefined,
        eventName: input.eventName.trim(),
        venue: input.venue?.trim() || undefined,
        validFrom: input.validFrom,
        validTo: input.validTo,
        usageMode: 'multi',
      };

      const payloadHash = services.ticketService.buildPayloadHash(unsignedPayload);

      const payload: TicketEnvelopePayload = {
        ...unsignedPayload,
        payloadHash,
      };

      const unsignedEnvelope = services.envelopeService.createUnsignedEnvelope({
        type: 'ticket',
        id: createId('ticket'),
        issuerPublicKey: walletSession.walletAddress,
        payload,
      });

      const message = services.envelopeService.getCanonicalSigningMessage(unsignedEnvelope);
      const signedPayload = await withTimeout(
        services.walletService.signMessage(message),
        12000,
        'WALLET_SIGN_TIMEOUT',
        'Wallet signature request timed out.'
      );

      const signedEnvelope = services.envelopeService.signEnvelope(unsignedEnvelope, signedPayload);
      await persistIssuedEnvelope(signedEnvelope);
      return signedEnvelope;
    } catch (unknownError) {
      handleError(unknownError);
      return null;
    } finally {
      setLoading(false);
    }
  }, [walletSession, clearError, persistIssuedEnvelope, handleError]);

  const issueNotarizeEnvelope = useCallback(async (proof: Proof): Promise<ProofEnvelope<'notarize'> | null> => {
    if (!walletSession) {
      setError('Connect wallet before issuing notarize QR.');
      return null;
    }

    setLoading(true);
    clearError();

    try {
      const payload: NotarizeEnvelopePayload = {
        proofId: proof.id,
        title: proof.title,
        description: proof.description,
        ownerWallet: proof.ownerWallet,
        hash: proof.hash,
        timestampIso: proof.timestampIso,
        fileName: proof.fileName,
        ipfsCid: proof.ipfsCid,
        fileHash: proof.fileHash,
      };

      const unsignedEnvelope = services.envelopeService.createUnsignedEnvelope({
        type: 'notarize',
        id: proof.id,
        issuerPublicKey: walletSession.walletAddress,
        payload,
      });

      const message = services.envelopeService.getCanonicalSigningMessage(unsignedEnvelope);
      const signedPayload = await withTimeout(
        services.walletService.signMessage(message),
        12000,
        'WALLET_SIGN_TIMEOUT',
        'Wallet signature request timed out.'
      );

      const signedEnvelope = services.envelopeService.signEnvelope(unsignedEnvelope, signedPayload);
      await persistIssuedEnvelope(signedEnvelope);
      return signedEnvelope;
    } catch (unknownError) {
      handleError(unknownError);
      return null;
    } finally {
      setLoading(false);
    }
  }, [walletSession, clearError, persistIssuedEnvelope, handleError]);

  const verifyEnvelope = useCallback((envelope: AnyProofEnvelope): EnvelopeVerificationResult => {
    const reasons: string[] = [];
    const signatureValid = services.envelopeService.verifyEnvelopeSignature(envelope);
    if (!signatureValid) {
      reasons.push('Organizer signature verification failed.');
    }

    let timeWindowValid = true;
    const payload = envelope.payload as unknown as Record<string, unknown>;
    const validFrom = typeof payload.validFrom === 'string' ? Date.parse(payload.validFrom) : undefined;
    const validTo = typeof payload.validTo === 'string' ? Date.parse(payload.validTo) : undefined;
    const now = Date.now();

    if (typeof validFrom === 'number' && !Number.isNaN(validFrom) && now < validFrom) {
      timeWindowValid = false;
      reasons.push('Credential is not yet valid.');
    }

    if (typeof validTo === 'number' && !Number.isNaN(validTo) && now > validTo) {
      timeWindowValid = false;
      reasons.push('Credential is expired.');
    }

    return {
      isValid: signatureValid && timeWindowValid,
      signatureValid,
      timeWindowValid,
      reasons,
    };
  }, []);

  const claimQuest = useCallback(async (envelope: ProofEnvelope<'quest'>): Promise<QuestClaimRecord> => {
    if (!walletSession) {
      throw new Error('Connect wallet to claim this quest.');
    }

    const verification = verifyEnvelope(envelope);
    if (!verification.isValid) {
      throw new Error(verification.reasons[0] ?? 'Quest envelope is invalid.');
    }

    const dateKey = new Date().toISOString().slice(0, 10);
    const existing = questClaims.find((claim) => claim.envelopeId === envelope.id && claim.walletAddress === walletSession.walletAddress);
    if (envelope.payload.claimLimit === 'once' && existing) {
      throw new Error('This quest can be claimed only once per wallet.');
    }

    if (envelope.payload.claimLimit === 'daily') {
      const alreadyClaimedToday = questClaims.some((claim) =>
        claim.envelopeId === envelope.id
        && claim.walletAddress === walletSession.walletAddress
        && claim.claimDateKey === dateKey
      );

      if (alreadyClaimedToday) {
        throw new Error('This quest was already claimed today.');
      }
    }

    const claimMessage = `scanproof:claim:${envelope.id}:${Date.now()}`;
    const signedPayload = await withTimeout(
      services.walletService.signMessage(claimMessage),
      12000,
      'WALLET_SIGN_TIMEOUT',
      'Wallet signature request timed out.'
    );

    const record: QuestClaimRecord = {
      id: createId('claim'),
      envelopeId: envelope.id,
      walletAddress: walletSession.walletAddress,
      claimedAt: new Date().toISOString(),
      claimDateKey: dateKey,
      claimSignature: signedPayload.signatureBase58,
    };

    // Re-check claims before saving to prevent race conditions
    let savedClaims: QuestClaimRecord[] = [];
    setQuestClaims((currentClaims) => {
      // Double-check with the latest state
      const stillExisting = currentClaims.find((claim) => claim.envelopeId === envelope.id && claim.walletAddress === walletSession.walletAddress);
      if (envelope.payload.claimLimit === 'once' && stillExisting) {
        throw new Error('This quest can be claimed only once per wallet.');
      }

      if (envelope.payload.claimLimit === 'daily') {
        const stillClaimedToday = currentClaims.some((claim) =>
          claim.envelopeId === envelope.id
          && claim.walletAddress === walletSession.walletAddress
          && claim.claimDateKey === dateKey
        );

        if (stillClaimedToday) {
          throw new Error('This quest was already claimed today.');
        }
      }

      const next = [record, ...currentClaims];
      savedClaims = next;
      return next;
    });

    await services.storageService.saveQuestClaims(savedClaims);

    const hasEnvelope = issuedEnvelopes.some((entry) => entry.id === envelope.id && entry.type === 'quest');
    if (!hasEnvelope) {
      const nextEnvelopes = [envelope, ...issuedEnvelopes];
      setIssuedEnvelopes(nextEnvelopes);
      await services.storageService.saveIssuedEnvelopes(nextEnvelopes);
    }

    return record;
  }, [walletSession, verifyEnvelope, questClaims, issuedEnvelopes]);

  const checkTicketRedeemed = useCallback(async (envelope: ProofEnvelope<'ticket'>): Promise<{ redeemed: boolean; signature?: string }> => {
    return withTimeout(
      services.ticketService.isRedeemed(envelope.id, services.solanaService, 12000),
      12000,
      'RPC_TIMEOUT',
      'Solana RPC redemption check timed out.'
    );
  }, []);

  const redeemTicket = useCallback(async (envelope: ProofEnvelope<'ticket'>): Promise<{ signature: string; explorerUrl: string }> => {
    if (!walletSession) {
      throw new Error('Connect wallet to redeem ticket.');
    }

    const verification = verifyEnvelope(envelope);
    if (!verification.isValid) {
      throw new Error(verification.reasons[0] ?? 'Ticket envelope is invalid.');
    }

    if (envelope.payload.recipientWallet && envelope.payload.recipientWallet !== walletSession.walletAddress) {
      throw new Error('This ticket is bound to a different wallet.');
    }

    const redeemed = await checkTicketRedeemed(envelope);
    const isSingleUse = envelope.payload.usageMode !== 'multi';
    if (isSingleUse && redeemed.redeemed) {
      throw new Error('Ticket already redeemed.');
    }

    const memo = services.ticketService.formatRedeemMemo(envelope.id, envelope.payload.payloadHash);
    const serializedTx = await withTimeout(
      services.solanaService.createUnsignedMemoTransactionBase64(walletSession.walletAddress, memo),
      12000,
      'RPC_TIMEOUT',
      'Failed to prepare memo transaction.'
    );

    const signature = await withTimeout(
      services.walletService.sendTransaction(serializedTx),
      15000,
      'WALLET_TX_TIMEOUT',
      'Wallet transaction timed out.'
    );

    const confirmed = await withTimeout(
      services.solanaService.isSignatureConfirmed(signature),
      15000,
      'RPC_TIMEOUT',
      'Transaction confirmation check timed out.'
    );

    if (!confirmed) {
      throw new Error('Transaction was not confirmed. Please try again.');
    }

    const redemptionRecord: TicketRedemptionRecord = {
      id: createId('redeem'),
      envelopeId: envelope.id,
      ticketId: envelope.id,
      redeemerWallet: walletSession.walletAddress,
      redeemedAt: new Date().toISOString(),
      txSignature: signature,
    };

    const next = [redemptionRecord, ...ticketRedemptions];
    setTicketRedemptions(next);
    await services.storageService.saveTicketRedemptions(next);

    const clusterQuery = env.solanaCluster === 'mainnet-beta' ? '' : `?cluster=${encodeURIComponent(env.solanaCluster)}`;
    return {
      signature,
      explorerUrl: `${env.solanaExplorerBaseUrl}/tx/${signature}${clusterQuery}`,
    };
  }, [walletSession, verifyEnvelope, checkTicketRedeemed, ticketRedemptions]);

  const decodeEnvelopeFromQr = useCallback((rawData: string): AnyProofEnvelope => {
    return services.envelopeService.decodeFromBase64Url(rawData);
  }, []);

  const encodeEnvelopeToQr = useCallback((envelope: AnyProofEnvelope): string => {
    return services.envelopeService.encodeToBase64Url(envelope);
  }, []);

  const addScanHistory = useCallback(async (entry: Omit<ScanHistoryRecord, 'id' | 'scannedAt'>): Promise<void> => {
    const nextEntry: ScanHistoryRecord = {
      ...entry,
      id: createId('scan'),
      scannedAt: new Date().toISOString(),
    };
    const next = [nextEntry, ...scanHistory].slice(0, 200);
    setScanHistory(next);
    await services.storageService.saveScanHistory(next);
  }, [scanHistory]);

  const verifyProof = useCallback((proof: Proof): VerificationResult => {
    return services.verificationService.verifyProof(proof);
  }, []);

  const verifyMultipleProofs = useCallback((proofList: Proof[]): VerificationResult[] => {
    return proofList.map(proof => services.verificationService.verifyProof(proof));
  }, []);

  const deleteProofbookItem = useCallback(async (id: string, type: 'legacy' | 'quest' | 'notarize' | 'ticket'): Promise<void> => {
    setLoading(true);
    clearError();

    try {
      if (type === 'legacy') {
        const nextProofs = proofs.filter((proof) => proof.id !== id);
        setProofs(nextProofs);
        await services.storageService.saveProofs(nextProofs);
        return;
      }

      const nextEnvelopes = issuedEnvelopes.filter((entry) => !(entry.id === id && entry.type === type));
      setIssuedEnvelopes(nextEnvelopes);

      if (type === 'notarize') {
        const nextProofs = proofs.filter((proof) => proof.id !== id);
        setProofs(nextProofs);
        await Promise.all([
          services.storageService.saveIssuedEnvelopes(nextEnvelopes),
          services.storageService.saveProofs(nextProofs),
        ]);
        return;
      }

      if (type === 'quest') {
        const nextClaims = questClaims.filter((claim) => claim.envelopeId !== id);
        setQuestClaims(nextClaims);
        await Promise.all([
          services.storageService.saveIssuedEnvelopes(nextEnvelopes),
          services.storageService.saveQuestClaims(nextClaims),
        ]);
        return;
      }

      const nextRedemptions = ticketRedemptions.filter((entry) => entry.envelopeId !== id);
      setTicketRedemptions(nextRedemptions);
      await Promise.all([
        services.storageService.saveIssuedEnvelopes(nextEnvelopes),
        services.storageService.saveTicketRedemptions(nextRedemptions),
      ]);
    } catch (unknownError) {
      handleError(unknownError);
    } finally {
      setLoading(false);
    }
  }, [clearError, handleError, issuedEnvelopes, proofs, questClaims, ticketRedemptions]);

  useEffect(() => {
    void (async () => {
      await loadProofs();
      await reconnectWallet();
    })();
  }, [loadProofs, reconnectWallet]);

  const value = useMemo<AppStateContextValue>(() => ({
    proofs,
    issuedEnvelopes,
    questClaims,
    scanHistory,
    ticketRedemptions,
    walletSession,
    loading,
    error,
    connectWallet,
    reconnectWallet,
    disconnectWallet,
    createProof,
    verifyProof,
    verifyMultipleProofs,
    deleteProofbookItem,
    createQuestEnvelope,
    createTicketEnvelope,
    issueNotarizeEnvelope,
    encodeEnvelopeToQr,
    decodeEnvelopeFromQr,
    verifyEnvelope,
    claimQuest,
    checkTicketRedeemed,
    redeemTicket,
    addScanHistory,
    loadProofs,
    clearError,
  }), [
    proofs,
    issuedEnvelopes,
    questClaims,
    scanHistory,
    ticketRedemptions,
    walletSession,
    loading,
    error,
    connectWallet,
    reconnectWallet,
    disconnectWallet,
    createProof,
    verifyProof,
    verifyMultipleProofs,
    deleteProofbookItem,
    createQuestEnvelope,
    createTicketEnvelope,
    issueNotarizeEnvelope,
    encodeEnvelopeToQr,
    decodeEnvelopeFromQr,
    verifyEnvelope,
    claimQuest,
    checkTicketRedeemed,
    redeemTicket,
    addScanHistory,
    loadProofs,
    clearError,
  ]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
};

export const useAppState = (): AppStateContextValue => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used inside AppStateProvider');
  }

  return context;
};
