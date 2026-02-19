import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { Proof, ProofType } from '../models/proof';
import { VerificationResult } from '../models/verification-result';
import { WalletSession } from '../models/wallet-session';
import { services } from '../services';
import { logger } from '../utils/logger';

interface AppStateContextValue {
  proofs: Proof[];
  walletSession: WalletSession | null;
  loading: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  reconnectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  createProof: (title: string, description: string, proofType: ProofType, uploadToIpfs: boolean, fileUri?: string) => Promise<void>;
  verifyProof: (proof: Proof) => VerificationResult;
  verifyMultipleProofs: (proofs: Proof[]) => VerificationResult[];
  loadProofs: () => Promise<void>;
  clearError: () => void;
}

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

export const AppStateProvider = ({ children }: { children: React.ReactNode }): React.JSX.Element => {
  const [proofs, setProofs] = useState<Proof[]>([]);
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
      const stored = await services.storageService.getProofs();
      setProofs(stored.sort((a, b) => b.timestampIso.localeCompare(a.timestampIso)));
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
      const session = await services.walletService.connect();
      const signInMessage = `ScanProof sign-in ${new Date().toISOString()}`;
      const signed = await services.walletService.signMessage(signInMessage);

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

  const createProof = useCallback(async (title: string, description: string, proofType: ProofType, uploadToIpfs: boolean, fileUri?: string) => {
    if (!walletSession) {
      setError('Connect wallet before creating a proof.');
      return;
    }

    setLoading(true);
    clearError();

    try {
      let fileUrl: string | undefined;
      let fileName: string | undefined;

      // Upload file if provided
      if (fileUri) {
        const urlParts = fileUri.split('/');
        fileName = urlParts[urlParts.length - 1];
        const uploadResponse = await services.fileUploadService.uploadFile(fileUri, fileName);
        fileUrl = uploadResponse.url;
        logger.info('File uploaded', { fileName, fileUrl });
      }

      const signedPayload = await services.walletService.signMessage(`Proof:${title}:${Date.now()}`);
      const proof = services.proofService.createProof({
        title,
        description,
        ownerWallet: walletSession.walletAddress,
        proofType,
        fileUrl,
        fileName,
        signedPayload,
      });

      let nextProof: Proof = proof;
      if (uploadToIpfs) {
        const cid = await services.ipfsService.uploadProof(proof);
        nextProof = {
          ...proof,
          ipfsCid: cid,
        };
      }

      const updated = [nextProof, ...proofs];
      setProofs(updated);
      await services.storageService.saveProofs(updated);
    } catch (unknownError) {
      handleError(unknownError);
    } finally {
      setLoading(false);
    }
  }, [clearError, handleError, proofs, walletSession]);

  const verifyProof = useCallback((proof: Proof): VerificationResult => {
    return services.verificationService.verifyProof(proof);
  }, []);

  const verifyMultipleProofs = useCallback((proofList: Proof[]): VerificationResult[] => {
    return proofList.map(proof => services.verificationService.verifyProof(proof));
  }, []);

  useEffect(() => {
    void (async () => {
      await loadProofs();
      await reconnectWallet();
    })();
  }, [loadProofs, reconnectWallet]);

  const value = useMemo<AppStateContextValue>(() => ({
    proofs,
    walletSession,
    loading,
    error,
    connectWallet,
    reconnectWallet,
    disconnectWallet,
    createProof,
    verifyProof,
    verifyMultipleProofs,
    loadProofs,
    clearError,
  }), [
    proofs,
    walletSession,
    loading,
    error,
    connectWallet,
    reconnectWallet,
    disconnectWallet,
    createProof,
    verifyProof,
    verifyMultipleProofs,
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
