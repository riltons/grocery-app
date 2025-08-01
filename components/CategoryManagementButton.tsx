import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface CategoryManagementButtonProps {
  style?: any;
}

export default function CategoryManagementButton({ style }: CategoryManagementButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={() => router.push('/categories')}
    >
      <Ionicons name="folder-outline" size={20} color="#4CAF50" />
      <Text style={styles.buttonText}>Gerenciar Categorias</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
    marginVertical: 8,
  },
  buttonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
  },
});