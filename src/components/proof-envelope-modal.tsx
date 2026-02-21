import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

interface ProofEnvelopeModalProps {
  visible: boolean;
  title: string;
  qrValue: string | null;
  subtitle?: string;
  onClose: () => void;
}

export const ProofEnvelopeModal = ({ visible, title, qrValue, subtitle, onClose }: ProofEnvelopeModalProps): React.JSX.Element => {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

          {qrValue ? (
            <View style={styles.qrWrap}>
              <QRCode value={qrValue} size={260} color="#111827" backgroundColor="#ffffff" />
            </View>
          ) : (
            <Text style={styles.errorText}>Unable to generate QR value.</Text>
          )}

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
