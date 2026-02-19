import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

interface WalletButtonProps {
  connected: boolean;
  walletAddress?: string;
  onPress: () => void;
}

export const WalletButton = ({ connected, walletAddress, onPress }: WalletButtonProps): React.JSX.Element => {
  const shortenAddress = (address: string): string => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (connected && walletAddress) {
    return (
      <TouchableOpacity style={styles.connectedContainer} onPress={onPress} activeOpacity={0.8}>
        <View style={styles.connectedContent}>
          <Feather name="check-circle" size={16} color="#10b981" />
          <Text style={styles.addressText}>{shortenAddress(walletAddress)}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={['#9333ea', '#2563eb'] as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <Feather name="credit-card" size={18} color="#ffffff" />
        <Text style={styles.text}>Connect Wallet</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  text: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  connectedContainer: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  connectedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  addressText: {
    color: '#047857',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
});
