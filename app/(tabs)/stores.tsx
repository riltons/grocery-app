import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import SafeContainer from '../../components/SafeContainer';
import { useToast } from '../../context/ToastContext';
import { StoreService } from '../../lib/stores';
import type { Store } from '../../lib/supabase';

export default function StoresTab() {
  const router = useRouter();
  const { showError } = useToast();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      const { data, error } = await StoreService.getUserStores();
      if (error) {
        showError('Erro', 'Não foi possível carregar as lojas');
      } else {
        setStores(data || []);
      }
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

  const renderStoreItem = ({ item }: { item: Store }) => (
    <TouchableOpacity
      style={styles.storeItem}
      onPress={() => router.push(`/stores/${item.id}`)}
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
          style={styles.searchButton}
          onPress={() => router.push(`/stores/search-history/${item.id}`)}
        >
          <Ionicons name="search-outline" size={18} color="#4CAF50" />
        </TouchableOpacity>
        
        <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="storefront-outline" size={64} color="#cbd5e1" />
      <Text style={styles.emptyTitle}>Nenhuma loja cadastrada</Text>
      <Text style={styles.emptySubtitle}>
        Adicione suas lojas favoritas para começar a pesquisar preços
      </Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/stores/new')}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.addButtonText}>Adicionar Loja</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeContainer hasTabBar={true}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Carregando lojas...</Text>
        </View>
      </SafeContainer>
    );
  }

  return (
    <SafeContainer style={styles.container} hasTabBar={true}>
      <View style={styles.header}>
        <Text style={styles.title}>Minhas Lojas</Text>
        <TouchableOpacity
          style={styles.addStoreButton}
          onPress={() => router.push('/stores/new')}
        >
          <Ionicons name="add" size={20} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={stores}
        renderItem={renderStoreItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  addStoreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f8f1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  listContainer: {
    padding: 20,
    flexGrow: 1,
  },
  storeItem: {
    backgroundColor: '#ffffff',
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
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    alignItems: 'center',
    gap: 8,
  },
  searchButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f8f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});