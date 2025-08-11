import React from 'react';
import { View, StyleSheet, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SafeContainerProps {
  children: React.ReactNode;
  style?: any;
  backgroundColor?: string;
  hasTabBar?: boolean;
}

export default function SafeContainer({ 
  children, 
  style, 
  backgroundColor = '#ffffff',
  hasTabBar = false
}: SafeContainerProps) {
  const insets = useSafeAreaInsets();

  // Calcular espaço do tab bar se necessário
  const tabBarSpace = hasTabBar 
    ? (Platform.OS === 'ios' 
        ? 65 + Math.max(insets.bottom, 20)
        : 57 + Math.max(insets.bottom, 8))
    : 0;

  return (
    <View 
      style={[
        styles.container,
        {
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : insets.top,
          paddingBottom: hasTabBar ? 0 : insets.bottom,
          marginBottom: hasTabBar ? tabBarSpace : 0,
          backgroundColor,
        },
        style
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});