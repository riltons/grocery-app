import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, Dimensions } from 'react-native';
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
  const [showFullScreen, setShowFullScreen] = useState(false);
  const screenWidth = Dimensions.get('window').width;
  
  // Estilos dinâmicos para o modal
  const modalContentStyle = {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 40,
    width: screenWidth - 32,
    alignSelf: 'center' as const,
  };
  
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

  const renderBarcodeVisual = (isFullScreen = false) => {
    const barcodeWidth = isFullScreen ? screenWidth - 80 : undefined; // Margens de 40px de cada lado
    const lineCount = isFullScreen ? 80 : 30; // Mais linhas para melhor visualização
    
    return (
      <View style={[
        styles.barcodeVisual, 
        isFullScreen && { 
          width: barcodeWidth, 
          height: 140, // Altura maior para melhor proporção
          marginHorizontal: 0 // Remove padding horizontal no modo fullscreen
        }
      ]}>
        {Array.from({ length: lineCount }, (_, i) => (
          <View 
            key={i}
            style={[
              styles.barcodeLine,
              { 
                width: Math.random() > 0.5 ? (isFullScreen ? 3 : 2) : (isFullScreen ? 2 : 1),
                backgroundColor: Math.random() > 0.3 ? '#000' : 'transparent'
              }
            ]} 
          />
        ))}
      </View>
    );
  };

  return (
    <>
      <View style={[styles.container, style]}>
        <View style={styles.barcodeContainer}>
          {/* Representação visual clicável do código de barras */}
          <TouchableOpacity 
            onPress={() => setShowFullScreen(true)}
            activeOpacity={0.7}
          >
            {renderBarcodeVisual()}
          </TouchableOpacity>
          
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

      {/* Modal para exibir código de barras em tela cheia */}
      <Modal
        visible={showFullScreen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFullScreen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={modalContentStyle}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Código de Barras</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowFullScreen(false)}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.fullScreenBarcodeContainer}>
              {renderBarcodeVisual(true)}
              
              <View style={styles.fullScreenBarcodeInfo}>
                <Text style={styles.fullScreenBarcodeNumber}>{barcode}</Text>
                <Text style={styles.fullScreenBarcodeType}>{barcodeType || 'EAN13'}</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.fullScreenCopyButton}
                onPress={handleCopyBarcode}
              >
                <Ionicons name="copy-outline" size={20} color="#4CAF50" />
                <Text style={styles.fullScreenCopyText}>Copiar Código</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
  // Estilos do modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  fullScreenBarcodeContainer: {
    paddingHorizontal: 16, // Margens internas menores para maximizar largura
    paddingVertical: 20,
    alignItems: 'center',
  },
  fullScreenBarcodeInfo: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  fullScreenBarcodeNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: 2,
  },
  fullScreenBarcodeType: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  fullScreenCopyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8f1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  fullScreenCopyText: {
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 8,
    fontSize: 16,
  },
});