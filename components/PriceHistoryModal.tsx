import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Tipos para o histórico de preços
type Store = {
  id: string;
  name: string;
  address?: string;
};

type PriceRecord = {
  id: string;
  store_id: string;
  price: number;
  date: string;
  store?: Store;
  stores?: Store;
};

type PriceHistoryModalProps = {
  visible: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  onSavePrice: (storeId: string, price: number) => Promise<void>;
  priceHistory: PriceRecord[];
  stores: Store[];
  loading: boolean;
};

export default function PriceHistoryModal({
  visible,
  onClose,
  productId,
  productName,
  onSavePrice,
  priceHistory,
  stores,
  loading
}: PriceHistoryModalProps) {
  const [price, setPrice] = useState('');
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [storeModalVisible, setStoreModalVisible] = useState(false);
  const [savingPrice, setSavingPrice] = useState(false);

  // Limpa os campos quando o modal é fechado
  useEffect(() => {
    if (!visible) {
      setPrice('');
      setSelectedStore(null);
    }
  }, [visible]);

  // Encontra a loja selecionada
  const selectedStoreObj = stores.find(store => store.id === selectedStore);

  // Função para salvar o preço
  const handleSavePrice = async () => {
    if (!selectedStore) {
      Alert.alert('Erro', 'Por favor, selecione uma loja');
      return;
    }

    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      Alert.alert('Erro', 'Por favor, informe um preço válido');
      return;
    }

    try {
      setSavingPrice(true);
      await onSavePrice(selectedStore, parseFloat(price));
      setPrice('');
      Alert.alert('Sucesso', 'Preço registrado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar preço:', error);
      Alert.alert('Erro', 'Não foi possível salvar o preço');
    } finally {
      setSavingPrice(false);
    }
  };

  // Renderiza cada item do histórico de preços
  const renderPriceItem = ({ item }: { item: PriceRecord }) => {
    const storeName = item.store?.name || 'Loja desconhecida';
    const formattedDate = new Date(item.date).toLocaleDateString('pt-BR');
    const formattedPrice = item.price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });

    return (
      <View style={styles.priceItem}>
        <View style={styles.priceItemInfo}>
          <Text style={styles.storeName}>{storeName}</Text>
          <Text style={styles.priceDate}>{formattedDate}</Text>
        </View>
        <Text style={styles.priceValue}>{formattedPrice}</Text>
      </View>
    );
  };

  // Renderiza cada loja na lista de seleção
  const renderStoreItem = ({ item }: { item: Store }) => (
    <TouchableOpacity
      style={styles.storeItem}
      onPress={() => {
        setSelectedStore(item.id);
        setStoreModalVisible(false);
      }}
    >
      <Ionicons name="storefront-outline" size={20} color="#4CAF50" />
      <View style={styles.storeInfo}>
        <Text style={styles.storeItemName}>{item.name}</Text>
        {item.address && <Text style={styles.storeAddress}>{item.address}</Text>}
      </View>
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
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Histórico de Preços</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <Text style={styles.productName}>{productName}</Text>

          <View style={styles.addPriceSection}>
            <Text style={styles.sectionTitle}>Registrar novo preço</Text>

            <TouchableOpacity
              style={styles.storeSelector}
              onPress={() => setStoreModalVisible(true)}
              disabled={savingPrice}
            >
              {selectedStoreObj ? (
                <Text style={styles.selectedStoreText}>{selectedStoreObj.name}</Text>
              ) : (
                <Text style={styles.placeholderText}>Selecionar loja</Text>
              )}
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>

            <View style={styles.priceInputContainer}>
              <TextInput
                style={styles.priceInput}
                placeholder="Preço (R$)"
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
                editable={!savingPrice}
              />

              <TouchableOpacity
                style={[styles.saveButton, (!selectedStore || !price || savingPrice) && styles.buttonDisabled]}
                onPress={handleSavePrice}
                disabled={!selectedStore || !price || savingPrice}
              >
                {savingPrice ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Histórico</Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>Carregando histórico...</Text>
            </View>
          ) : priceHistory.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="cash-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>Nenhum preço registrado</Text>
            </View>
          ) : (
            <FlatList
              data={priceHistory}
              renderItem={renderPriceItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.priceList}
            />
          )}
        </View>
      </View>

      {/* Modal para seleção de loja */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={storeModalVisible}
        onRequestClose={() => setStoreModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione uma loja</Text>
              <TouchableOpacity onPress={() => setStoreModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {stores.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="storefront-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>Nenhuma loja cadastrada</Text>
              </View>
            ) : (
              <FlatList
                data={stores}
                renderItem={renderStoreItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.storeList}
              />
            )}
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4CAF50',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    color: '#333',
  },
  addPriceSection: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  storeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 12,
  },
  selectedStoreText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInput: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#a5d6a7',
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 8,
    color: '#666',
  },
  priceList: {
    paddingBottom: 20,
  },
  priceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  priceItemInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  priceDate: {
    fontSize: 12,
    color: '#666',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  storeList: {
    paddingBottom: 20,
  },
  storeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  storeInfo: {
    marginLeft: 8,
    flex: 1,
  },
  storeItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  storeAddress: {
    fontSize: 12,
    color: '#666',
  },
});