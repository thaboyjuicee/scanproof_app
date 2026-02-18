import { useAppState } from '../state/app-state';

export const useWallet = () => {
  const { walletSession, connectWallet, disconnectWallet, reconnectWallet, loading, error, clearError } = useAppState();

  return {
    walletSession,
    connectWallet,
    disconnectWallet,
    reconnectWallet,
    loading,
    error,
    clearError,
  };
};
