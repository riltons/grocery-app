import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import SafeContainer from '../../components/SafeContainer';
import BarcodeScanner from '../../components/BarcodeScanner';
import { useToast } from '../../context/ToastContext';

export default function BarcodeScannerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { showSuccess, showError } = useToast();
  
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  
  // Parâmetros opcionais para contexto
  const listId = params.listId as string;
  const returnTo = params.returnTo as string;

  const handleBarcodeScanned = (barcode: string) => {
    if (!barcode || barcode.trim().length === 0) {
      showError('Erro', 'Código de barras inválido');
      return;
    }

    console.log('📱 Código escaneado:', barcode);
    
    // Navegar para a tela de criação de produto com o código escaneado
    const params = new URLSearchParams();
    params.append('barcode', barcode.trim());
    
    if (listId) {
      params.append('listId', listId);
    }
    
    if (returnTo) {
      params.append('returnTo', returnTo);
    }
    
    router.replace(`/product/new?${params.toString()}`);
  };

  const handleManualEntry = () => {
    setShowManualEntry(true);
  };

  const handleManualBarcodeSubmit = () => {
    if (!manualBarcode.trim()) {
      showError('Erro', 'Por favor, digite um código de barras válido');
      return;
    }

    // Validar se é um código de barras válido (números apenas, 8-13 dígitos)
    const cleanBarcode = manualBarcode.trim();
    if (!/^\d{8,13}$/.test(cleanBarcode)) {
      showError('Erro', 'Código de barras deve conter apenas números e ter entre 8 e 13 dígitos');
      return;
    }

    setShowManualEntry(false);
    handleBarcodeScanned(cleanBarcode);
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <SafeContainer style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleClose}
        >
          <Ionicons name="close" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Escanear Código de Barras</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleManualEntry}
        >
          <Ionicons name="keypad-outline" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <BarcodeScanner
        onBarcodeScanned={handleBarcodeScanned}
        onClose={handleClose}
        onManualEntry={handleManualEntry}
      />

      {/* Modal para entrada manual */}
      <Modal
        visible={showManualEntry}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowManualEntry(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Entrada Manual</Text>
              <TouchableOpacity
                onPress={() => setShowManualEntry(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Digite o código de barras do produto (8-13 dígitos):
            </Text>

            <TextInput
              style={styles.barcodeInput}
              placeholder="Ex: 7891234567890"
              value={manualBarcode}
              onChangeText={setManualBarcode}
              keyboardType="numeric"
              maxLength={13}
              autoFocus={true}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowManualEntry(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  !manualBarcode.trim() && styles.confirmButtonDisabled
                ]}
                onPress={handleManualBarcodeSubmit}
                disabled={!manualBarcode.trim()}
              >
                <Text style={styles.confirmButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDescription: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 20,
    lineHeight: 24,
  },
  barcodeInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1e293b',
    fontFamily: 'monospace',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748b',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});