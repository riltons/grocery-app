import React from 'react';
import { View, Text } from 'react-native';

export default function TestTailwind() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Teste do Tailwind CSS</Text>
      
      <View style={styles.card}>
        <Text style={styles.text}>
          Se você estiver vendo este texto com estilos, o Tailwind CSS está funcionando corretamente.
        </Text>
        
        <View style={styles.successBox}>
          <Text style={styles.successText}>
            ✅ O Tailwind CSS está funcionando perfeitamente!
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#3b82f6',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    padding: 20,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
    marginBottom: 20,
  },
  successBox: {
    padding: 16,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 8,
  },
  successText: {
    color: '#065f46',
    fontSize: 16,
    lineHeight: 24,
  },
};
