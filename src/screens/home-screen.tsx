import React from 'react';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useWallet } from '../hooks/use-wallet';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export const HomeScreen = ({ navigation }: Props): React.JSX.Element => {
  const { walletSession } = useWallet();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>ScanProof</Text>
      <Text style={styles.subtitle}>Android-first MVP for proof creation and verification.</Text>
      <Text style={styles.wallet}>Wallet: {walletSession?.walletAddress ?? 'Not connected'}</Text>

      <View style={styles.actions}>
        <Button title="Wallet Connect" onPress={() => navigation.navigate('WalletConnect')} />
      </View>
      <View style={styles.actions}>
        <Button title="Create Proof" onPress={() => navigation.navigate('CreateProof')} />
      </View>
      <View style={styles.actions}>
        <Button title="Verify Proof" onPress={() => navigation.navigate('VerifyProof')} />
      </View>
      <View style={styles.actions}>
        <Button title="Proof List" onPress={() => navigation.navigate('ProofList')} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    gap: 12,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 15,
    color: '#333',
  },
  wallet: {
    fontSize: 12,
    color: '#444',
  },
  actions: {
    marginTop: 8,
  },
});
