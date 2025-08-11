import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ListFinishModalProps {
  visible: boolean;
  onClose: () => void;
  onFinish: (createNewListWithPending: boolean) => Promise<void>;
  listName: string;
  pendingItemsCount: number;
  completedItemsCount: number;
  loading?: boolean;
}

export default function ListFinishModal({
  visible,
  onClose,
  onFinish,
  listName,
  pendingItemsCount,
  completedItemsCount,
  loading = false,
}: ListFinishModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFinishWithNewList = async () => {
    try {
      setIsSubmitting(true);
      await onFinish(true);
      onClose();
    } catch (error) {
      console.error('Erro ao finalizar lista:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishWithoutNewList = async () => {
    try {
      setIsSubmitting(true);
      await onFinish(false);
      onClose();
    } catch (error) {
      console.error('Erro ao finalizar lista:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = loading || isSubmitting;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Finalizar Lista</Text>
            <TouchableOpacity onPress={onClose} disabled={isLoading}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.listInfo}>
            <Text style={styles.listName}>{listName}</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.statText}>{completedItemsCount} comprados</Text>
              </View>
              {pendingItemsCount > 0 && (
                <View style={styles.statItem}>
                  <Ionicons name="time" size={20} color="#FF9800" />
                  <Text style={styles.statText}>{pendingItemsCount} pendentes</Text>
                </View>
              )}
            </View>
          </View>

          {pendingItemsCount > 0 ? (
            <View style={styles.content}>
              <Text style={styles.question}>
                Você ainda tem {pendingItemsCount} {pendingItemsCount === 1 ? 'item pendente' : 'itens pendentes'}.
              </Text>
              <Text style={styles.subtitle}>
                O que deseja fazer com {pendingItemsCount === 1 ? 'ele' : 'eles'}?
              </Text>

              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={[styles.optionButton, styles.createListButton, isLoading && styles.disabledButton]}
                  onPress={handleFinishWithNewList}
                  disabled={isLoading}
                >
                  <View style={styles.optionIcon}>
                    <Ionicons name="add-circle" size={24} color="#4CAF50" />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>Criar Nova Lista</Text>
                    <Text style={styles.optionDescription}>
                      Criar uma nova lista com os itens pendentes
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.optionButton, styles.discardButton, isLoading && styles.disabledButton]}
                  onPress={handleFinishWithoutNewList}
                  disabled={isLoading}
                >
                  <View style={styles.optionIcon}>
                    <Ionicons name="trash" size={24} color="#ff6b6b" />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>Descartar Pendentes</Text>
                    <Text style={styles.optionDescription}>
                      Finalizar lista e descartar itens não comprados
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.content}>
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
                <Text style={styles.successTitle}>Lista Completa!</Text>
                <Text style={styles.successMessage}>
                  Todos os itens foram comprados. Deseja finalizar a lista?
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.finishButton, isLoading && styles.disabledButton]}
                onPress={handleFinishWithoutNewList}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color="#fff" />
                    <Text style={styles.finishButtonText}>Finalizar Lista</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[styles.cancelButton, isLoading && styles.disabledButton]}
            onPress={onClose}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
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
  listInfo: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  listName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    marginBottom: 20,
  },
  question: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  createListButton: {
    backgroundColor: '#f0f8f1',
    borderColor: '#4CAF50',
  },
  discardButton: {
    backgroundColor: '#fff5f5',
    borderColor: '#ff6b6b',
  },
  optionIcon: {
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
    marginTop: 12,
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  finishButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  finishButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.6,
  },
});