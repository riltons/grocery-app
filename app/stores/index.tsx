import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  TextInput,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { StoreService } from '../../lib/stores';
import SafeContainer from '../../components/SafeContainer';
import type { Store } from '../../lib/supabase';

export default function StoresList() {
  const router = useRouter();
  
  // Estados para gerenciar os dados
  const [stores, setStores] = useState<Store[]>([]);
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  
  // Carregar lojas
  const fetchStores = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await StoreService.getStores();
      
      if (error) {
        console.error('Erro ao buscar lojas:', error);
        Alert.alert('Erro', 'Não foi possível carregar as lojas');
        return;
      }
      
      if (data) {
        setStores(data);
        setFilteredStores(data);
      }
    } catch (error) {
      console.error('Erro ao buscar lojas:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao carregar as lojas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Carregar lojas quando o componente montar
  useEffect(() => {
    fetchStores();
  }, []);
  
  // Filtrar lojas quando o texto de busca mudar
  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredStores(stores);
    } else {
      const filtered = stores.filter(store =>
        store.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (store.address && store.address.toLowerCase().includes(searchText.toLowerCase()))
      );
      setFilteredStores(filtered);
    }
  }, [searchText, stores]);
  
  // Função para atualizar a lista (pull-to-refresh)
  const handleRefresh = () => {
    setRefreshing(true);
    fetchStores();
  };
  
  // Navegar para a tela de detalhes da loja
  const handleStorePress = (storeId: string) => {
    router.push(`/stores/${storeId}`);
  };

  // Navegar para criar nova loja
  const handleCreateStore = () => {
    router.push('/stores/new');
  };
  
  // Renderizar cada item da lista
  const renderStoreItem = ({ item }: { item: Store }) => (
    <TouchableOpacity 
      style={styles.storeItem}
      onPress={() => handleStorePress(item.id)}
    >
      <View style={styles.storeIcon}>
        <Ionicons name="storefront" size={24} color="#4CAF50" />
      </View>
      <View style={styles.storeInfo}>
        <Text style={styles.storeName}>{item.name}</Text>
        {item.address && (
          <Text style={styles.storeAddress} numberOfLines={1}>
            {item.address}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );
  
  return (
    <SafeContainer style={styles.container}>
      <StatusBar style="dark" />
      
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
          onPress={handleCreateStore}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar lojas..."
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Carregando lojas...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredStores}
          renderItem={renderStoreItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.storeList}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="storefront-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>
                {searchText.length > 0 
                  ? 'Nenhuma loja encontrada'
                  : 'Nenhuma loja cadastrada'}
              </Text>
              {searchText.length === 0 && (
                <TouchableOpacity 
                  style={styles.emptyButton}
                  onPress={handleCreateStore}
                >
                  <Text style={styles.emptyButtonText}>Adicionar Loja</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  storeList: {
    padding: 16,
  },
  storeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
  },
  storeAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});