import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

import { BrandedQrCard, GradientText, VerifiedBadge } from '../components';
import { useProofs } from '../hooks/use-proofs';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'EntryPass'>;

export const EntryPassScreen = ({ route }: Props): React.JSX.Element => {
  const { width } = useWindowDimensions();
  const { encodeEntryPassToQr } = useProofs();
  const { entryPass, eventEnvelope } = route.params;
  const qrValue = useMemo(() => encodeEntryPassToQr(entryPass), [encodeEntryPassToQr, entryPass]);
  const isCompact = width < 380;

  return (
    <LinearGradient colors={['#faf5ff', '#ffffff', '#eff6ff']} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container}>
        <GradientText style={[styles.title, isCompact && styles.titleCompact]}>Your Entry Pass</GradientText>
        <Text style={styles.subtitle}>Show this QR at the door for one-time redemption.</Text>

        <View style={styles.badges}>
          <VerifiedBadge label="Claimed On-chain" variant="success" />
          <VerifiedBadge label="Single-use at Door" variant="warning" />
        </View>

        <View style={styles.qrWrap}>
          <BrandedQrCard
            value={qrValue}
            size={240}
            type="ticket"
            title="Entry Pass"
            subtitle={eventEnvelope.payload.eventName}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Event</Text>
          <Text style={styles.value}>{eventEnvelope.payload.eventName}</Text>
          <Text style={styles.label}>Attendee Wallet</Text>
          <Text style={styles.value}>{entryPass.attendeeWallet}</Text>
          <Text style={styles.label}>Issued</Text>
          <Text style={styles.value}>{new Date(entryPass.issuedAt).toLocaleString()}</Text>
        </View>
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
  qrWrap: {
    alignItems: 'center',
    paddingVertical: 8,
  },
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
});
