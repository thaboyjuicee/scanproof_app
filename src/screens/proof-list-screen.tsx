import React from 'react';
import { Button, FlatList, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useProofs } from '../hooks/use-proofs';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'ProofList'>;

export const ProofListScreen = ({ navigation }: Props): React.JSX.Element => {
  const { proofs } = useProofs();

  return (
    <FlatList
      data={proofs}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      ListEmptyComponent={<Text>No proofs yet.</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.meta}>{item.timestampIso}</Text>
          <Text style={styles.hash}>{item.hash.slice(0, 18)}...</Text>
          <Button title="Open Details" onPress={() => navigation.navigate('ProofDetails', { proof: item })} />
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  meta: {
    fontSize: 12,
    color: '#444',
  },
  hash: {
    fontSize: 12,
  },
});
