import React, { useState } from 'react';
import { Button, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { useProofs } from '../hooks/use-proofs';

export const CreateProofScreen = (): React.JSX.Element => {
  const { createProof, loading, error, clearError } = useProofs();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploadToIpfs, setUploadToIpfs] = useState(false);

  const onCreate = async (): Promise<void> => {
    await createProof(title, description, uploadToIpfs);
    setTitle('');
    setDescription('');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Proof</Text>

      <TextInput
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />
      <TextInput
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        multiline
        style={[styles.input, styles.textArea]}
      />

      <View style={styles.switchRow}>
        <Text>Upload to IPFS</Text>
        <Switch value={uploadToIpfs} onValueChange={setUploadToIpfs} />
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Dismiss Error" onPress={clearError} />
        </View>
      ) : null}

      <Button title={loading ? 'Creating...' : 'Create Proof'} disabled={loading || !title.trim()} onPress={() => void onCreate()} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    padding: 10,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorContainer: {
    padding: 12,
    backgroundColor: '#fee',
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    color: '#900',
  },
});
