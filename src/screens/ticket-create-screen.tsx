import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { GradientButton, GradientText, ProofEnvelopeModal } from '../components';
import { useProofs } from '../hooks/use-proofs';

const nowIso = new Date().toISOString();
const defaultValidTo = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

export const TicketCreateScreen = (): React.JSX.Element => {
  const { createTicketEnvelope, encodeEnvelopeToQr, loading } = useProofs();
  const [eventName, setEventName] = useState('');
  const [venue, setVenue] = useState('');
  const [validFrom, setValidFrom] = useState(nowIso);
  const [validTo, setValidTo] = useState(defaultValidTo);
  const [recipientWallet, setRecipientWallet] = useState('');
  const [qrValue, setQrValue] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const disabled = useMemo(() => !eventName.trim() || !validFrom.trim() || !validTo.trim(), [eventName, validFrom, validTo]);

  const onCreate = async (): Promise<void> => {
    const envelope = await createTicketEnvelope({
      eventName,
      venue,
      validFrom,
      validTo,
      recipientWallet,
    });

    if (!envelope) {
      Alert.alert('Error', 'Failed to create Ticket QR.');
      return;
    }

    setQrValue(encodeEnvelopeToQr(envelope));
    setVisible(true);
  };

  return (
    <>
      <LinearGradient colors={['#faf5ff', '#ffffff', '#eff6ff']} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.container}>
          <GradientText style={styles.title}>Redeemable Gate Pass</GradientText>
          <Text style={styles.subtitle}>Issue a ticket QR that can be redeemed on-chain.</Text>

          <Text style={styles.label}>Event Name *</Text>
          <TextInput style={styles.input} value={eventName} onChangeText={setEventName} placeholder="Event name" placeholderTextColor="#9ca3af" />

          <Text style={styles.label}>Venue</Text>
          <TextInput style={styles.input} value={venue} onChangeText={setVenue} placeholder="Optional venue" placeholderTextColor="#9ca3af" />

          <Text style={styles.label}>Valid From (ISO)</Text>
          <TextInput style={styles.input} value={validFrom} onChangeText={setValidFrom} autoCapitalize="none" placeholderTextColor="#9ca3af" />

          <Text style={styles.label}>Valid To (ISO)</Text>
          <TextInput style={styles.input} value={validTo} onChangeText={setValidTo} autoCapitalize="none" placeholderTextColor="#9ca3af" />

          <Text style={styles.label}>Recipient Wallet (optional)</Text>
          <TextInput
            style={styles.input}
            value={recipientWallet}
            onChangeText={setRecipientWallet}
            autoCapitalize="none"
            placeholder="Bind ticket to wallet"
            placeholderTextColor="#9ca3af"
          />

          <GradientButton title={loading ? 'Creating...' : 'Create Ticket QR'} onPress={() => void onCreate()} disabled={disabled || loading} icon="ticket" />
        </ScrollView>
      </LinearGradient>

      <ProofEnvelopeModal
        visible={visible}
        title="Ticket QR Ready"
        subtitle="Door verifier can scan this QR to redeem if valid."
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
});
