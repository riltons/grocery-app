import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import SafeContainer from '../../components/SafeContainer';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';
import type { Store } from '../../lib/supabase';

export default function StoresScreen() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreAddress, setNewStoreAddress] = useState('');
  const [creating, setCreating] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<Store | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        showError('Erro', 'Usuário não autenticado');
        return;
      }

      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) {
        showError('Erro', 'Não foi possível carregar as lojas');
        return;
      }

      setStores(data || []);
    } catch (error) {
      console.error('Erro ao carregar lojas:', error);
      showError('Erro', 'Ocorreu um erro ao carregar as lojas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadStores();
  };

  const handleCreateStore = async () => {
    if (!newStoreName.trim()) {
      showError('Erro', 'Nome da loja é obrigatório');
      return;
    }

    try {
      setCreating(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        showError('Erro', 'Usuário não autenticado');
        return;
      }

      const { data, error } = await supabase
        .from('stores')
        .insert({
          name: newStoreName.trim(),
          address: newStoreAddress.trim() || null,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        showError('Erro', 'Não foi possível criar a loja');
        return;
      }

      setStores(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setShowCreateModal(false);
      setNewStoreName('');
      setNewStoreAddress('');
      
      showSuccess('Sucesso', 'Loja criada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar loja:', error);
      showError('Erro', 'Ocorreu um erro ao criar a loja');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteStore = (store: Store) => {
    setStoreToDelete(store);
    setShowDeleteDialog(true);
  };

  const confirmDeleteStore = async () => {
    if (!storeToDelete) return;

    try {
      setDeleting(true);
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', storeToDelete.id);

      if (error) {
        showError('Erro', 'Não foi possível excluir a loja');
        return;
      }

      setStores(prev => prev.filter(s => s.id !== storeToDelete.id));
      showSuccess('Sucesso', 'Loja excluída com sucesso!');
      setShowDeleteDialog(false);
      setStoreToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir loja:', error);
      showError('Erro', 'Ocorreu um erro ao excluir a loja');
    } finally {
      setDeleting(false);
    }
  };

  const cancelDeleteStore = () => {
    setShowDeleteDialog(false);
    setStoreToDelete(null);
  };

  const handleStorePress = (store: Store) => {
    router.push(`/stores/${store.id}`);
  };

  const handlePriceSearchPress = (store: Store) => {
    router.push({
      pathname: '/stores/price-search',
      params: {
        storeId: store.id,
        storeName: store.name,
      }
    });
  };

  const renderStoreItem = ({ item }: { item: Store }) => (
    <TouchableOpacity
      style={styles.storeItem}
      onPress={() => handleStorePress(item)}
    >
      <View style={styles.storeIcon}>
        <Ionicons name="storefront" size={24} color="#4CAF50" />
      </View>
      
      <View style={styles.storeInfo}>
        <Text style={styles.storeName}>{item.name}</Text>
        {item.address && (
          <Text style={styles.storeAddress}>{item.address}</Text>
        )}
        <Text style={styles.storeDate}>
          Criada em {new Date(item.created_at).toLocaleDateString('pt-BR')}
        </Text>
      </View>

      <View style={styles.storeActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handlePriceSearchPress(item)}
        >
          <Ionicons name="barcode-outline" size={20} color="#4CAF50" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteStore(item)}
        >
          <Ionicons name="trash-outline" size={20} color="#f44336" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Carregando lojas...</Text>
        </View>
      </SafeContainer>
    );
  }

  return (
    <SafeContainer>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Minhas Lojas</Text>
        
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {stores.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="storefront-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>Nenhuma loja cadastrada</Text>
            <Text style={styles.emptySubtitle}>
              Adicione suas lojas favoritas para fazer pesquisa de preços
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.emptyButtonText}>Adicionar Loja</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={stores}
            renderItem={renderStoreItem}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        )}
      </View>

      {/* Create Store Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowCreateModal(false)}
              disabled={creating}
            >
              <Text style={[styles.cancelButton, creating && styles.disabledButton]}>
                Cancelar
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Nova Loja</Text>
            
            <TouchableOpacity
              onPress={handleCreateStore}
              disabled={creating || !newStoreName.trim()}
            >
              {creating ? (
                <ActivityIndicator size="small" color="#4CAF50" />
              ) : (
                <Text style={[
                  styles.saveButton,
                  (!newStoreName.trim() || creating) && styles.disabledButton
                ]}>
                  Salvar
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nome da Loja *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: Supermercado ABC"
                value={newStoreName}
                onChangeText={setNewStoreName}
                autoCapitalize="words"
                editable={!creating}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Endereço (Opcional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: Rua das Flores, 123"
                value={newStoreAddress}
                onChangeText={setNewStoreAddress}
                autoCapitalize="words"
                editable={!creating}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={showDeleteDialog}
        title="Excluir Loja"
        message={`Deseja excluir a loja "${storeToDelete?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        confirmColor="#ef4444"
        icon="trash"
        iconColor="#ef4444"
        loading={deleting}
        onConfirm={confirmDeleteStore}
        onCancel={cancelDeleteStore}
      />
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  storeItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  storeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f8f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  storeAddress: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  storeDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  storeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  cancelButton: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  saveButton: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  disabledButton: {
    color: '#94a3b8',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    color: '#1e293b',
  },
});