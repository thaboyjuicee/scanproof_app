import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { QRModal } from '../components/qr-modal';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'ProofDetails'>;

export const ProofDetailsScreen = ({ route }: Props): React.JSX.Element => {
  const { proof } = route.params;
  const [qrModalVisible, setQrModalVisible] = useState(false);

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{proof.title}</Text>
        <Text style={styles.label}>Description</Text>
        <Text>{proof.description}</Text>

        <Text style={styles.label}>Owner Wallet</Text>
        <Text selectable>{proof.ownerWallet}</Text>

        <Text style={styles.label}>Timestamp</Text>
        <Text>{proof.timestampIso}</Text>

        <Text style={styles.label}>Hash</Text>
        <Text selectable>{proof.hash}</Text>

        <Text style={styles.label}>IPFS CID</Text>
        <Text selectable>{proof.ipfsCid ?? 'Not uploaded'}</Text>

        <Text style={styles.label}>Signature</Text>
        <Text selectable>{proof.signature ?? 'Not available'}</Text>

        <TouchableOpacity
          style={styles.qrButton}
          onPress={() => setQrModalVisible(true)}
        >
          <Text style={styles.qrButtonText}>📸 Show QR Code</Text>
        </TouchableOpacity>
      </ScrollView>

      <QRModal
        visible={qrModalVisible}
        proof={proof}
        onClose={() => setQrModalVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  label: {
    marginTop: 6,
    fontWeight: '600',
  },
  qrButton: {
    marginTop: 20,
    backgroundColor: '#5865f2',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
