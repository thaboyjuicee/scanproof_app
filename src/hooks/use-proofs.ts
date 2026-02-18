import { useAppState } from '../state/app-state';

export const useProofs = () => {
  const { proofs, createProof, verifyProof, loading, error, clearError } = useAppState();

  return {
    proofs,
    createProof,
    verifyProof,
    loading,
    error,
    clearError,
  };
};
