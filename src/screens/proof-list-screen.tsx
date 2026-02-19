import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useProofs } from '../hooks/use-proofs';
import { RootStackParamList } from '../types/navigation';
import { CardContainer, GradientText } from '../components';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ProofListScreen = (): React.JSX.Element => {
  const navigation = useNavigation<NavigationProp>();
  const { proofs } = useProofs();

  const getProofIcon = (type: string): string => {
    switch (type) {
      case 'photo': return 'camera';
      case 'document': return 'file';
      default: return 'file-text';
    }
  };

  const renderProofItem = ({ item, index }: { item: NonNullable<ReturnType<typeof useProofs>['proofs'][0]>; index: number }) => (
    <TouchableOpacity
      style={[styles.gridItem, index % 2 === 0 ? styles.gridItemLeft : styles.gridItemRight]}
      onPress={() => navigation.navigate('ProofDetails', { proof: item })}
    >
      <LinearGradient
        colors={['#9333ea', '#2563eb']}
        style={styles.iconCircle}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Feather name={getProofIcon(item.proofType) as any} size={24} color="#ffffff" />
      </LinearGradient>
      
      <View style={styles.proofContent}>
        <Text style={styles.proofTitle} numberOfLines={2}>{item.title}</Text>
        {item.description && (
          <Text style={styles.proofDesc} numberOfLines={1}>{item.description}</Text>
        )}
        <View style={styles.proofFooter}>
          <Feather name="check-circle" size={12} color="#22c55e" />
          <Text style={styles.proofTime}>
            {new Date(item.timestampIso).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#faf5ff', '#ffffff', '#eff6ff']} style={styles.gradient}>
      <View style={styles.container}>
        <View style={styles.header}>
          <GradientText style={styles.title}>My Proofs</GradientText>
          <Text style={styles.subtitle}>{proofs.length} digital certificate{proofs.length !== 1 ? 's' : ''}</Text>
        </View>

        {proofs.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Feather name="folder" size={48} color="#9333ea" />
            </View>
            <Text style={styles.emptyText}>No Proofs Yet</Text>
            <Text style={styles.emptyHint}>Create your first proof to get started</Text>
          </View>
        ) : (
          <FlatList
            data={proofs}
            renderItem={renderProofItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.gridContainer}
            columnWrapperStyle={styles.row}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </LinearGradient>
  );
};


const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  gridContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  row: {
    gap: 12,
    marginBottom: 12,
  },
  gridItem: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  gridItemLeft: {
    marginRight: 6,
  },
  gridItemRight: {
    marginLeft: 6,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  proofContent: {
    gap: 6,
    minHeight: 80,
  },
  proofTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    lineHeight: 18,
  },
  proofDesc: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  proofFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 'auto',
  },
  proofTime: {
    fontSize: 10,
    color: '#9ca3af',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#faf5ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#9333ea',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  emptyHint: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

