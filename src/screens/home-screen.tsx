import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

import { useWallet } from '../hooks/use-wallet';
import { WalletButton, CardContainer, VerifiedBadge, GradientText } from '../components';

export const HomeScreen = (): React.JSX.Element => {
  const { walletSession, connectWallet } = useWallet();

  const features = [
    { icon: 'shield', title: 'Tamper Proof', desc: 'Cryptographically secure proofs' },
    { icon: 'link-2', title: 'On-Chain Proof', desc: 'Verified on Solana blockchain' },
    { icon: 'zap', title: 'Instant Verify', desc: 'Scan and verify instantly' },
  ];

  const steps = [
    { number: '1', title: 'Create Proof', desc: 'Upload files and create your proof' },
    { number: '2', title: 'Get QR Code', desc: 'Receive a unique QR code' },
    { number: '3', title: 'Verify Anytime', desc: 'Scan to verify authenticity' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Gradient Background */}
      <LinearGradient
        colors={['#faf5ff', '#ffffff', '#eff6ff']}
        style={styles.gradientBg}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={['#9333ea', '#2563eb']}
            style={styles.logo}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Feather name="shield" size={24} color="#ffffff" />
          </LinearGradient>
        </View>
        <View style={styles.headerText}>
          <GradientText style={styles.appName}>ScanProof</GradientText>
          <Text style={styles.subtitle}>Verified on Solana</Text>
        </View>
      </View>

      {/* Hero Section */}
      <CardContainer style={styles.heroCard}>
        <Text style={styles.heroTitle}>
          Create Tamper-Proof{'\n'}Digital Certificates
        </Text>
        <Text style={styles.heroSubtext}>
          Generate blockchain-anchored proofs with QR codes for instant verification
        </Text>
        <WalletButton
          connected={!!walletSession}
          walletAddress={walletSession?.walletAddress}
          onPress={() => void connectWallet()}
        />
      </CardContainer>

      {/* Features */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why ScanProof?</Text>
        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <CardContainer key={index} style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <Feather name={feature.icon as any} size={24} color="#9333ea" />
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDesc}>{feature.desc}</Text>
            </CardContainer>
          ))}
        </View>
      </View>

      {/* How It Works */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        <View style={styles.stepsContainer}>
          {steps.map((step, index) => (
            <View key={index} style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{step.number}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Info Badges */}
      <View style={styles.badgesRow}>
        <VerifiedBadge label="Solana Devnet" variant="info" />
        <VerifiedBadge label="IPFS Storage" variant="info" />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  gradientBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  logoContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  appName: {
    fontSize: 24,
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  heroCard: {
    margin: 16,
    marginTop: 8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    lineHeight: 36,
  },
  heroSubtext: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 20,
    lineHeight: 24,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
    padding: 16,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  featureDesc: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  stepsContainer: {
    gap: 16,
  },
  stepItem: {
    flexDirection: 'row',
    gap: 16,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#9333ea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 14,
    color: '#6b7280',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
  },
});
