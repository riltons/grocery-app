import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../context/ToastContext';
import { ListsService } from '../lib/lists';
import type { ShoppingList, SpecificProduct, GenericProduct } from '../lib/supabase';

interface ListSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  product: SpecificProduct | GenericProduct | null;
  productType: 'specific' | 'generic';
  onSuccess?: () => void;
}

const { height: screenHeight } = Dimensions.get('window');

export default function ListSelectionModal({ 
  visible, 
  onClose, 
  product, 
  productType,
  onSuccess 
}: ListSelectionModalProps) {
  const { showSuccess, showError } = useToast();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingToList, setAddingToList] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadLists();
    }
  }, [visible]);

  const loadLists = async () => {
    setLoading(true);
    try {
      const { data, error } = await ListsService.getUserLists();
      if (error) {
        showError('Erro', 'Não foi possível carregar as listas');
      } else {
        // Filtrar apenas listas ativas (não finalizadas)
        const activeLists = data?.filter(list => list.status !== 'completed') || [];
        setLists(activeLists);
      }
    } catch (error) {
      console.error('Erro ao carregar listas:', error);
      showError('Erro', 'Ocorreu um erro ao carregar as listas');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToList = async (listId: string) => {
    if (!product) return;

    setAddingToList(listId);
    try {
      if (productType === 'specific') {
        // Adicionar produto específico à lista
        const { error } = await ListsService.addSpecificProductToList(
          listId,
          product.id,
          1, // quantidade padrão
          'un' // unidade padrão
        );

        if (error) {
          showError('Erro', 'Não foi possível adicionar o produto à lista');
          return;
        }
      } else {
        // Adicionar produto genérico à lista
        const { error } = await ListsService.addGenericProductToList(
          listId,
          product.id,
          1, // quantidade padrão
          'un' // unidade padrão
        );

        if (error) {
          showError('Erro', 'Não foi possível adicionar o produto à lista');
          return;
        }
      }

      const selectedList = lists.find(list => list.id === listId);
      showSuccess(
        'Produto Adicionado!', 
        `${product.name} foi adicionado à lista "${selectedList?.name}"`
      );
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erro ao adicionar produto à lista:', error);
      showError('Erro', 'Ocorreu um erro ao adicionar o produto à lista');
    } finally {
      setAddingToList(null);
    }
  };

  const renderListItem = ({ item }: { item: ShoppingList }) => (
    <TouchableOpacity
      style={[
        styles.listItem,
        addingToList === item.id && styles.listItemLoading
      ]}
      onPress={() => handleAddToList(item.id)}
      disabled={addingToList !== null}
    >
      <View style={styles.listItemContent}>
        <View style={styles.listInfo}>
          <Text style={styles.listName}>{item.name}</Text>
          <Text style={styles.listDetails}>
            {item.items_count || 0} itens • {item.status === 'active' ? 'Ativa' : 'Rascunho'}
          </Text>
          <Text style={styles.listDate}>
            Criada em {new Date(item.created_at).toLocaleDateString('pt-BR')}
          </Text>
        </View>
        
        {addingToList === item.id ? (
          <ActivityIndicator size="small" color="#4CAF50" />
        ) : (
          <Ionicons name="add-circle-outline" size={24} color="#4CAF50" />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="list-outline" size={64} color="#cbd5e1" />
      <Text style={styles.emptyTitle}>Nenhuma lista ativa</Text>
      <Text style={styles.emptySubtitle}>
        Crie uma nova lista para adicionar produtos
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <View style={styles.bottomSheet}>
          <View style={styles.handle} />
          
          <View style={styles.header}>
            <Text style={styles.title}>Adicionar à Lista</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {product && (
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productType}>
                Produto {productType === 'specific' ? 'Específico' : 'Genérico'}
              </Text>
            </View>
          )}

          <View style={styles.content}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>Carregando listas...</Text>
              </View>
            ) : (
              <FlatList
                data={lists}
                renderItem={renderListItem}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={renderEmptyState}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.8,
    minHeight: screenHeight * 0.4,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  productType: {
    fontSize: 14,
    color: '#64748b',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  listContainer: {
    padding: 20,
    flexGrow: 1,
  },
  listItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  listItemLoading: {
    opacity: 0.7,
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  listDetails: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  listDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});