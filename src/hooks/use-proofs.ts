import { useAppState } from '../state/app-state';

export const useProofs = () => {
  const { proofs, createProof, verifyProof, verifyMultipleProofs, loading, error, clearError } = useAppState();

  return {
    proofs,
    createProof,
    verifyProof,
    verifyMultipleProofs,
    loading,
    error,
    clearError,
  };
};
