import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useProofs } from '../hooks/use-proofs';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'ProofList'>;

export const ProofListScreen = ({ navigation }: Props): React.JSX.Element => {
  const { proofs } = useProofs();

  const renderProofItem = ({ item }: { item: NonNullable<ReturnType<typeof useProofs>['proofs'][0]> }) => (
    <TouchableOpacity
      style={styles.proofItem}
      onPress={() => navigation.navigate('ProofDetails', { proof: item })}
    >
      <View style={styles.proofContent}>
        <Text style={styles.proofTitle}>{item.title}</Text>
        <Text style={styles.proofDesc} numberOfLines={1}>{item.description}</Text>
        <View style={styles.proofMeta}>
          <Text style={styles.proofId}>{item.id}</Text>
          <Text style={styles.proofTime}>{new Date(item.timestampIso).toLocaleDateString()}</Text>
        </View>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Proofs</Text>
        <Text style={styles.subtitle}>{proofs.length} proof{proofs.length !== 1 ? 's' : ''}</Text>
      </View>

      {proofs.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>No proofs created yet</Text>
          <Text style={styles.emptyHint}>Create one to get started</Text>
        </View>
      ) : (
        <FlatList
          data={proofs}
          renderItem={renderProofItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          scrollEnabled={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#222',
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 10,
  },
  proofItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  proofContent: {
    flex: 1,
    gap: 6,
  },
  proofTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
  },
  proofDesc: {
    fontSize: 12,
    color: '#666',
  },
  proofMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 2,
  },
  proofId: {
    fontSize: 10,
    color: '#999',
    fontFamily: 'monospace',
  },
  proofTime: {
    fontSize: 10,
    color: '#999',
  },
  arrow: {
    fontSize: 20,
    color: '#5865f2',
    marginLeft: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyIcon: {
    fontSize: 56,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
  },
  emptyHint: {
    fontSize: 13,
    color: '#999',
  },
});
