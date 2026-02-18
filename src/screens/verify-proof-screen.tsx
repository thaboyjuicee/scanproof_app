import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput } from 'react-native';

import { useProofs } from '../hooks/use-proofs';

export const VerifyProofScreen = (): React.JSX.Element => {
  const { proofs, verifyProof } = useProofs();
  const [proofId, setProofId] = useState('');

  const result = useMemo(() => {
    const match = proofs.find((proof) => proof.id === proofId.trim());
    if (!match) {
      return null;
    }

    return verifyProof(match);
  }, [proofId, proofs, verifyProof]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Verify Proof</Text>
      <TextInput
        placeholder="Enter Proof ID"
        value={proofId}
        onChangeText={setProofId}
        style={styles.input}
      />

      {result ? (
        <>
          <Text style={styles.value}>Valid: {String(result.isValid)}</Text>
          <Text style={styles.value}>Integrity: {String(result.integrityValid)}</Text>
          <Text style={styles.value}>Owner: {String(result.ownerValid)}</Text>
          <Text style={styles.value}>Signature: {String(result.signatureValid)}</Text>
          <Text style={styles.label}>Reasons</Text>
          {result.reasons.length === 0 ? <Text style={styles.value}>None</Text> : result.reasons.map((reason) => <Text key={reason} style={styles.value}>- {reason}</Text>)}
        </>
      ) : (
        <Text style={styles.value}>Enter an existing proof ID from Proof List.</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  label: {
    marginTop: 4,
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    padding: 10,
  },
});
