import React from 'react';
import { View, StyleSheet, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SafeContainerProps {
  children: React.ReactNode;
  style?: any;
  backgroundColor?: string;
}

export default function SafeContainer({ 
  children, 
  style, 
  backgroundColor = '#ffffff' 
}: SafeContainerProps) {
  const insets = useSafeAreaInsets();

  return (
    <View 
      style={[
        styles.container,
        {
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : insets.top,
          paddingBottom: insets.bottom,
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