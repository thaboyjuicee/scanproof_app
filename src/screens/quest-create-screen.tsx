import React, { useMemo, useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradientButton, GradientText, ProofEnvelopeModal } from '../components';
import { useProofs } from '../hooks/use-proofs';
import { useToast } from '../state/toast-state';

const nowIso = new Date().toISOString();
const defaultValidTo = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

export const QuestCreateScreen = (): React.JSX.Element => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { createQuestEnvelope, encodeEnvelopeToQr, loading } = useProofs();
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [community, setCommunity] = useState('');
  const [badgeImage, setBadgeImage] = useState('');
  const [validFrom, setValidFrom] = useState(nowIso);
  const [validTo, setValidTo] = useState(defaultValidTo);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeDateField, setActiveDateField] = useState<'from' | 'to' | null>(null);
  const [datePickerMode, setDatePickerMode] = useState<'date' | 'time'>('date');
  const [claimLimit, setClaimLimit] = useState<'once' | 'daily'>('once');
  const [qrValue, setQrValue] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const isCompact = width < 380;

  const disabled = useMemo(() => !title.trim() || !description.trim() || !validFrom.trim() || !validTo.trim(), [title, description, validFrom, validTo]);

  const onCreate = async (): Promise<void> => {
    const envelope = await createQuestEnvelope({
      title,
      description,
      location,
      community,
      badgeImage,
      validFrom,
      validTo,
      claimLimit,
    });

    if (!envelope) {
      showToast({ title: 'Error', message: 'Failed to create Quest QR.', variant: 'error' });
      return;
    }

    setQrValue(encodeEnvelopeToQr(envelope));
    setVisible(true);
  };

  const pickBadgeImage = async (): Promise<void> => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setBadgeImage(result.assets[0].uri);
      }
    } catch {
      showToast({ title: 'Error', message: 'Failed to pick badge image.', variant: 'error' });
    }
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
        <ScrollView contentContainerStyle={[styles.container, { paddingBottom: Math.max(24, insets.bottom + 16) }]}>
          <GradientText style={[styles.title, isCompact && styles.titleCompact]}>Quest Check-in</GradientText>
          <Text style={styles.subtitle}>Issue a quest QR for community check-ins.</Text>

          <Text style={styles.label}>Title *</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Quest title" placeholderTextColor="#9ca3af" />

          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the quest"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Location</Text>
          <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="Optional location" placeholderTextColor="#9ca3af" />

          <Text style={styles.label}>Community</Text>
          <TextInput style={styles.input} value={community} onChangeText={setCommunity} placeholder="Optional community" placeholderTextColor="#9ca3af" />

          <Text style={styles.label}>Badge Image (optional)</Text>
          <TouchableOpacity style={[styles.fileButton, isCompact && styles.fileButtonCompact]} onPress={() => void pickBadgeImage()} activeOpacity={0.8}>
            {badgeImage ? (
              <Image source={{ uri: badgeImage }} style={styles.badgePreview} />
            ) : (
              <View style={styles.badgePlaceholder}>
                <Text style={styles.badgePlaceholderText}>Select from gallery</Text>
              </View>
            )}
            <View style={styles.fileButtonTextWrap}>
              <Text style={styles.fileButtonTitle}>{badgeImage ? 'Badge image selected' : 'Choose badge image'}</Text>
              <Text style={styles.fileButtonHint}>{badgeImage ? 'Tap to change' : 'PNG or JPG recommended'}</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.label}>Valid From</Text>
          <View style={[styles.dateRow, isCompact && styles.dateRowCompact]}>
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
          <View style={[styles.dateRow, isCompact && styles.dateRowCompact]}>
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

          <Text style={styles.label}>Claim Limit</Text>
          <View style={[styles.row, isCompact && styles.rowCompact]}>
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
        title="Quest QR Ready"
        subtitle="Share this QR with attendees to claim the quest."
        qrValue={qrValue}
        qrType="quest"
        onClose={() => setVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flexGrow: 1, padding: 20, gap: 10, width: '100%', maxWidth: 760, alignSelf: 'center' },
  title: { fontSize: 28, fontWeight: '700' },
  titleCompact: { fontSize: 24 },
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
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#ffffff',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateRowCompact: {
    flexWrap: 'wrap',
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
  dateText: {
    color: '#1f2937',
    fontSize: 14,
  },
  multilineInput: {
    minHeight: 88,
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#ffffff',
  },
  fileButtonCompact: {
    alignItems: 'flex-start',
  },
  badgePreview: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  badgePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  badgePlaceholderText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#7C3AED',
    textAlign: 'center',
  },
  fileButtonTextWrap: {
    flex: 1,
    gap: 2,
  },
  fileButtonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  fileButtonHint: {
    fontSize: 12,
    color: '#6b7280',
  },
  row: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  rowCompact: { flexWrap: 'wrap' },
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
