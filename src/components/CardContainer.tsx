import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

interface CardContainerProps extends ViewProps {
  children: React.ReactNode;
  noPadding?: boolean;
}

export const CardContainer = ({ children, noPadding, style, ...props }: CardContainerProps): React.JSX.Element => {
  return (
    <View style={[styles.container, noPadding && styles.noPadding, style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  noPadding: {
    padding: 0,
  },
});
