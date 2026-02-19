import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useWallet } from '../hooks/use-wallet';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export const HomeScreen = ({ navigation }: Props): React.JSX.Element => {
  const { walletSession } = useWallet();

  const features = [
    { icon: '📝', title: 'Create Proof', desc: 'Generate blockchain-anchored proofs', nav: 'CreateProof' },
    { icon: '✅', title: 'Verify Proof', desc: 'Verify proof authenticity', nav: 'VerifyProof' },
    { icon: '📋', title: 'My Proofs', desc: 'View saved proofs', nav: 'ProofList' },
    { icon: '📄', title: 'Manual Verify', desc: 'Paste proof data to verify', nav: 'QRScanner' },
    { icon: '🔗', title: 'Wallet', desc: 'Connect and manage wallet', nav: 'WalletConnect' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appName}>ScanProof</Text>
        <Text style={styles.tagline}>Blockchain-Anchored Proofs on Solana</Text>
      </View>

      {/* Wallet Status */}
      <View style={[styles.walletCard, walletSession ? styles.walletConnected : styles.walletDisconnected]}>
        <Text style={styles.walletIcon}>{walletSession ? '✅' : '⚠️'}</Text>
        <View style={styles.walletInfo}>
          <Text style={styles.walletLabel}>Wallet Status</Text>
          <Text style={styles.walletAddress}>
            {walletSession ? `${walletSession.walletAddress.slice(0, 8)}...${walletSession.walletAddress.slice(-8)}` : 'Not Connected'}
          </Text>
        </View>
      </View>

      {/* Features Grid */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Features</Text>
        <View style={styles.featuresGrid}>
          {features.map((feature) => (
            <TouchableOpacity
              key={feature.nav}
              style={styles.featureCard}
              onPress={() => navigation.navigate(feature.nav as any)}
            >
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDesc}>{feature.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.infoText}>
          ScanProof creates tamper-proof digital proofs anchored to Solana blockchain. Every proof is signed by your wallet and verified against on-chain data.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    gap: 20,
    backgroundColor: '#f9f9f9',
  },
  header: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    marginBottom: 8,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: '#5865f2',
  },
  tagline: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  walletConnected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#22c55e',
  },
  walletDisconnected: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  walletIcon: {
    fontSize: 28,
  },
  walletInfo: {
    flex: 1,
    gap: 4,
  },
  walletLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  walletAddress: {
    fontSize: 14,
    color: '#222',
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  featuresSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
  },
  featuresGrid: {
    gap: 10,
  },
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  featureIcon: {
    fontSize: 32,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
  },
  featureDesc: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
  infoSection: {
    gap: 12,
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    fontWeight: '500',
  },
});
