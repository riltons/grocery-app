import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StoreService } from '../lib/stores';
import type { Store } from '../lib/supabase';

interface StoreSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectStore: (store: Store) => void;
  onClearStore?: () => void;
  title?: string;
  hasSelectedStore?: boolean;
}

export default function StoreSelectionModal({
  visible,
  onClose,
  onSelectStore,
  onClearStore,
  title = 'Selecionar Loja',
  hasSelectedStore = false,
}: StoreSelectionModalProps) {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadStores();
    }
  }, [visible]);

  const loadStores = async () => {
    try {
      setLoading(true);
      const { data, error } = await StoreService.getStores();
      
      if (error) {
        console.error('Erro ao carregar lojas:', error);
        return;
      }
      
      setStores(data || []);
    } catch (error) {
      console.error('Erro ao carregar lojas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStore = (store: Store) => {
    onSelectStore(store);
    onClose();
  };

  const renderStore = ({ item }: { item: Store }) => (
    <TouchableOpacity
      style={styles.storeItem}
      onPress={() => handleSelectStore(item)}
    >
      <View style={styles.storeIcon}>
        <Ionicons name="storefront" size={24} color="#4CAF50" />
      </View>
      <View style={styles.storeInfo}>
        <Text style={styles.storeName}>{item.name}</Text>
        {item.address && (
          <Text style={styles.storeAddress}>{item.address}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

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
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Onde você está fazendo suas compras?
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>Carregando lojas...</Text>
            </View>
          ) : stores.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="storefront-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>Nenhuma loja cadastrada</Text>
              <Text style={styles.emptySubtext}>
                Cadastre suas lojas na aba "Lojas" para usar esta funcionalidade
              </Text>
            </View>
          ) : (
            <FlatList
              data={stores}
              renderItem={renderStore}
              keyExtractor={(item) => item.id}
              style={styles.storesList}
              showsVerticalScrollIndicator={false}
            />
          )}

          <View style={styles.buttonContainer}>
            {hasSelectedStore && onClearStore && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  onClearStore();
                  onClose();
                }}
              >
                <Ionicons name="close-circle" size={16} color="#ff6b6b" />
                <Text style={styles.clearButtonText}>Limpar Loja</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.skipButton, hasSelectedStore && styles.skipButtonSmall]}
              onPress={onClose}
            >
              <Text style={styles.skipButtonText}>
                {hasSelectedStore ? 'Cancelar' : 'Pular por agora'}
              </Text>
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
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  storesList: {
    maxHeight: 300,
  },
  storeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 8,
  },
  storeIcon: {
    marginRight: 12,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  storeAddress: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ff6b6b',
    borderRadius: 8,
    gap: 6,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#ff6b6b',
    fontWeight: '500',
  },
  skipButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
  },
  skipButtonSmall: {
    flex: 1,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
});