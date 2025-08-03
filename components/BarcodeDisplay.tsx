import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

interface BarcodeDisplayProps {
  barcode?: string;
  barcodeType?: string;
  onGenerateBarcode?: () => void;
  style?: any;
}

export default function BarcodeDisplay({ 
  barcode, 
  barcodeType, 
  onGenerateBarcode,
  style 
}: BarcodeDisplayProps) {
  
  const handleCopyBarcode = async () => {
    if (barcode) {
      await Clipboard.setStringAsync(barcode);
      Alert.alert('Copiado', 'Código de barras copiado para a área de transferência');
    }
  };

  if (!barcode) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.emptyState}>
          <Ionicons name="barcode-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>Nenhum código de barras</Text>
          {onGenerateBarcode && (
            <TouchableOpacity 
              style={styles.generateButton}
              onPress={onGenerateBarcode}
            >
              <Ionicons name="add" size={20} color="#4CAF50" />
              <Text style={styles.generateButtonText}>Gerar Código</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.barcodeContainer}>
        {/* Representação visual simples do código de barras */}
        <View style={styles.barcodeVisual}>
          {Array.from({ length: 30 }, (_, i) => (
            <View 
              key={i}
              style={[
                styles.barcodeLine,
                { 
                  width: Math.random() > 0.5 ? 2 : 1,
                  backgroundColor: Math.random() > 0.3 ? '#000' : 'transparent'
                }
              ]} 
            />
          ))}
        </View>
        
        <View style={styles.barcodeInfo}>
          <Text style={styles.barcodeNumber}>{barcode}</Text>
          <Text style={styles.barcodeType}>{barcodeType || 'EAN13'}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.copyButton}
          onPress={handleCopyBarcode}
        >
          <Ionicons name="copy-outline" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
    marginBottom: 16,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  generateButtonText: {
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 4,
  },
  barcodeContainer: {
    padding: 16,
  },
  barcodeVisual: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    backgroundColor: '#fff',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  barcodeLine: {
    height: '100%',
    marginHorizontal: 0.5,
  },
  barcodeInfo: {
    alignItems: 'center',
    marginBottom: 8,
  },
  barcodeNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: 1,
  },
  barcodeType: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  copyButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 8,
  },
});