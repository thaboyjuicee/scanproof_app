import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { GradientButton, GradientText, ProofEnvelopeModal } from '../components';
import { useProofs } from '../hooks/use-proofs';

const nowIso = new Date().toISOString();
const defaultValidTo = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

export const QuestCreateScreen = (): React.JSX.Element => {
  const { createQuestEnvelope, encodeEnvelopeToQr, loading } = useProofs();
  const [title, setTitle] = useState('');
  const [label, setLabel] = useState('');
  const [validFrom, setValidFrom] = useState(nowIso);
  const [validTo, setValidTo] = useState(defaultValidTo);
  const [claimLimit, setClaimLimit] = useState<'once' | 'daily'>('once');
  const [qrValue, setQrValue] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const disabled = useMemo(() => !title.trim() || !validFrom.trim() || !validTo.trim(), [title, validFrom, validTo]);

  const onCreate = async (): Promise<void> => {
    const envelope = await createQuestEnvelope({
      title,
      label,
      validFrom,
      validTo,
      claimLimit,
    });

    if (!envelope) {
      Alert.alert('Error', 'Failed to create Quest QR.');
      return;
    }

    setQrValue(encodeEnvelopeToQr(envelope));
    setVisible(true);
  };

  return (
    <>
      <LinearGradient colors={['#faf5ff', '#ffffff', '#eff6ff']} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.container}>
          <GradientText style={styles.title}>Quest Check-in</GradientText>
          <Text style={styles.subtitle}>Issue a quest QR for community check-ins.</Text>

          <Text style={styles.label}>Title *</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Quest title" placeholderTextColor="#9ca3af" />

          <Text style={styles.label}>Community / Location</Text>
          <TextInput style={styles.input} value={label} onChangeText={setLabel} placeholder="Optional label" placeholderTextColor="#9ca3af" />

          <Text style={styles.label}>Valid From (ISO)</Text>
          <TextInput style={styles.input} value={validFrom} onChangeText={setValidFrom} autoCapitalize="none" placeholderTextColor="#9ca3af" />

          <Text style={styles.label}>Valid To (ISO)</Text>
          <TextInput style={styles.input} value={validTo} onChangeText={setValidTo} autoCapitalize="none" placeholderTextColor="#9ca3af" />

          <Text style={styles.label}>Claim Limit</Text>
          <View style={styles.row}>
            <TouchableOpacity style={[styles.limitButton, claimLimit === 'once' && styles.limitButtonActive]} onPress={() => setClaimLimit('once')}>
              <Text style={[styles.limitText, claimLimit === 'once' && styles.limitTextActive]}>Once per wallet</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.limitButton, claimLimit === 'daily' && styles.limitButtonActive]} onPress={() => setClaimLimit('daily')}>
              <Text style={[styles.limitText, claimLimit === 'daily' && styles.limitTextActive]}>Daily</Text>
            </TouchableOpacity>
          </View>

          <GradientButton title={loading ? 'Creating...' : 'Create Quest QR'} onPress={() => void onCreate()} disabled={disabled || loading} icon="check-circle" />
        </ScrollView>
      </LinearGradient>

      <ProofEnvelopeModal
        visible={visible}
        title="Quest QR Ready"
        subtitle="Share this QR with attendees to claim the quest."
        qrValue={qrValue}
        onClose={() => setVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flexGrow: 1, padding: 20, gap: 10 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { color: '#6b7280', marginBottom: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151' },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  row: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  limitButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  limitButtonActive: {
    borderColor: '#9333ea',
    backgroundColor: '#faf5ff',
  },
  limitText: { color: '#6b7280', fontWeight: '600' },
  limitTextActive: { color: '#9333ea' },
});
