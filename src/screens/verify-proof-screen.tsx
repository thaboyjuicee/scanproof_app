import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { VerificationResult } from '../models/verification-result';
import { RootStackParamList } from '../types/navigation';
import { useProofs } from '../hooks/use-proofs';
import { CardContainer, GradientButton, GradientText, VerifiedBadge } from '../components';

type Props = NativeStackScreenProps<RootStackParamList, 'VerifyProof'>;

export const VerifyProofScreen = ({ navigation }: Props): React.JSX.Element => {
  const { width } = useWindowDimensions();
  const { proofs, verifyProof, verifyMultipleProofs } = useProofs();
  const [proofId, setProofId] = useState('');
  const [batchMode, setBatchMode] = useState(false);
  const [selectedProofs, setSelectedProofs] = useState<Set<string>>(new Set());
  const isCompact = width < 380;

  const result = useMemo(() => {
    const match = proofs.find((proof) => proof.id === proofId.trim());
    if (!match) {
      return null;
    }

    return verifyProof(match);
  }, [proofId, proofs, verifyProof]);

  const batchResults = useMemo(() => {
    if (!batchMode || selectedProofs.size === 0) {
      return [];
    }
    const batchProofs = proofs.filter((p) => selectedProofs.has(p.id));
    return verifyMultipleProofs(batchProofs);
  }, [batchMode, selectedProofs, proofs, verifyMultipleProofs]);

  const toggleProofSelection = (id: string) => {
    const newSelected = new Set(selectedProofs);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedProofs(newSelected);
  };

  const renderStatusIcon = (valid: boolean): React.JSX.Element => (
    <Feather name={valid ? 'check-circle' : 'x-circle'} size={20} color={valid ? '#22c55e' : '#ef4444'} />
  );

  return (
    <LinearGradient colors={['#faf5ff', '#ffffff', '#eff6ff']} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <GradientText style={[styles.title, isCompact && styles.titleCompact]}>Verify Proof</GradientText>
          <Text style={styles.subtitle}>Validate proof authenticity on the blockchain</Text>
        </View>

        <View style={[styles.modeSelector, isCompact && styles.modeSelectorCompact]}>
          <TouchableOpacity
            style={[styles.modeButton, !batchMode && styles.modeButtonActive]}
            onPress={() => {
              setBatchMode(false);
              setSelectedProofs(new Set());
            }}
          >
            <Feather name="search" size={20} color={!batchMode ? '#9333ea' : '#6b7280'} />
            <Text style={[styles.modeButtonText, !batchMode && styles.modeButtonTextActive]}>
              Single
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, batchMode && styles.modeButtonActive]}
            onPress={() => {
              setBatchMode(true);
              setProofId('');
            }}
          >
            <Feather name="layers" size={20} color={batchMode ? '#9333ea' : '#6b7280'} />
            <Text style={[styles.modeButtonText, batchMode && styles.modeButtonTextActive]}>
              Batch ({selectedProofs.size})
            </Text>
          </TouchableOpacity>
        </View>

        {!batchMode && (
          <CardContainer>
            <View style={styles.searchSection}>
              <Text style={styles.label}>Proof ID</Text>
              <TextInput
                placeholder="Enter proof ID to verify"
                placeholderTextColor="#9ca3af"
                value={proofId}
                onChangeText={setProofId}
                style={styles.input}
              />
              <GradientButton
                title="Scan QR Code"
                onPress={() => navigation.navigate('QRScanner')}
                icon="camera"
                variant="secondary"
              />
            </View>
          </CardContainer>
        )}

        {!batchMode && result ? (
          <CardContainer>
            <View style={[styles.resultHeader, result.isValid ? styles.validHeader : styles.invalidHeader]}>
              <Feather 
                name={result.isValid ? 'check-circle' : 'x-circle'} 
                size={48} 
                color={result.isValid ? '#22c55e' : '#ef4444'} 
              />
              <View style={styles.resultHeaderText}>
                <Text style={[styles.resultTitle, result.isValid ? styles.validText : styles.invalidText]}>
                  {result.isValid ? 'Verified' : 'Invalid'}
                </Text>
                <Text style={styles.resultSubtitle}>
                  {result.isValid ? 'All checks passed' : 'Verification failed'}
                </Text>
              </View>
            </View>

            <View style={styles.checksList}>
              <View style={styles.checkItem}>
                {renderStatusIcon(result.integrityValid)}
                <Text style={styles.checkLabel}>Data Integrity</Text>
              </View>
              <View style={styles.checkItem}>
                {renderStatusIcon(result.ownerValid)}
                <Text style={styles.checkLabel}>Owner Verification</Text>
              </View>
              <View style={styles.checkItem}>
                {renderStatusIcon(result.signatureValid)}
                <Text style={styles.checkLabel}>Digital Signature</Text>
              </View>
            </View>

            {result.reasons.length > 0 && (
              <View style={styles.reasonsSection}>
                <Text style={styles.reasonsLabel}>Issues Found:</Text>
                {result.reasons.map((reason, idx) => (
                  <View key={idx} style={styles.reasonItem}>
                    <Feather name="alert-triangle" size={16} color="#f59e0b" />
                    <Text style={styles.reasonText}>{reason}</Text>
                  </View>
                ))}
              </View>
            )}
          </CardContainer>
        ) : !batchMode ? (
          <CardContainer>
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Feather name="search" size={40} color="#9333ea" />
              </View>
              <Text style={styles.emptyText}>Enter a Proof ID</Text>
              <Text style={styles.emptyHint}>Scan a QR code or select from {proofs.length} available proofs</Text>
            </View>
          </CardContainer>
        ) : null}

        {batchMode && batchResults.length > 0 && (
          <CardContainer>
            <Text style={styles.sectionTitle}>Batch Results</Text>
            <View style={styles.batchSummary}>
              <VerifiedBadge 
                label={`${batchResults.filter((r: VerificationResult) => r.isValid).length} Valid`}
                variant="success"
              />
              <VerifiedBadge 
                label={`${batchResults.filter((r: VerificationResult) => !r.isValid).length} Invalid`}
                variant="warning"
              />
            </View>
          </CardContainer>
        )}

        {proofs.length > 0 && (
          <View style={styles.proofsSection}>
            <Text style={styles.sectionTitle}>
              {batchMode ? `Select Proofs (${selectedProofs.size} selected)` : 'Available Proofs'}
            </Text>
            {proofs.map((proof) => (
              <TouchableOpacity
                key={proof.id}
                style={[
                  styles.proofItem,
                  !batchMode && proofId === proof.id && styles.proofItemActive,
                  batchMode && selectedProofs.has(proof.id) && styles.proofItemActive,
                ]}
                onPress={() => {
                  if (batchMode) {
                    toggleProofSelection(proof.id);
                  } else {
                    setProofId(proof.id);
                  }
                }}
              >
                {batchMode && (
                  <View style={styles.checkboxContainer}>
                    <View style={[styles.checkbox, selectedProofs.has(proof.id) && styles.checkboxActive]}>
                      {selectedProofs.has(proof.id) && (
                        <Feather name="check" size={16} color="#ffffff" />
                      )}
                    </View>
                  </View>
                )}
                <View style={styles.proofInfo}>
                  <Text style={styles.proofTitle}>{proof.title}</Text>
                  <Text style={styles.proofId}>{proof.id}</Text>
                  <View style={styles.proofMeta}>
                    <Feather name="file-text" size={12} color="#6b7280" />
                    <Text style={styles.proofType}>{proof.proofType}</Text>
                  </View>
                </View>
                {!batchMode && <Feather name="chevron-right" size={20} color="#9333ea" />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {batchMode && selectedProofs.size > 0 && (
          <GradientButton
            title={`Verify ${selectedProofs.size} Proof${selectedProofs.size !== 1 ? 's' : ''}`}
            onPress={() => {/* Already computed in useMemo */}}
            icon="check-circle"
          />
        )}
      </ScrollView>
    </LinearGradient>
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
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  header: {
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  titleCompact: {
    fontSize: 24,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  modeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  modeSelectorCompact: {
    flexDirection: 'column',
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  modeButtonActive: {
    borderColor: '#9333ea',
    backgroundColor: '#faf5ff',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  modeButtonTextActive: {
    color: '#9333ea',
  },
  searchSection: {
    gap: 12,
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
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  validHeader: {
    borderBottomColor: '#86efac',
  },
  invalidHeader: {
    borderBottomColor: '#fca5a5',
  },
  resultHeaderText: {
    flex: 1,
    gap: 4,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  validText: {
    color: '#16a34a',
  },
  invalidText: {
    color: '#dc2626',
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  checksList: {
    gap: 12,
    paddingVertical: 16,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  reasonsSection: {
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  reasonsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#fffbeb',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  reasonText: {
    flex: 1,
    fontSize: 13,
    color: '#78350f',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#faf5ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#9333ea',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  emptyHint: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
  },
  proofsSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  proofItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  proofItemActive: {
    borderColor: '#9333ea',
    backgroundColor: '#faf5ff',
  },
  checkboxContainer: {
    paddingRight: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#9ca3af',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxActive: {
    backgroundColor: '#9333ea',
    borderColor: '#9333ea',
  },
  proofInfo: {
    flex: 1,
    gap: 4,
  },
  proofTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  proofId: {
    fontSize: 11,
    color: '#9ca3af',
    fontFamily: 'monospace',
  },
  proofMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  proofType: {
    fontSize: 11,
    color: '#6b7280',
  },
  batchSummary: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
});

