import React from 'react';
import { Modal } from 'react-native';
import SimpleBarcodeScanner from './SimpleBarcodeScanner';
import { BarcodeResult } from '../lib/barcode';

interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onBarcodeScanned: (result: BarcodeResult) => void;
  onManualEntry: () => void;
}

export default function BarcodeScannerModal({
  visible,
  onClose,
  onBarcodeScanned,
  onManualEntry,
}: BarcodeScannerModalProps) {
  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SimpleBarcodeScanner
        onBarcodeScanned={onBarcodeScanned}
        onClose={onClose}
        onManualEntry={onManualEntry}
      />
    </Modal>
  );
}