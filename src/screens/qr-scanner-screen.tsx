import React, { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../types/navigation';
import { useProofs } from '../hooks/use-proofs';

type Props = NativeStackScreenProps<RootStackParamList, 'QRScanner'>;

export const QRScannerScreen = ({ navigation }: Props): React.JSX.Element => {
  const [inputData, setInputData] = useState('');
  const { proofs, verifyProof } = useProofs();

  const handleVerify = (): void => {
    if (!inputData.trim()) {
      Alert.alert('Error', 'Please enter proof data');
      return;
    }

    try {
      const parsed = JSON.parse(inputData);
      const proofId = parsed.proofId;

      if (!proofId) {
        Alert.alert('Error', 'Invalid proof data');
        return;
      }

      const proof = proofs.find((p) => p.id === proofId);
      if (!proof) {
        Alert.alert('Not Found', 'Proof not found in your wallet');
        return;
      }

      const result = verifyProof(proof);
      Alert.alert(
        result.isValid ? 'Verified ✅' : 'Invalid ❌',
        `Proof "${proof.title}" is ${result.isValid ? 'valid' : 'invalid'}.`
      );

      setInputData('');
    } catch (err) {
      Alert.alert('Error', 'Failed to parse proof data');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manual Proof Verification</Text>
      <Text style={styles.subtitle}>
        Paste the proof data from a QR code to verify
      </Text>

      <TextInput
        style={styles.input}
        value={inputData}
        onChangeText={setInputData}
        placeholder='Paste proof JSON data here...'
        multiline
        numberOfLines={6}
      />

      <View style={styles.buttonRow}>
        <Button title="Verify" onPress={handleVerify} />
        <Button title="Cancel" onPress={() => navigation.goBack()} color="#666" />
      </View>

      <Text style={styles.note}>
        Note: Camera-based QR scanning requires additional native modules.
        Use this screen to manually paste QR code data for verification.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  note: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
