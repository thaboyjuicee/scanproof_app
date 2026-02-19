import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewProps } from 'react-native';

interface LoadingSkeletonProps extends ViewProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
}

export const LoadingSkeleton = ({ 
  width = '100%', 
  height = 20, 
  borderRadius = 8,
  style,
  ...props 
}: LoadingSkeletonProps): React.JSX.Element => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { height, borderRadius, opacity },
        width === '100%' ? { width: '100%' } : { width: width as number },
        style,
      ]}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#e5e7eb',
  },
});
