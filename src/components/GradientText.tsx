import React from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

interface GradientTextProps extends TextProps {
  children: React.ReactNode;
}

export const GradientText = ({ children, style, ...props }: GradientTextProps): React.JSX.Element => {
  return (
    <MaskedView
      maskElement={
        <Text style={[styles.text, style]} {...props}>
          {children}
        </Text>
      }
    >
      <LinearGradient
        colors={['#9333ea', '#2563eb'] as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={[styles.text, style, styles.transparent]} {...props}>
          {children}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
};

const styles = StyleSheet.create({
  text: {
    fontWeight: 'bold',
  },
  transparent: {
    opacity: 0,
  },
});
