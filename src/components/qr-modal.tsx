import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Proof } from '../models/proof';

interface QRModalProps {
  visible: boolean;
  proof: Proof | null;
  onClose: () => void;
}

export const QRModal = ({ visible, proof, onClose }: QRModalProps): React.JSX.Element => {
  if (!proof) {
    return <></>;
  }

  const qrData = JSON.stringify({
    proofId: proof.id,
    title: proof.title,
    ownerWallet: proof.ownerWallet,
    hash: proof.hash,
  });

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Proof QR Code</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.qrContainer}>
              <QRCode
                value={qrData}
                size={280}
                color="#222"
                backgroundColor="#fff"
              />
            </View>

            <View style={styles.proofInfo}>
              <Text style={styles.infoTitle}>Proof Details</Text>
              
              <View style={styles.infoRow}>
                <Text style={styles.label}>Title</Text>
                <Text style={styles.value}>{proof.title}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Proof ID</Text>
                <Text style={[styles.value, styles.monospace]}>{proof.id}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Type</Text>
                <Text style={styles.value}>{proof.proofType}</Text>
              </View>

              {proof.fileUrl && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>File</Text>
                  <Text style={styles.value}>{proof.fileName || 'Attached'}</Text>
                </View>
              )}

              <View style={styles.infoRow}>
                <Text style={styles.label}>Created</Text>
                <Text style={styles.value}>{new Date(proof.timestampIso).toLocaleString()}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeButtonLarge} onPress={onClose}>
              <Text style={styles.closeButtonLargeText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },
  content: {
    padding: 20,
    gap: 20,
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  proofInfo: {
    gap: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  infoRow: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0f3ff',
    borderRadius: 8,
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 14,
    color: '#222',
  },
  monospace: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  closeButtonLarge: {
    backgroundColor: '#5865f2',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  closeButtonLargeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
