import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useWallet } from '../hooks/use-wallet';

export const WalletConnectScreen = (): React.JSX.Element => {
  const { walletSession, connectWallet, disconnectWallet, loading, error, clearError } = useWallet();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.icon}>{walletSession ? '✅' : '⚠️'}</Text>
        <Text style={styles.title}>Wallet Connect</Text>
        <Text style={styles.subtitle}>Connect your Solana wallet to create and verify proofs</Text>
      </View>

      {/* Status Card */}
      <View style={[styles.statusCard, walletSession ? styles.statusConnected : styles.statusDisconnected]}>
        <View style={styles.statusTop}>
          <Text style={styles.statusLabel}>Connection Status</Text>
          <Text style={[styles.statusBadge, walletSession ? styles.badgeConnected : styles.badgeDisconnected]}>
            {walletSession ? '🟢 Connected' : '🔴 Disconnected'}
          </Text>
        </View>

        {walletSession && (
          <View style={styles.walletDetails}>
            <Text style={styles.detailLabel}>Wallet Address</Text>
            <Text style={styles.walletAddress}>{walletSession.walletAddress}</Text>
            <Text style={[styles.detailLabel, { marginTop: 12 }]}>
              Connected At
            </Text>
            <Text style={styles.connectedTime}>{new Date(walletSession.connectedAtIso).toLocaleString()}</Text>
          </View>
        )}
      </View>

      {/* Loading State */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5865f2" />
          <Text style={styles.loadingText}>Connecting to wallet...</Text>
        </View>
      ) : null}

      {/* Error */}
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.errorButton} onPress={clearError}>
            <Text style={styles.errorButtonText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Action Button */}
      <TouchableOpacity
        style={[styles.actionButton, walletSession ? styles.actionDisconnect : styles.actionConnect]}
        onPress={() => void (walletSession ? disconnectWallet() : connectWallet())}
        disabled={loading}
      >
        <Text style={styles.actionButtonText}>
          {loading ? 'Connecting...' : walletSession ? '🔓 Disconnect Wallet' : '🔐 Connect + Sign In'}
        </Text>
      </TouchableOpacity>

      {/* Info */}
      {!walletSession && (
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>How it works:</Text>
          <Text style={styles.infoBullet}>1. Tap "Connect + Sign In"</Text>
          <Text style={styles.infoBullet}>2. Select your Solana wallet</Text>
          <Text style={styles.infoBullet}>3. Review and approve the signature request</Text>
          <Text style={styles.infoBullet}>4. Start creating proofs!</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    gap: 16,
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  header: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#222',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  statusCard: {
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
  },
  statusConnected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#22c55e',
  },
  statusDisconnected: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  statusTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeConnected: {
    color: '#166534',
    backgroundColor: '#dcfce7',
  },
  badgeDisconnected: {
    color: '#991b1b',
    backgroundColor: '#fee2e2',
  },
  walletDetails: {
    marginTop: 8,
    gap: 6,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999',
  },
  walletAddress: {
    fontSize: 13,
    fontWeight: '600',
    color: '#222',
    fontFamily: 'monospace',
    backgroundColor: 'rgba(88, 101, 242, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  connectedTime: {
    fontSize: 12,
    color: '#666',
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
    borderRadius: 10,
    padding: 14,
    gap: 10,
  },
  errorIcon: {
    fontSize: 20,
  },
  errorText: {
    fontSize: 13,
    color: '#991b1b',
    fontWeight: '500',
  },
  errorButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  actionButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  actionConnect: {
    backgroundColor: '#5865f2',
  },
  actionDisconnect: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  infoBox: {
    backgroundColor: '#f0f3ff',
    borderRadius: 10,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#5865f2',
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#222',
  },
  infoBullet: {
    fontSize: 12,
    color: '#555',
    marginLeft: 4,
  },
});
