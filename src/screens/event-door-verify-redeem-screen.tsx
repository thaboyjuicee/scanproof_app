import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

import { GradientButton, GradientText, VerifiedBadge } from '../components';
import { useProofs } from '../hooks/use-proofs';
import { ProofEnvelope } from '../models/proof-envelope';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'EventDoorVerifyRedeem'>;

export const EventDoorVerifyRedeemScreen = ({ route }: Props): React.JSX.Element => {
  const { width } = useWindowDimensions();
  const { issuedEnvelopes, verifyEntryPassClaim, checkEntryPassRedeemed, redeemEntryPass, loading } = useProofs();
  const { entryPass } = route.params;
  const [claimStatus, setClaimStatus] = useState<{ claimed: boolean; signature?: string }>({ claimed: false });
  const [redeemStatus, setRedeemStatus] = useState<{ redeemed: boolean; signature?: string }>({ redeemed: false });
  const [explorerUrl, setExplorerUrl] = useState<string | null>(null);
  const isCompact = width < 380;

  const eventEnvelope = useMemo<ProofEnvelope<'event'> | undefined>(
    () => issuedEnvelopes.find((envelope): envelope is ProofEnvelope<'event'> => envelope.type === 'event' && envelope.id === entryPass.eventId),
    [issuedEnvelopes, entryPass.eventId]
  );

  const isActive = useMemo(() => {
    if (!eventEnvelope) {
      return true;
    }
    const now = Date.now();
    const from = Date.parse(eventEnvelope.payload.validFrom);
    const to = Date.parse(eventEnvelope.payload.validTo);
    if (!Number.isNaN(from) && now < from) {
      return false;
    }
    if (!Number.isNaN(to) && now > to) {
      return false;
    }
    return true;
  }, [eventEnvelope]);

  const refreshStatuses = useCallback(async (): Promise<void> => {
    try {
      const claim = await verifyEntryPassClaim(entryPass);
      setClaimStatus(claim);
      if (!claim.claimed) {
        setRedeemStatus({ redeemed: false });
        return;
      }

      const redeemed = await checkEntryPassRedeemed(entryPass);
      setRedeemStatus(redeemed);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to verify entry pass.';
      Alert.alert('Lookup Error', message);
    }
  }, [verifyEntryPassClaim, checkEntryPassRedeemed, entryPass]);

  useEffect(() => {
    void refreshStatuses();
  }, [refreshStatuses]);

  const onRedeem = async (): Promise<void> => {
    try {
      const result = await redeemEntryPass(entryPass);
      setRedeemStatus({ redeemed: true, signature: result.signature });
      setExplorerUrl(result.explorerUrl);
      Alert.alert('Redeemed', 'Entry pass redeemed on-chain.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Redeem failed.';
      if (message === 'REDEEMED') {
        setRedeemStatus({ redeemed: true });
      }
      Alert.alert(message === 'REDEEMED' ? 'REDEEMED' : 'Redeem Blocked', message);
    }
  };

  const canRedeem = claimStatus.claimed && !redeemStatus.redeemed && isActive;

  return (
    <LinearGradient colors={['#faf5ff', '#ffffff', '#eff6ff']} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container}>
        <GradientText style={[styles.title, isCompact && styles.titleCompact]}>Door Verify & Redeem</GradientText>
        <Text style={styles.subtitle}>Verify claim + redeem this entry pass exactly once.</Text>

        <View style={styles.badges}>
          <VerifiedBadge label={claimStatus.claimed ? 'CLAIM FOUND' : 'CLAIM NOT FOUND'} variant={claimStatus.claimed ? 'success' : 'warning'} />
          <VerifiedBadge label={redeemStatus.redeemed ? 'REDEEMED' : 'NOT REDEEMED'} variant={redeemStatus.redeemed ? 'warning' : 'success'} />
          <VerifiedBadge label={isActive ? 'ACTIVE' : 'EXPIRED'} variant={isActive ? 'success' : 'warning'} />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Event ID</Text>
          <Text style={styles.value}>{entryPass.eventId}</Text>
          <Text style={styles.label}>Attendee Wallet</Text>
          <Text style={styles.value}>{entryPass.attendeeWallet}</Text>
          <Text style={styles.label}>Pass Issued</Text>
          <Text style={styles.value}>{new Date(entryPass.issuedAt).toLocaleString()}</Text>
          {eventEnvelope ? (
            <>
              <Text style={styles.label}>Event</Text>
              <Text style={styles.value}>{eventEnvelope.payload.eventName}</Text>
              <Text style={styles.label}>Window</Text>
              <Text style={styles.value}>{new Date(eventEnvelope.payload.validFrom).toLocaleString()} - {new Date(eventEnvelope.payload.validTo).toLocaleString()}</Text>
            </>
          ) : null}
        </View>

        <GradientButton title={loading ? 'Redeeming...' : 'Redeem'} onPress={() => void onRedeem()} disabled={loading || !canRedeem} icon="check-circle" />

        <GradientButton title="Refresh" onPress={() => void refreshStatuses()} variant="secondary" icon="refresh-cw" />

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
  linkButton: { alignItems: 'center', paddingVertical: 10 },
  linkText: { color: '#2563eb', fontWeight: '700' },
});
