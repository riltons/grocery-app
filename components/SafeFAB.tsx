import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SafeFABProps {
  onPress: () => void;
  children?: React.ReactNode;
  style?: any;
  size?: number;
  backgroundColor?: string;
  right?: number;
  left?: number;
}

export default function SafeFAB({ 
  onPress, 
  children, 
  style,
  size = 56,
  backgroundColor = '#4CAF50',
  right = 24,
  left
}: SafeFABProps) {
  const insets = useSafeAreaInsets();

  return (
    <TouchableOpacity
      style={[
        styles.fab,
        {
          bottom: Math.max(24, insets.bottom + 16), // Garante pelo menos 16px acima da safe area
          right: left === undefined ? right : undefined,
          left: left,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
        style
      ]}
      onPress={onPress}
    >
      {children || <Text style={styles.fabText}>+</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  fabText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '300',
  },
});