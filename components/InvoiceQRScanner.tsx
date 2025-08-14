import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, Camera } from 'expo-camera';

interface InvoiceQRScannerProps {
  onQRCodeScanned: (data: string) => void;
  onClose: () => void;
  onManualEntry: () => void;
}

export default function InvoiceQRScanner({ onQRCodeScanned, onClose, onManualEntry }: InvoiceQRScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
  }, []);

  const handleQRCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    console.log('📱 QR Code da nota fiscal escaneado:', { type, data });
    
    // Validar se parece ser um QR code de nota fiscal
    if (data && (data.startsWith('http') || data.includes('|'))) {
      onQRCodeScanned(data.trim());
    } else {
      Alert.alert(
        'QR Code Inválido',
        'Este não parece ser um QR code de nota fiscal válido. Tente novamente.',
        [
          {
            text: 'OK',
            onPress: () => setScanned(false),
          },
        ]
      );
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Ionicons name="camera-outline" size={64} color="white" />
          <Text style={styles.title}>Solicitando Permissão da Câmera</Text>
          <Text style={styles.message}>
            Aguarde enquanto verificamos as permissões...
          </Text>
        </View>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Ionicons name="camera-outline" size={64} color="white" />
          <Text style={styles.title}>Acesso à Câmera Negado</Text>
          <Text style={styles.message}>
            Para escanear QR codes de nota fiscal, é necessário permitir o acesso à câmera.
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

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleQRCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        <View style={styles.overlay}>
          {/* Área de foco para o scanner */}
          <View style={styles.scanArea}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
          </View>
          
          <View style={styles.instructions}>
            <Ionicons name="receipt-outline" size={32} color="white" style={styles.receiptIcon} />
            <Text style={styles.instructionText}>
              Posicione o QR code da nota fiscal dentro da área destacada
            </Text>
            <Text style={styles.subInstructionText}>
              O QR code geralmente está no final da nota fiscal
            </Text>
          </View>

          {scanned && (
            <View style={styles.scannedOverlay}>
              <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
              <Text style={styles.scannedText}>QR Code Escaneado!</Text>
              <Text style={styles.scannedSubText}>Processando nota fiscal...</Text>
            </View>
          )}
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 280,
    height: 280,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#4CAF50',
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instructions: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  receiptIcon: {
    marginBottom: 12,
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    fontWeight: '600',
  },
  subInstructionText: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
  },
  scannedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannedText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  scannedSubText: {
    color: '#ccc',
    fontSize: 16,
    marginTop: 8,
  },
  content: {
    alignItems: 'center',
    padding: 20,
    flex: 1,
    justifyContent: 'center',
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
    lineHeight: 20,
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