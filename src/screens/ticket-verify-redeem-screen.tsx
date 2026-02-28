import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

import { GradientText, VerifiedBadge } from '../components';
import { useProofs } from '../hooks/use-proofs';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'TicketVerifyRedeem'>;

export const TicketVerifyRedeemScreen = ({ route }: Props): React.JSX.Element => {
  const { width } = useWindowDimensions();
  const { verifyEnvelope } = useProofs();
  const envelope = route.params.envelope;
  const verification = useMemo(() => verifyEnvelope(envelope), [verifyEnvelope, envelope]);
  const isCompact = width < 380;

  return (
    <LinearGradient colors={['#faf5ff', '#ffffff', '#eff6ff']} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container}>
        <GradientText style={[styles.title, isCompact && styles.titleCompact]}>Gate Pass Verify</GradientText>
        <Text style={styles.subtitle}>Verify organizer signature and validity window.</Text>

        <View style={styles.badges}>
          <VerifiedBadge label={verification.signatureValid ? 'Signature OK' : 'Bad Signature'} variant={verification.signatureValid ? 'success' : 'warning'} />
          <VerifiedBadge label={verification.timeWindowValid ? 'In Window' : 'Expired'} variant={verification.timeWindowValid ? 'success' : 'warning'} />
          <VerifiedBadge label="MULTI-USE" variant="success" />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Title</Text>
          <Text style={styles.value}>{envelope.payload.title}</Text>
          <Text style={styles.label}>Creator Wallet</Text>
          <Text style={styles.walletValue}>{envelope.issuerPublicKey}</Text>
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
          <Text style={styles.label}>Validity</Text>
          <Text style={styles.value}>{new Date(envelope.payload.validFrom).toLocaleString()} - {new Date(envelope.payload.validTo).toLocaleString()}</Text>
          <Text style={styles.label}>Usage Mode</Text>
          <Text style={styles.value}>Multi-use</Text>
        </View>

        {verification.reasons.length > 0 ? (
          <View style={styles.errorCard}>
            {verification.reasons.map((reason) => (
              <Text key={reason} style={styles.errorText}>• {reason}</Text>
            ))}
          </View>
        ) : null}

        <View style={styles.successBlock}>
          <Feather
            name={verification.isValid ? 'check-circle' : 'alert-triangle'}
            size={28}
            color={verification.isValid ? '#16a34a' : '#d97706'}
          />
          <Text style={styles.successText}>
            {verification.isValid ? 'Pass verified successfully.' : 'Pass verification failed.'}
          </Text>
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
  walletValue: {
    fontSize: 13,
    color: '#111827',
    fontFamily: 'monospace',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  errorCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 12,
    gap: 4,
  },
  errorText: { color: '#991b1b', fontSize: 13 },
  successBlock: {
    borderWidth: 1,
    borderColor: '#d1fae5',
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  successText: {
    color: '#166534',
    fontWeight: '700',
    fontSize: 14,
  },
});
