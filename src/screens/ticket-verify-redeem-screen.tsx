import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

import { GradientButton, GradientText, VerifiedBadge } from '../components';
import { useProofs } from '../hooks/use-proofs';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'TicketVerifyRedeem'>;

export const TicketVerifyRedeemScreen = ({ route }: Props): React.JSX.Element => {
  const { verifyEnvelope, checkTicketRedeemed, redeemTicket, loading } = useProofs();
  const envelope = route.params.envelope;
  const verification = useMemo(() => verifyEnvelope(envelope), [verifyEnvelope, envelope]);
  const [redeemed, setRedeemed] = useState<{ redeemed: boolean; signature?: string }>({ redeemed: false });
  const [explorerUrl, setExplorerUrl] = useState<string | null>(null);

  const refreshRedeemed = useCallback(async (): Promise<void> => {
    try {
      const state = await checkTicketRedeemed(envelope);
      setRedeemed(state);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed redemption lookup.';
      Alert.alert('Lookup Error', message);
    }
  }, [checkTicketRedeemed, envelope]);

  useEffect(() => {
    void refreshRedeemed();
  }, [refreshRedeemed]);

  const onRedeem = async (): Promise<void> => {
    try {
      const result = await redeemTicket(envelope);
      setExplorerUrl(result.explorerUrl);
      Alert.alert('Redeemed', 'Ticket redeemed successfully on-chain.');
      await refreshRedeemed();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Redeem failed.';
      Alert.alert('Redeem Blocked', message);
    }
  };

  const canRedeem = verification.isValid && !redeemed.redeemed;

  return (
    <LinearGradient colors={['#faf5ff', '#ffffff', '#eff6ff']} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container}>
        <GradientText style={styles.title}>Ticket Verify & Redeem</GradientText>
        <Text style={styles.subtitle}>Verify organizer signature, expiry, and redemption state.</Text>

        <View style={styles.badges}>
          <VerifiedBadge label={verification.signatureValid ? 'Signature OK' : 'Bad Signature'} variant={verification.signatureValid ? 'success' : 'warning'} />
          <VerifiedBadge label={verification.timeWindowValid ? 'In Window' : 'Expired'} variant={verification.timeWindowValid ? 'success' : 'warning'} />
          <VerifiedBadge label={redeemed.redeemed ? 'REDEEMED' : 'NOT REDEEMED'} variant={redeemed.redeemed ? 'warning' : 'success'} />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Event</Text>
          <Text style={styles.value}>{envelope.payload.eventName}</Text>
          {envelope.payload.venue ? (
            <>
              <Text style={styles.label}>Venue</Text>
              <Text style={styles.value}>{envelope.payload.venue}</Text>
            </>
          ) : null}
          <Text style={styles.label}>Validity</Text>
          <Text style={styles.value}>{new Date(envelope.payload.validFrom).toLocaleString()} - {new Date(envelope.payload.validTo).toLocaleString()}</Text>
          {envelope.payload.recipientWallet ? (
            <>
              <Text style={styles.label}>Recipient Wallet</Text>
              <Text style={styles.value}>{envelope.payload.recipientWallet}</Text>
            </>
          ) : null}
          {redeemed.signature ? (
            <>
              <Text style={styles.label}>Redemption Tx</Text>
              <Text style={styles.value}>{redeemed.signature}</Text>
            </>
          ) : null}
        </View>

        {verification.reasons.length > 0 ? (
          <View style={styles.errorCard}>
            {verification.reasons.map((reason) => (
              <Text key={reason} style={styles.errorText}>• {reason}</Text>
            ))}
          </View>
        ) : null}

        <GradientButton title={loading ? 'Redeeming...' : 'Redeem Ticket'} onPress={() => void onRedeem()} disabled={loading || !canRedeem} icon="check-circle" />

        <GradientButton title="Refresh Redemption Status" onPress={() => void refreshRedeemed()} variant="secondary" icon="refresh-cw" />

        {explorerUrl ? (
          <TouchableOpacity style={styles.linkButton} onPress={() => void Linking.openURL(explorerUrl)}>
            <Text style={styles.linkText}>View on Explorer</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flexGrow: 1, padding: 20, gap: 12 },
  title: { fontSize: 28, fontWeight: '700' },
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
  linkButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  linkText: {
    color: '#2563eb',
    fontWeight: '700',
  },
});
