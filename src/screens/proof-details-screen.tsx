import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'ProofDetails'>;

export const ProofDetailsScreen = ({ route }: Props): React.JSX.Element => {
  const { proof } = route.params;

  return (
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
    </ScrollView>
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
});
