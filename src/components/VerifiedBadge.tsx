import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface VerifiedBadgeProps {
  label?: string;
  variant?: 'success' | 'info' | 'warning';
}

export const VerifiedBadge = ({ label = 'Verified', variant = 'success' }: VerifiedBadgeProps): React.JSX.Element => {
  const colors = {
    success: { bg: '#f0fdf4', border: '#86efac', text: '#047857' },
    info: { bg: '#eff6ff', border: '#93c5fd', text: '#1e40af' },
    warning: { bg: '#fef3c7', border: '#fcd34d', text: '#92400e' },
  };

  const color = colors[variant];

  return (
    <View style={[styles.container, { backgroundColor: color.bg, borderColor: color.border }]}>
      <Feather name="check-circle" size={14} color={color.text} />
      <Text style={[styles.text, { color: color.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
