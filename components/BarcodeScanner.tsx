import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BarcodeScannerProps {
  onBarcodeScanned: (data: string) => void;
  onClose: () => void;
  onManualEntry: () => void;
}

export default function BarcodeScanner({ onClose, onManualEntry }: BarcodeScannerProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="camera-outline" size={64} color="white" />
        <Text style={styles.title}>Scanner Temporariamente Indisponível</Text>
        <Text style={styles.message}>
          Use a entrada manual para adicionar produtos
        </Text>
        
        <TouchableOpacity
          onPress={onManualEntry}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Entrada Manual</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={onClose}
          style={[styles.button, styles.closeButton]}
        >
          <Text style={styles.buttonText}>Fechar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 20,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  message: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  closeButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});