import React, { useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

import { GradientButton, GradientText, VerifiedBadge } from '../components';
import { useProofs } from '../hooks/use-proofs';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'QuestClaimVerify'>;

export const QuestClaimVerifyScreen = ({ route }: Props): React.JSX.Element => {
  const { verifyEnvelope, claimQuest, loading } = useProofs();
  const envelope = route.params.envelope;
  const verification = useMemo(() => verifyEnvelope(envelope), [verifyEnvelope, envelope]);

  const onClaim = async (): Promise<void> => {
    try {
      const claim = await claimQuest(envelope);
      Alert.alert('Claimed', `Quest saved to Proofbook.\nClaim ID: ${claim.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Claim failed.';
      Alert.alert('Claim Blocked', message);
    }
  };

  return (
    <LinearGradient colors={['#faf5ff', '#ffffff', '#eff6ff']} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container}>
        <GradientText style={styles.title}>Quest Check-in</GradientText>
        <Text style={styles.subtitle}>Verify organizer signature and claim this quest.</Text>

        <View style={styles.badges}>
          <VerifiedBadge label={verification.signatureValid ? 'Signature OK' : 'Bad Signature'} variant={verification.signatureValid ? 'success' : 'warning'} />
          <VerifiedBadge label={verification.timeWindowValid ? 'In Window' : 'Out of Window'} variant={verification.timeWindowValid ? 'success' : 'warning'} />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Quest</Text>
          <Text style={styles.value}>{envelope.payload.title}</Text>
          {envelope.payload.label ? (
            <>
              <Text style={styles.label}>Community / Location</Text>
              <Text style={styles.value}>{envelope.payload.label}</Text>
            </>
          ) : null}
          <Text style={styles.label}>Claim Limit</Text>
          <Text style={styles.value}>{envelope.payload.claimLimit === 'daily' ? 'Daily' : 'Once per wallet'}</Text>
          <Text style={styles.label}>Validity</Text>
          <Text style={styles.value}>{new Date(envelope.payload.validFrom).toLocaleString()} - {new Date(envelope.payload.validTo).toLocaleString()}</Text>
        </View>

        {verification.reasons.length > 0 ? (
          <View style={styles.errorCard}>
            {verification.reasons.map((reason) => (
              <Text key={reason} style={styles.errorText}>• {reason}</Text>
            ))}
          </View>
        ) : null}

        <GradientButton
          title={loading ? 'Claiming...' : 'Claim Quest'}
          onPress={() => void onClaim()}
          disabled={loading || !verification.isValid}
          icon="check-circle"
        />
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
  value: { fontSize: 14, color: '#1f2937', marginBottom: 2 },
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
