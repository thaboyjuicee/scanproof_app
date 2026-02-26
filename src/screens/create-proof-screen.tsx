import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Proof, ProofType } from '../models/proof';
import { useProofs } from '../hooks/use-proofs';
import { CardContainer, GradientButton, GradientText, ProofEnvelopeModal } from '../components';

const PROOF_TYPES: ProofType[] = ['text', 'photo', 'document'];

export const CreateProofScreen = (): React.JSX.Element => {
  const { createProof, issueNotarizeEnvelope, encodeEnvelopeToQr, loading, error, clearError } = useProofs();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [urlLink, setUrlLink] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [proofType, setProofType] = useState<ProofType>('text');
  const [uploadToIpfs, setUploadToIpfs] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrValue, setQrValue] = useState<string | null>(null);

  const pickFile = async (): Promise<void> => {
    try {
      if (proofType === 'document') {
        const result = await DocumentPicker.getDocumentAsync({
          type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
          copyToCacheDirectory: true,
          multiple: false,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          setFileName(asset.name || asset.uri.split('/').pop() || 'document');
          setFileUri(asset.uri);
        }
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        const name = uri.split('/').pop() || 'file';
        setFileName(name);
        setFileUri(uri);
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
      const nextProof = await createProof(title, description, proofType, uploadToIpfs, fileUri || undefined);
      if (!nextProof) {
        Alert.alert('Error', 'Failed to create notarization proof.');
        return;
      }

      const envelope = await issueNotarizeEnvelope(nextProof);
      if (!envelope) {
        Alert.alert('Error', 'Proof saved but QR envelope could not be issued.');
        return;
      }

      setQrValue(encodeEnvelopeToQr(envelope));
      setQrModalVisible(true);

      setTitle('');
      setDescription('');
      setUrlLink('');
      setFileName(null);
      setFileUri(null);
      setProofType('text');
    } catch (err) {
      Alert.alert('Error', 'Failed to create proof');
    }
  };

  return (
    <>
      <LinearGradient colors={['#faf5ff', '#ffffff', '#eff6ff']} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <GradientText style={styles.title}>Notarize File</GradientText>
            <Text style={styles.subtitle}>Create a notarization credential with verifiable QR envelope</Text>
          </View>

          <CardContainer>
            <View style={styles.formSection}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                placeholder="Enter proof title"
                placeholderTextColor="#9ca3af"
                value={title}
                onChangeText={setTitle}
                style={styles.input}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                placeholder="Add description (optional)"
                placeholderTextColor="#9ca3af"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
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
                    <Feather 
                      name={type === 'text' ? 'file-text' : type === 'photo' ? 'camera' : 'file'} 
                      size={20} 
                      color={proofType === type ? '#9333ea' : '#6b7280'} 
                    />
                    <Text style={[styles.typeButtonText, proofType === type && styles.typeButtonTextActive]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {(proofType === 'photo' || proofType === 'document') && (
              <View style={styles.formSection}>
                <Text style={styles.label}>Attachment</Text>
                <TouchableOpacity style={styles.fileButton} onPress={pickFile}>
                  <Feather name={fileName ? 'check-circle' : 'upload-cloud'} size={32} color="#9333ea" />
                  <Text style={styles.fileButtonText}>
                    {fileName || 'Tap to upload file'}
                  </Text>
                  {fileName && (
                    <Text style={styles.fileButtonHint}>Tap to change</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.switchSection}>
              <View>
                <Text style={styles.label}>Upload to IPFS</Text>
                <Text style={styles.switchHint}>Store file on decentralized storage</Text>
              </View>
              <Switch 
                value={uploadToIpfs} 
                onValueChange={setUploadToIpfs}
                trackColor={{ false: '#d1d5db', true: '#c4b5fd' }}
                thumbColor={uploadToIpfs ? '#9333ea' : '#f3f4f6'}
              />
            </View>
          </CardContainer>

          {error ? (
            <CardContainer>
              <View style={styles.errorContainer}>
                <Feather name="alert-circle" size={20} color="#dc2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            </CardContainer>
          ) : null}

          <GradientButton
            title={loading ? 'Creating Notarization...' : 'Create Notarize QR'}
            onPress={() => void onCreate()}
            disabled={loading || !title.trim()}
            icon={loading ? undefined : 'plus-circle'}
          />
        </ScrollView>
      </LinearGradient>

      <ProofEnvelopeModal
        visible={qrModalVisible}
        title="Notarize QR Ready"
        subtitle="Scan to verify file certificate envelope."
        qrValue={qrValue}
        qrType="notarize"
        onClose={() => setQrModalVisible(false)}
      />
    </>
  );
};


const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 20,
    gap: 20,
  },
  header: {
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  formSection: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#ffffff',
    color: '#1f2937',
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  typeButtonActive: {
    borderColor: '#9333ea',
    backgroundColor: '#faf5ff',
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  typeButtonTextActive: {
    color: '#9333ea',
  },
  fileButton: {
    borderWidth: 2,
    borderColor: '#9333ea',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#faf5ff',
  },
  fileButtonText: {
    color: '#7c3aed',
    fontSize: 14,
    fontWeight: '600',
  },
  fileButtonHint: {
    color: '#9ca3af',
    fontSize: 12,
  },
  switchSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  switchHint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    flex: 1,
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '500',
  },
});
