import React, { useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';

import { GradientButton, GradientText, ProofEnvelopeModal } from '../components';
import { useProofs } from '../hooks/use-proofs';

const nowIso = new Date().toISOString();
const defaultValidTo = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

export const TicketCreateScreen = (): React.JSX.Element => {
  const { createTicketEnvelope, encodeEnvelopeToQr, loading } = useProofs();
  const [title, setTitle] = useState('');
  const [eventName, setEventName] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [validFrom, setValidFrom] = useState(nowIso);
  const [validTo, setValidTo] = useState(defaultValidTo);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeDateField, setActiveDateField] = useState<'from' | 'to' | null>(null);
  const [datePickerMode, setDatePickerMode] = useState<'date' | 'time'>('date');
  const [recipientWallet, setRecipientWallet] = useState('');
  const [qrValue, setQrValue] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const disabled = useMemo(
    () => !title.trim() || !eventName.trim() || !validFrom.trim() || !validTo.trim(),
    [title, eventName, validFrom, validTo]
  );

  const onCreate = async (): Promise<void> => {
    const envelope = await createTicketEnvelope({
      title,
      description,
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

  const openDatePicker = (field: 'from' | 'to', mode: 'date' | 'time'): void => {
    setActiveDateField(field);
    setDatePickerMode(mode);
    setShowDatePicker(true);
  };

  const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date): void => {
    if (_event.type === 'dismissed' || !selectedDate) {
      setShowDatePicker(false);
      setActiveDateField(null);
      return;
    }

    const baseIso = activeDateField === 'from' ? validFrom : validTo;
    const base = new Date(baseIso);
    const updated = new Date(base);

    if (datePickerMode === 'date') {
      updated.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    } else {
      updated.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
    }

    const iso = updated.toISOString();
    if (activeDateField === 'from') {
      setValidFrom(iso);
    } else if (activeDateField === 'to') {
      setValidTo(iso);
    }

    setShowDatePicker(false);
    setActiveDateField(null);
  };

  const formatDate = (iso: string): string => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return iso;
    }
    return date.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  return (
    <>
      <LinearGradient colors={['#faf5ff', '#ffffff', '#eff6ff']} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.container}>
          <GradientText style={styles.title}>Redeemable Gate Pass</GradientText>
          <Text style={styles.subtitle}>Issue a ticket QR that can be redeemed on-chain.</Text>

          <Text style={styles.label}>Ticket Title *</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Ticket title" placeholderTextColor="#9ca3af" />

          <Text style={styles.label}>Event Name *</Text>
          <TextInput style={styles.input} value={eventName} onChangeText={setEventName} placeholder="Event name" placeholderTextColor="#9ca3af" />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={description}
            onChangeText={setDescription}
            placeholder="Optional description"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Venue</Text>
          <TextInput style={styles.input} value={venue} onChangeText={setVenue} placeholder="Optional venue" placeholderTextColor="#9ca3af" />

          <Text style={styles.label}>Valid From</Text>
          <View style={styles.dateRow}>
            <View style={styles.dateInput}>
              <Text style={styles.dateText}>{formatDate(validFrom)}</Text>
            </View>
            <TouchableOpacity style={styles.dateButton} onPress={() => openDatePicker('from', 'date')} activeOpacity={0.8}>
              <Text style={styles.dateButtonText}>Date</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateButton} onPress={() => openDatePicker('from', 'time')} activeOpacity={0.8}>
              <Text style={styles.dateButtonText}>Time</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Valid To</Text>
          <View style={styles.dateRow}>
            <View style={styles.dateInput}>
              <Text style={styles.dateText}>{formatDate(validTo)}</Text>
            </View>
            <TouchableOpacity style={styles.dateButton} onPress={() => openDatePicker('to', 'date')} activeOpacity={0.8}>
              <Text style={styles.dateButtonText}>Date</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateButton} onPress={() => openDatePicker('to', 'time')} activeOpacity={0.8}>
              <Text style={styles.dateButtonText}>Time</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Recipient Wallet (optional)</Text>
          <TextInput
            style={styles.input}
            value={recipientWallet}
            onChangeText={setRecipientWallet}
            autoCapitalize="none"
            placeholder="Bind ticket to wallet"
            placeholderTextColor="#9ca3af"
          />

          <GradientButton title={loading ? 'Creating...' : 'Create Ticket QR'} onPress={() => void onCreate()} disabled={disabled || loading} icon="tag" />
        </ScrollView>
      </LinearGradient>

      {showDatePicker && (
        <DateTimePicker
          value={new Date(activeDateField === 'from' ? validFrom : validTo)}
          mode={datePickerMode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
        />
      )}

      <ProofEnvelopeModal
        visible={visible}
        title="Ticket QR Ready"
        subtitle="Door verifier can scan this QR to redeem if valid."
        qrValue={qrValue}
        qrType="ticket"
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
  multilineInput: {
    minHeight: 88,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#ffffff',
  },
  dateText: {
    color: '#1f2937',
    fontSize: 14,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
  },
  dateButtonText: {
    color: '#7C3AED',
    fontWeight: '600',
    fontSize: 13,
  },
});
