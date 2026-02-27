import React from 'react';
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { BrandedQrCard } from './BrandedQrCard';

type EnvelopeQrType = 'quest' | 'ticket' | 'notarize' | 'default';

interface ProofEnvelopeModalProps {
  visible: boolean;
  title: string;
  qrValue: string | null;
  subtitle?: string;
  qrType?: EnvelopeQrType;
  onClose: () => void;
}

export const ProofEnvelopeModal = ({ visible, title, qrValue, subtitle, qrType = 'default', onClose }: ProofEnvelopeModalProps): React.JSX.Element => {
  const handleCopy = async (): Promise<void> => {
    if (!qrValue) {
      return;
    }

    await Clipboard.setStringAsync(qrValue);
    Alert.alert('Copied', 'QR payload copied to clipboard.');
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

          {qrValue ? (
            <View style={styles.qrWrap}>
              <BrandedQrCard value={qrValue} size={240} type={qrType} title={title} subtitle={subtitle} />
            </View>
          ) : (
            <Text style={styles.errorText}>Unable to generate QR value.</Text>
          )}

          {qrValue ? (
            <View style={styles.actionsRow}>
              <TouchableOpacity style={[styles.actionButton, styles.copyButton]} onPress={() => void handleCopy()}>
                <Text style={styles.copyButtonText}>Copy</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#ffffff',
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
  },
  qrWrap: {
    borderRadius: 12,
    backgroundColor: '#ffffff',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
  actionsRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  copyButton: {
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  copyButtonText: {
    color: '#6d28d9',
    fontWeight: '700',
  },
  button: {
    marginTop: 4,
    backgroundColor: '#9333ea',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
