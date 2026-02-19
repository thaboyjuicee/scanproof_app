import React from 'react';
import { StyleSheet, Text, TouchableOpacity, TouchableOpacityProps, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

interface GradientButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary';
  icon?: string;
}

export const GradientButton = ({ title, variant = 'primary', icon, style, ...props }: GradientButtonProps): React.JSX.Element => {
  const colors: [string, string] = variant === 'primary' 
    ? ['#9333ea', '#2563eb'] // purple-600 to blue-600
    : ['#6b7280', '#4b5563']; // gray-500 to gray-600

  return (
    <TouchableOpacity style={[styles.container, style]} activeOpacity={0.8} {...props}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        {icon && <Feather name={icon as any} size={20} color="#ffffff" />}
        <Text style={styles.text}>{title}</Text>
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
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
