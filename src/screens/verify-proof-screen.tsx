import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { VerificationResult } from '../models/verification-result';
import { RootStackParamList } from '../types/navigation';
import { useProofs } from '../hooks/use-proofs';

type Props = NativeStackScreenProps<RootStackParamList, 'VerifyProof'>;

export const VerifyProofScreen = ({ navigation }: Props): React.JSX.Element => {
  const { proofs, verifyProof, verifyMultipleProofs } = useProofs();
  const [proofId, setProofId] = useState('');
  const [batchMode, setBatchMode] = useState(false);
  const [selectedProofs, setSelectedProofs] = useState<Set<string>>(new Set());

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

  const renderStatusIcon = (valid: boolean): string => (valid ? '✅' : '❌');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Verify Proof</Text>
      <Text style={styles.subtitle}>Validate proof authenticity using blockchain verification</Text>

      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[styles.modeButton, !batchMode && styles.modeButtonActive]}
          onPress={() => {
            setBatchMode(false);
            setSelectedProofs(new Set());
          }}
        >
          <Text style={[styles.modeButtonText, !batchMode && styles.modeButtonTextActive]}>
            🔍 Single
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, batchMode && styles.modeButtonActive]}
          onPress={() => {
            setBatchMode(true);
            setProofId('');
          }}
        >
          <Text style={[styles.modeButtonText, batchMode && styles.modeButtonTextActive]}>
            📋 Batch ({selectedProofs.size})
          </Text>
        </TouchableOpacity>
      </View>

      {!batchMode && (
        <View style={styles.searchSection}>
          <TextInput
            placeholder="Enter Proof ID"
            placeholderTextColor="#aaa"
            value={proofId}
            onChangeText={setProofId}
            style={styles.input}
          />
          <TouchableOpacity
            style={styles.qrScanButton}
            onPress={() => navigation.navigate('QRScanner')}
          >
            <Text style={styles.qrScanButtonText}>� Manual Verify</Text>
          </TouchableOpacity>
        </View>
      )}

      {!batchMode && result ? (
        <View style={[styles.resultContainer, result.isValid ? styles.resultValid : styles.resultInvalid]}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultIcon}>{renderStatusIcon(result.isValid)}</Text>
            <Text style={styles.resultTitle}>{result.isValid ? 'Verified' : 'Invalid'}</Text>
          </View>

          <View style={styles.resultsGrid}>
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Integrity</Text>
              <Text style={[styles.resultBadge, result.integrityValid ? styles.badgeValid : styles.badgeInvalid]}>
                {renderStatusIcon(result.integrityValid)} {result.integrityValid ? 'Valid' : 'Failed'}
              </Text>
            </View>

            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Owner</Text>
              <Text style={[styles.resultBadge, result.ownerValid ? styles.badgeValid : styles.badgeInvalid]}>
                {renderStatusIcon(result.ownerValid)} {result.ownerValid ? 'Valid' : 'Failed'}
              </Text>
            </View>

            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Signature</Text>
              <Text style={[styles.resultBadge, result.signatureValid ? styles.badgeValid : styles.badgeInvalid]}>
                {renderStatusIcon(result.signatureValid)} {result.signatureValid ? 'Valid' : 'Failed'}
              </Text>
            </View>
          </View>

          {result.reasons.length > 0 ? (
            <View style={styles.reasonsSection}>
              <Text style={styles.reasonsLabel}>Issues Found</Text>
              {result.reasons.map((reason) => (
                <View key={reason} style={styles.reasonItem}>
                  <Text style={styles.reasonText}>⚠️ {reason}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.successMessage}>
              <Text style={styles.successText}>All checks passed!</Text>
            </View>
          )}
        </View>
      ) : !batchMode ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>Enter a proof ID from the list to verify</Text>
          <Text style={styles.emptyHint}>Available proofs: {proofs.length}</Text>
        </View>
      ) : null}

      {batchMode && batchResults.length > 0 && (
        <View style={styles.batchResults}>
          <Text style={styles.sectionTitle}>Batch Results</Text>
          <View style={styles.batchSummary}>
            <Text style={styles.summaryText}>
              ✅ Valid: {batchResults.filter((r: VerificationResult) => r.isValid).length}
            </Text>
            <Text style={styles.summaryText}>
              ❌ Invalid: {batchResults.filter((r: VerificationResult) => !r.isValid).length}
            </Text>
          </View>
          {batchResults.map((r: VerificationResult, idx: number) => (
            <View key={idx} style={[styles.batchItem, r.isValid ? styles.batchItemValid : styles.batchItemInvalid]}>
              <Text style={styles.batchItemStatus}>{renderStatusIcon(r.isValid)}</Text>
            </View>
          ))}
        </View>
      )}

      {proofs.length > 0 && (
        <View style={styles.proofsSection}>
          <Text style={styles.sectionTitle}>
            {batchMode ? `Proofs (${selectedProofs.size} selected)` : 'Available Proofs'}
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
                <Text style={styles.checkbox}>{selectedProofs.has(proof.id) ? '☑️' : '☐'}</Text>
              )}
              <View style={styles.proofInfo}>
                <Text style={styles.proofTitle}>{proof.title}</Text>
                <Text style={styles.proofId}>{proof.id}</Text>
                <Text style={styles.proofType}>{proof.proofType}</Text>
              </View>
              {!batchMode && <Text style={styles.proofArrow}>›</Text>}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
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
  searchSection: {
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  qrScanButton: {
    backgroundColor: '#5865f2',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrScanButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  resultContainer: {
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderLeftWidth: 5,
  },
  resultValid: {
    backgroundColor: '#f0fdf4',
    borderLeftColor: '#22c55e',
  },
  resultInvalid: {
    backgroundColor: '#fef2f2',
    borderLeftColor: '#ef4444',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  resultIcon: {
    fontSize: 32,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
  },
  resultsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 8,
  },
  resultItem: {
    flex: 1,
    gap: 6,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  resultBadge: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeValid: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  badgeInvalid: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  reasonsSection: {
    gap: 8,
    marginTop: 8,
  },
  reasonsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#866',
  },
  reasonItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139,69,19,0.1)',
  },
  reasonText: {
    fontSize: 12,
    color: '#666',
  },
  successMessage: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  successText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  emptyHint: {
    fontSize: 13,
    color: '#999',
  },
  proofsSection: {
    gap: 8,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
  },
  proofItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  proofItemActive: {
    borderColor: '#5865f2',
    backgroundColor: '#f0f3ff',
  },
  proofInfo: {
    flex: 1,
    gap: 4,
  },
  proofTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },
  proofId: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'monospace',
  },
  proofType: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
  },
  proofArrow: {
    fontSize: 18,
    color: '#5865f2',
  },
  checkbox: {
    fontSize: 18,
    marginRight: 8,
  },
  modeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  modeButtonActive: {
    borderColor: '#5865f2',
    backgroundColor: '#f0f3ff',
  },
  modeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  modeButtonTextActive: {
    color: '#5865f2',
  },
  batchResults: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  batchSummary: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  batchItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  batchItemValid: {
    backgroundColor: '#f0fdf4',
  },
  batchItemInvalid: {
    backgroundColor: '#fef2f2',
  },
  batchItemStatus: {
    fontSize: 16,
  },
});
