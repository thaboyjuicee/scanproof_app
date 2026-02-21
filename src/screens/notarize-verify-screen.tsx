import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

import { GradientText, VerifiedBadge } from '../components';
import { useProofs } from '../hooks/use-proofs';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'NotarizeVerify'>;

export const NotarizeVerifyScreen = ({ route }: Props): React.JSX.Element => {
  const { verifyEnvelope } = useProofs();
  const envelope = route.params.envelope;
  const verification = useMemo(() => verifyEnvelope(envelope), [verifyEnvelope, envelope]);

  return (
    <LinearGradient colors={['#faf5ff', '#ffffff', '#eff6ff']} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container}>
        <GradientText style={styles.title}>Notarize Verify</GradientText>
        <Text style={styles.subtitle}>Validate notarized file envelope signature.</Text>

        <View style={styles.badges}>
          <VerifiedBadge label={verification.signatureValid ? 'Signature OK' : 'Bad Signature'} variant={verification.signatureValid ? 'success' : 'warning'} />
          <VerifiedBadge label={verification.timeWindowValid ? 'Valid' : 'Expired'} variant={verification.timeWindowValid ? 'success' : 'warning'} />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Title</Text>
          <Text style={styles.value}>{envelope.payload.title}</Text>
          <Text style={styles.label}>Owner Wallet</Text>
          <Text style={styles.value}>{envelope.payload.ownerWallet}</Text>
          <Text style={styles.label}>Hash</Text>
          <Text style={styles.valueMono}>{envelope.payload.hash}</Text>
          <Text style={styles.label}>Created</Text>
          <Text style={styles.value}>{new Date(envelope.payload.timestampIso).toLocaleString()}</Text>
        </View>

        {verification.reasons.length > 0 ? (
          <View style={styles.errorCard}>
            {verification.reasons.map((reason) => (
              <Text key={reason} style={styles.errorText}>• {reason}</Text>
            ))}
          </View>
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
  valueMono: { fontSize: 13, color: '#7c3aed', fontFamily: 'monospace' },
  errorCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 12,
    gap: 4,
  },
  errorText: { color: '#991b1b', fontSize: 13 },
});
