import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type PriceEditModalProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (price: number | null) => Promise<void>;
  productName: string;
  currentPrice?: number;
  quantity: number;
  unit: string;
  loading?: boolean;
};

export default function PriceEditModal({
  visible,
  onClose,
  onConfirm,
  productName,
  currentPrice,
  quantity,
  unit,
  loading = false
}: PriceEditModalProps) {
  const [price, setPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Atualiza o preço quando o modal abre
  useEffect(() => {
    if (visible) {
      setPrice(currentPrice ? currentPrice.toString() : '');
    }
  }, [visible, currentPrice]);

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      
      const numericPrice = price.trim() === '' ? null : parseFloat(price.replace(',', '.'));
      
      // Validação
      if (numericPrice !== null && (isNaN(numericPrice) || numericPrice < 0)) {
        Alert.alert('Erro', 'Por favor, insira um preço válido');
        return;
      }

      if (numericPrice !== null && numericPrice > 999999.99) {
        Alert.alert('Erro', 'O preço não pode ser maior que R$ 999.999,99');
        return;
      }

      await onConfirm(numericPrice);
      onClose();
      setPrice('');
    } catch (error) {
      console.error('Erro ao atualizar preço:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o preço');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setPrice(currentPrice ? currentPrice.toString() : '');
    onClose();
  };

  const handleRemovePrice = async () => {
    Alert.alert(
      'Remover Preço',
      'Tem certeza que deseja remover o preço deste item?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSubmitting(true);
              await onConfirm(null);
              onClose();
              setPrice('');
            } catch (error) {
              console.error('Erro ao remover preço:', error);
              Alert.alert('Erro', 'Não foi possível remover o preço');
            } finally {
              setIsSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const formatCurrency = (value: string) => {
    // Remove caracteres não numéricos exceto vírgula e ponto
    const cleanValue = value.replace(/[^\d.,]/g, '');
    return cleanValue;
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleCancel}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Editar Preço</Text>
            <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.productInfo}>
            <Text style={styles.productName}>{productName}</Text>
            <Text style={styles.productQuantity}>
              {quantity} {unit}
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Preço unitário (opcional)</Text>
            <View style={styles.priceInputContainer}>
              <Text style={styles.currencySymbol}>R$</Text>
              <TextInput
                style={styles.priceInput}
                value={price}
                onChangeText={(text) => setPrice(formatCurrency(text))}
                placeholder="0,00"
                keyboardType="numeric"
                autoFocus
                selectTextOnFocus
              />
            </View>
            <Text style={styles.inputHint}>
              Deixe em branco para remover o preço
            </Text>
          </View>

          {currentPrice && (
            <View style={styles.currentPriceContainer}>
              <Text style={styles.currentPriceLabel}>Preço atual:</Text>
              <Text style={styles.currentPriceValue}>
                {currentPrice.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                })}
              </Text>
            </View>
          )}

          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total estimado:</Text>
            <Text style={styles.totalValue}>
              {price && !isNaN(parseFloat(price.replace(',', '.'))) 
                ? (parseFloat(price.replace(',', '.')) * quantity).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  })
                : 'R$ 0,00'
              }
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            {currentPrice && (
              <TouchableOpacity
                style={[styles.removeButton, (isSubmitting || loading) && styles.disabledButton]}
                onPress={handleRemovePrice}
                disabled={isSubmitting || loading}
              >
                <Ionicons name="trash-outline" size={16} color="#ff6b6b" />
                <Text style={styles.removeButtonText}>Remover</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.cancelButton, (isSubmitting || loading) && styles.disabledButton]}
              onPress={handleCancel}
              disabled={isSubmitting || loading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmButton, (isSubmitting || loading) && styles.disabledButton]}
              onPress={handleConfirm}
              disabled={isSubmitting || loading}
            >
              {isSubmitting || loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>Salvar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  productInfo: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productQuantity: {
    fontSize: 14,
    color: '#666',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    paddingLeft: 12,
  },
  priceInput: {
    flex: 1,
    fontSize: 18,
    padding: 12,
    color: '#333',
  },
  inputHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  currentPriceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f0f8f0',
    borderRadius: 8,
  },
  currentPriceLabel: {
    fontSize: 14,
    color: '#666',
  },
  currentPriceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ff6b6b',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  removeButtonText: {
    color: '#ff6b6b',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});