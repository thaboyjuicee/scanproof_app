import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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

  const renderStatusIcon = (valid: boolean): string => (valid ? '✅' : '❌');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Verify Proof</Text>
      <Text style={styles.subtitle}>Enter a proof ID to validate its blockchain signature</Text>

      <View style={styles.searchSection}>
        <TextInput
          placeholder="Enter Proof ID"
          placeholderTextColor="#aaa"
          value={proofId}
          onChangeText={setProofId}
          style={styles.input}
        />
      </View>

      {result ? (
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
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>Enter a proof ID from the list to verify</Text>
          <Text style={styles.emptyHint}>Available proofs: {proofs.length}</Text>
        </View>
      )}

      {proofs.length > 0 && (
        <View style={styles.proofsSection}>
          <Text style={styles.sectionTitle}>Available Proofs</Text>
          {proofs.map((proof) => (
            <TouchableOpacity
              key={proof.id}
              style={[styles.proofItem, proofId === proof.id && styles.proofItemActive]}
              onPress={() => setProofId(proof.id)}
            >
              <View style={styles.proofInfo}>
                <Text style={styles.proofTitle}>{proof.title}</Text>
                <Text style={styles.proofId}>{proof.id}</Text>
              </View>
              <Text style={styles.proofArrow}>›</Text>
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
  proofArrow: {
    fontSize: 18,
    color: '#5865f2',
  },
});
