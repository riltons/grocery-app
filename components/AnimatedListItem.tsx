import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';

interface AnimatedListItemProps {
  children: React.ReactNode;
  isNew?: boolean;
  onAnimationComplete?: () => void;
}

export default function AnimatedListItem({ 
  children, 
  isNew = false, 
  onAnimationComplete 
}: AnimatedListItemProps) {
  const backgroundColorAnim = useRef(new Animated.Value(isNew ? 1 : 0)).current;

  useEffect(() => {
    if (isNew) {
      // Animação simples de cor de fundo para destacar o item
      Animated.sequence([
        Animated.timing(backgroundColorAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(backgroundColorAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ]).start(() => {
        onAnimationComplete?.();
      });
    }
  }, [isNew]);

  const backgroundColor = backgroundColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', '#E3F2FD'], // Azul claro para destacar
  });

  const borderColor = backgroundColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', '#2196F3'], // Azul para a borda
  });

  const borderWidth = backgroundColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 2], // Borda que aparece
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor,
          borderColor,
          borderWidth,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
  },
});