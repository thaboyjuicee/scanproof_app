import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

import { GradientButton, GradientText, VerifiedBadge } from '../components';
import { useProofs } from '../hooks/use-proofs';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'EventClaim'>;

export const EventClaimScreen = ({ route, navigation }: Props): React.JSX.Element => {
  const { width } = useWindowDimensions();
  const { verifyEnvelope, getEventClaimStats, claimEventPass, loading } = useProofs();
  const envelope = route.params.envelope;
  const verification = useMemo(() => verifyEnvelope(envelope), [verifyEnvelope, envelope]);
  const [claimedCount, setClaimedCount] = useState(0);
  const [estimatedRemaining, setEstimatedRemaining] = useState(envelope.payload.capacity);
  const [claimExplorerUrl, setClaimExplorerUrl] = useState<string | null>(null);

  const isCompact = width < 380;

  const refreshStats = useCallback(async (): Promise<void> => {
    try {
      const stats = await getEventClaimStats(envelope);
      setClaimedCount(stats.claimedCount);
      setEstimatedRemaining(stats.estimatedRemaining);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not fetch claim stats.';
      Alert.alert('Stats Error', message);
    }
  }, [getEventClaimStats, envelope]);

  const onClaim = async (): Promise<void> => {
    try {
      const result = await claimEventPass(envelope);
      setClaimExplorerUrl(result.explorerUrl);
      await refreshStats();
      navigation.navigate('EntryPass', { entryPass: result.entryPass, eventEnvelope: envelope });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Claim failed.';
      if (/429|timed out|timeout/i.test(message)) {
        Alert.alert('Claim Delayed', 'Devnet RPC is busy. Tap Retry in a few seconds, keep the wallet open, and try claiming again.');
        return;
      }

      Alert.alert('Claim Blocked', message);
    }
  };

  return (
    <LinearGradient colors={['#faf5ff', '#ffffff', '#eff6ff']} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container}>
        <GradientText style={[styles.title, isCompact && styles.titleCompact]}>Ticket Claim</GradientText>
        <Text style={styles.subtitle}>Claim one Entry Pass per wallet using an on-chain memo.</Text>

        <View style={styles.badges}>
          <VerifiedBadge label={verification.signatureValid ? 'Signature OK' : 'Bad Signature'} variant={verification.signatureValid ? 'success' : 'warning'} />
          <VerifiedBadge label={verification.timeWindowValid ? 'Active' : 'Expired'} variant={verification.timeWindowValid ? 'success' : 'warning'} />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Event</Text>
          <Text style={styles.value}>{envelope.payload.eventName}</Text>
          {envelope.payload.description ? (
            <>
              <Text style={styles.label}>Description</Text>
              <Text style={styles.value}>{envelope.payload.description}</Text>
            </>
          ) : null}
          {envelope.payload.venue ? (
            <>
              <Text style={styles.label}>Venue</Text>
              <Text style={styles.value}>{envelope.payload.venue}</Text>
            </>
          ) : null}
          <Text style={styles.label}>Issuer Wallet</Text>
          <Text style={styles.value}>{envelope.issuerPublicKey}</Text>
          <Text style={styles.label}>Window</Text>
          <Text style={styles.value}>{new Date(envelope.payload.validFrom).toLocaleString()} - {new Date(envelope.payload.validTo).toLocaleString()}</Text>
          <Text style={styles.label}>Capacity (Informational)</Text>
          <Text style={styles.value}>{envelope.payload.capacity}</Text>
          <Text style={styles.label}>Estimated Remaining</Text>
          <Text style={styles.value}>{estimatedRemaining} (claimed: {claimedCount})</Text>
        </View>

        {verification.reasons.length > 0 ? (
          <View style={styles.errorCard}>
            {verification.reasons.map((reason) => (
              <Text key={reason} style={styles.errorText}>• {reason}</Text>
            ))}
          </View>
        ) : null}

        <GradientButton
          title={loading ? 'Claiming...' : 'Claim Entry Pass'}
          onPress={() => void onClaim()}
          disabled={loading || !verification.isValid}
          icon="check-circle"
        />

        <GradientButton title="Refresh Remaining" onPress={() => void refreshStats()} variant="secondary" icon="refresh-cw" />

        {claimExplorerUrl ? (
          <TouchableOpacity style={styles.linkButton} onPress={() => void Linking.openURL(claimExplorerUrl)}>
            <Text style={styles.linkText}>View Claim Tx</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flexGrow: 1, padding: 20, gap: 12, width: '100%', maxWidth: 760, alignSelf: 'center' },
  title: { fontSize: 28, fontWeight: '700' },
  titleCompact: { fontSize: 24 },
  subtitle: { color: '#6b7280' },
  badges: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    gap: 6,
  },
  label: { fontSize: 12, color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase' },
  value: { fontSize: 14, color: '#1f2937' },
  errorCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 12,
    gap: 4,
  },
  errorText: { color: '#991b1b', fontSize: 13 },
  linkButton: { alignItems: 'center', paddingVertical: 10 },
  linkText: { color: '#2563eb', fontWeight: '700' },
});
