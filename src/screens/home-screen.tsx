import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock3, FileText, Lock, QrCode, Scan, Shield, Ticket, Users, Zap } from 'lucide-react-native';

import { useWallet } from '../hooks/use-wallet';

const cardShadow = {
  shadowColor: '#000000',
  shadowOpacity: 0.06,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 } as const,
  elevation: 2,
};

export const HomeScreen = (): React.JSX.Element => {
  const navigation = useNavigation<any>();
  const { walletSession, connectWallet } = useWallet();
  const isConnected = !!walletSession;

  const features = [
    {
      Icon: Shield,
      colors: ['#7C3AED', '#9333EA'] as const,
      title: 'Cryptographically Verified',
      description: 'Every QR code is backed by immutable blockchain proof',
    },
    {
      Icon: Lock,
      colors: ['#2563EB', '#3B82F6'] as const,
      title: 'Tamper-Proof',
      description: 'Content integrity verified with SHA-256 hashing',
    },
    {
      Icon: Clock3,
      colors: ['#16A34A', '#22C55E'] as const,
      title: 'Timestamped',
      description: 'On-chain timestamps prove creation time',
    },
    {
      Icon: Zap,
      colors: ['#EA580C', '#F97316'] as const,
      title: 'Instant Verification',
      description: 'Scan and verify in seconds using Solana',
    },
  ];

  const proofTypes = [
    {
      Icon: Users,
      colors: ['#7C3AED', '#8B5CF6'] as const,
      title: 'Quest Check-in',
      description: 'IRL events & community check-ins with badge claiming',
    },
    {
      Icon: FileText,
      colors: ['#2563EB', '#06B6D4'] as const,
      title: 'Notarize File',
      description: 'Certify any file with SHA-256 hash + wallet signature',
    },
    {
      Icon: Ticket,
      colors: ['#059669', '#14B8A6'] as const,
      title: 'Gate Pass',
      description: 'Redeemable tickets with on-chain redemption memo',
    },
  ];

  const steps = [
    {
      number: '1',
      circleBackground: '#EDE9FE',
      numberColor: '#7C3AED',
      title: 'Connect Your Wallet',
      description: 'Use any Solana wallet like Phantom or Solflare',
    },
    {
      number: '2',
      circleBackground: '#DBEAFE',
      numberColor: '#2563EB',
      title: 'Pick a Proof Type & Create',
      description: 'Quest, Notarize, or Gate Pass — each signed on Solana with your wallet',
    },
    {
      number: '3',
      circleBackground: '#DCFCE7',
      numberColor: '#16A34A',
      title: 'Scan & Verify',
      description: 'Auto-detects proof type — quests get claimed, files get verified, tickets get redeemed on-chain',
    },
  ];

  const goToCreate = (): void => {
    navigation.navigate('CreateTab');
  };

  const goToScan = (): void => {
    navigation.navigate('ScanTab');
  };

  const onConnect = (): void => {
    if (!isConnected) {
      void connectWallet();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.heroSection}>
          <LinearGradient colors={['#7C3AED', '#2563EB']} style={styles.heroIconWrap}>
            <QrCode size={48} color="#ffffff" strokeWidth={2.25} />
          </LinearGradient>

          <MaskedView
            style={styles.maskedView}
            maskElement={<Text style={styles.appNameMask}>ScanProof</Text>}
          >
            <LinearGradient colors={['#7C3AED', '#2563EB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.appNameGradient}>ScanProof</Text>
            </LinearGradient>
          </MaskedView>

          <Text style={styles.subtitle}>
            Create and verify QR codes with blockchain-backed authenticity on Solana
          </Text>

          <View style={styles.walletActionsRow}>
            {!isConnected ? (
              <TouchableOpacity activeOpacity={0.9} onPress={onConnect} style={styles.fullWidthButtonWrap}>
                <LinearGradient colors={['#7C3AED', '#2563EB']} style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>Connect Wallet</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity activeOpacity={0.9} onPress={goToCreate} style={styles.halfButtonWrap}>
                  <LinearGradient colors={['#7C3AED', '#2563EB']} style={styles.primaryButton}>
                    <QrCode size={18} color="#ffffff" strokeWidth={2.25} />
                    <Text style={styles.primaryButtonText}>Create QR</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.9} onPress={goToScan} style={[styles.halfButtonWrap, styles.outlineButton]}>
                  <Scan size={18} color="#7C3AED" strokeWidth={2.25} />
                  <Text style={styles.outlineButtonText}>Scan QR</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why ScanProof?</Text>
          <View style={styles.featureGrid}>
            {features.map((feature) => (
              <View key={feature.title} style={styles.featureCard}>
                <LinearGradient colors={feature.colors} style={styles.featureIconWrap}>
                  <feature.Icon size={24} color="#ffffff" strokeWidth={2.25} />
                </LinearGradient>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3 Types of On-Chain Proof</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {proofTypes.map((item) => (
              <TouchableOpacity key={item.title} style={styles.proofTypeCard} activeOpacity={0.9} onPress={goToCreate}>
                <LinearGradient colors={item.colors} style={styles.proofTypeIconWrap}>
                  <item.Icon size={20} color="#ffffff" strokeWidth={2.25} />
                </LinearGradient>
                <Text style={styles.proofTypeTitle}>{item.title}</Text>
                <Text style={styles.proofTypeDescription}>{item.description}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.howItWorksCard}>
            <Text style={styles.howItWorksTitle}>How It Works</Text>

            {steps.map((step, index) => (
              <View key={step.number} style={[styles.stepRow, index === steps.length - 1 && styles.stepRowLast]}>
                <View style={[styles.stepNumberCircle, { backgroundColor: step.circleBackground }]}>
                  <Text style={[styles.stepNumberText, { color: step.numberColor }]}>{step.number}</Text>
                </View>
                <View style={styles.stepTextWrap}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.footer}>Running on Solana Devnet • Using IPFS for decentralized storage</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF5FF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAF5FF',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 92,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 32,
  },
  heroIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  maskedView: {
    marginTop: 16,
  },
  appNameMask: {
    fontSize: 48,
    fontWeight: '900',
    textAlign: 'center',
  },
  appNameGradient: {
    fontSize: 48,
    fontWeight: '900',
    color: 'transparent',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 12,
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 26,
  },
  walletActionsRow: {
    marginTop: 16,
    width: '100%',
    flexDirection: 'row',
    gap: 10,
  },
  fullWidthButtonWrap: {
    width: '100%',
  },
  halfButtonWrap: {
    flex: 1,
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  outlineButton: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#DDD6FE',
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
  },
  outlineButtonText: {
    color: '#7C3AED',
    fontSize: 16,
    fontWeight: '700',
  },
  section: {
    marginTop: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    padding: 16,
    ...cardShadow,
  },
  featureIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  proofTypeCard: {
    width: 200,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    padding: 16,
    ...cardShadow,
  },
  proofTypeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proofTypeTitle: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  proofTypeDescription: {
    marginTop: 4,
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  howItWorksCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#EDE9FE',
    ...cardShadow,
  },
  howItWorksTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
    color: '#111827',
  },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  stepRowLast: {
    marginBottom: 0,
  },
  stepNumberCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
  },
  stepTextWrap: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  stepDescription: {
    marginTop: 4,
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  footer: {
    marginTop: 32,
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
  },
});
