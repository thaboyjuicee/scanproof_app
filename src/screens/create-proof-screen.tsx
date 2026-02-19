import React, { useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { QRModal } from '../components/qr-modal';
import { Proof, ProofType } from '../models/proof';
import { useProofs } from '../hooks/use-proofs';

const PROOF_TYPES: ProofType[] = ['text', 'photo', 'document'];

export const CreateProofScreen = (): React.JSX.Element => {
  const { createProof, loading, error, clearError } = useProofs();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [urlLink, setUrlLink] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [proofType, setProofType] = useState<ProofType>('text');
  const [uploadToIpfs, setUploadToIpfs] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [generatedProof, setGeneratedProof] = useState<Proof | null>(null);

  const pickFile = async (): Promise<void> => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        const name = uri.split('/').pop() || 'file';
        setFileName(name);
        setFileUri(uri);
        setProofType(uri.includes('pdf') ? 'document' : 'photo');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const onCreate = async (): Promise<void> => {
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }

    try {
      // Create the proof through the hook
      await createProof(title, description, proofType, uploadToIpfs, fileUri || undefined);
      
      // Reset form
      setTitle('');
      setDescription('');
      setUrlLink('');
      setFileName(null);
      setFileUri(null);
      setProofType('text');
      
      Alert.alert('Success', 'Proof created successfully! 🎉');
    } catch (err) {
      Alert.alert('Error', 'Failed to create proof');
    }
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Create Proof</Text>
        <Text style={styles.subtitle}>Add metadata to create a blockchain-anchored proof</Text>

        <View style={styles.formSection}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            placeholder="Proof title"
            placeholderTextColor="#aaa"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            placeholder="Optional description"
            placeholderTextColor="#aaa"
            value={description}
            onChangeText={setDescription}
            multiline
            style={[styles.input, styles.textArea]}
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Proof Type *</Text>
          <View style={styles.typeSelector}>
            {PROOF_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.typeButton, proofType === type && styles.typeButtonActive]}
                onPress={() => setProofType(type)}
              >
                <Text style={[styles.typeButtonText, proofType === type && styles.typeButtonTextActive]}>
                  {type === 'text' ? '📝' : type === 'photo' ? '📷' : '📄'} {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>URL Link</Text>
          <TextInput
            placeholder="https://example.com (optional)"
            placeholderTextColor="#aaa"
            value={urlLink}
            onChangeText={setUrlLink}
            style={styles.input}
          />
        </View>

        {(proofType === 'photo' || proofType === 'document') && (
          <View style={styles.formSection}>
            <Text style={styles.label}>Attachment</Text>
            <TouchableOpacity style={styles.fileButton} onPress={pickFile}>
              <Text style={styles.fileButtonText}>
                {fileName ? `📎 ${fileName}` : '+ Pick File'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.switchSection}>
          <Text style={styles.label}>Upload to IPFS</Text>
          <Switch value={uploadToIpfs} onValueChange={setUploadToIpfs} />
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
            <Button title="Dismiss" onPress={clearError} />
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.createButton, !title.trim() && styles.createButtonDisabled]}
          onPress={() => void onCreate()}
          disabled={loading || !title.trim()}
        >
          <Text style={styles.createButtonText}>{loading ? 'Creating...' : '✨ Create Proof'}</Text>
        </TouchableOpacity>
      </ScrollView>

      <QRModal
        visible={qrModalVisible}
        proof={generatedProof}
        onClose={() => setQrModalVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    gap: 16,
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#222',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  formSection: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  typeButtonActive: {
    borderColor: '#5865f2',
    backgroundColor: '#f0f3ff',
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#5865f2',
  },
  fileButton: {
    borderWidth: 2,
    borderColor: '#5865f2',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f3ff',
  },
  fileButtonText: {
    color: '#5865f2',
    fontSize: 14,
    fontWeight: '600',
  },
  switchSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  errorContainer: {
    padding: 12,
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
    gap: 8,
  },
  errorText: {
    color: '#991b1b',
    fontSize: 13,
    fontWeight: '500',
  },
  createButton: {
    backgroundColor: '#5865f2',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#5865f2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#aaa',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
