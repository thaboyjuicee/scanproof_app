import React, { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { env } from '../config/env';
import { QRModal } from '../components/qr-modal';
import { useProofs } from '../hooks/use-proofs';
import { RootStackParamList } from '../types/navigation';
import { CardContainer, GradientButton, GradientText, VerifiedBadge } from '../components';

type Props = NativeStackScreenProps<RootStackParamList, 'ProofDetails'>;

export const ProofDetailsScreen = ({ route }: Props): React.JSX.Element => {
  const { proof } = route.params;
  const { issuedEnvelopes, encodeEnvelopeToQr } = useProofs();
  const [qrModalVisible, setQrModalVisible] = useState(false);

  const notarizeEnvelope = issuedEnvelopes.find((entry) => entry.type === 'notarize' && entry.id === proof.id);
  const standardizedQrValue = notarizeEnvelope ? encodeEnvelopeToQr(notarizeEnvelope) : undefined;
  const explorerTxSignature = proof.signature?.trim();

  const handleOpenExplorer = (): void => {
    if (!explorerTxSignature) {
      Alert.alert('Unavailable', 'No on-chain transaction signature available for this proof yet.');
      return;
    }

    const clusterQuery = env.solanaCluster === 'mainnet-beta' ? '' : `?cluster=${encodeURIComponent(env.solanaCluster)}`;
    void Linking.openURL(`${env.solanaExplorerBaseUrl}/tx/${explorerTxSignature}${clusterQuery}`);
  };

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <LinearGradient colors={['#faf5ff', '#ffffff', '#eff6ff']} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <GradientText style={styles.title}>{proof.title}</GradientText>
            <View style={styles.badgeRow}>
              <VerifiedBadge label={proof.proofType} variant="info" />
              <VerifiedBadge label="Verified" variant="success" />
            </View>
          </View>

          {proof.description && (
            <CardContainer>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Feather name="file-text" size={20} color="#9333ea" />
                  <Text style={styles.sectionTitle}>Description</Text>
                </View>
                <Text style={styles.description}>{proof.description}</Text>
              </View>
            </CardContainer>
          )}

          <CardContainer>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Feather name="link-2" size={20} color="#9333ea" />
                <Text style={styles.sectionTitle}>Blockchain Proof</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.label}>Hash</Text>
                <Text style={styles.valueCode} selectable>{proof.hash}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Owner</Text>
                <Text style={styles.valueCode} selectable>
                  {proof.ownerWallet.substring(0, 8)}...{proof.ownerWallet.substring(proof.ownerWallet.length - 8)}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Created</Text>
                <Text style={styles.value}>{formatDate(proof.timestampIso)}</Text>
              </View>

              {proof.signature && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Signature</Text>
                  <Text style={styles.valueCode} selectable>
                    {proof.signature.substring(0, 16)}...
                  </Text>
                </View>
              )}
            </View>
          </CardContainer>

          {proof.ipfsCid && (
            <CardContainer>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Feather name="database" size={20} color="#9333ea" />
                  <Text style={styles.sectionTitle}>IPFS Storage</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>CID</Text>
                  <Text style={styles.valueCode} selectable>{proof.ipfsCid}</Text>
                </View>
              </View>
            </CardContainer>
          )}

          <GradientButton
            title="Show QR Code"
            onPress={() => setQrModalVisible(true)}
            icon="maximize"
          />

          <TouchableOpacity style={styles.explorerLinkWrap} onPress={handleOpenExplorer}>
            <Text style={styles.explorerLink}>View on Solana Explorer ↗</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>

      <QRModal
        visible={qrModalVisible}
        proof={proof}
        qrValue={standardizedQrValue}
        onClose={() => setQrModalVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 20,
    gap: 20,
  },
  header: {
    gap: 12,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  section: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6b7280',
  },
  infoRow: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 14,
    color: '#1f2937',
  },
  valueCode: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: '#7c3aed',
    backgroundColor: '#faf5ff',
    padding: 8,
    borderRadius: 6,
  },
  explorerLinkWrap: {
    alignItems: 'center',
  },
  explorerLink: {
    color: '#7C3AED',
    fontSize: 13,
    fontWeight: '600',
  },
});
