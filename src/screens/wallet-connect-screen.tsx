import React from 'react';
import { ActivityIndicator, Button, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useWallet } from '../hooks/use-wallet';

export const WalletConnectScreen = (): React.JSX.Element => {
  const { walletSession, connectWallet, disconnectWallet, loading, error, clearError } = useWallet();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Wallet Connect</Text>
      <Text style={styles.status}>Status: {walletSession ? 'Connected' : 'Disconnected'}</Text>
      <Text style={styles.address}>{walletSession?.walletAddress ?? 'No active session'}</Text>

      {loading ? <ActivityIndicator size="large" /> : null}

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Dismiss Error" onPress={clearError} />
        </View>
      ) : null}

      {!walletSession ? (
        <Button title="Connect + Sign In" onPress={() => void connectWallet()} />
      ) : (
        <Button title="Disconnect Wallet" onPress={() => void disconnectWallet()} />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    gap: 12,
    padding: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  status: {
    fontSize: 16,
  },
  address: {
    fontSize: 12,
    color: '#333',
  },
  errorContainer: {
    padding: 12,
    backgroundColor: '#fee',
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    color: '#900',
  },
});
