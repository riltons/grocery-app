import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { ListService } from '../lib/lists';

// Tipo para as listas de compras
type ShoppingList = {
  id: string;
  name: string;
  description: string;
  created_at: string;
  total_items?: number;
};

export default function Home() {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();

  // Função para buscar as listas do usuário
  const fetchLists = async () => {
    try {
      setLoading(true);
      const { data, error } = await ListService.getLists();
      
      if (error) {
        Alert.alert('Erro', 'Não foi possível carregar suas listas');
      } else if (data) {
        setLists(data);
      }
    } catch (error) {
      console.error('Erro ao buscar listas:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao carregar suas listas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Carregar listas quando o componente montar
  useEffect(() => {
    fetchLists();
  }, []);

  // Função para atualizar a lista (pull-to-refresh)
  const handleRefresh = () => {
    setRefreshing(true);
    fetchLists();
  };

  // Função para criar uma nova lista
  const handleCreateList = () => {
    router.push('/list/new');
  };

  // Função para visualizar detalhes de uma lista
  const handleViewList = (listId: string) => {
    router.push(`/list/${listId}`);
  };

  // Função para fazer logout
  const handleLogout = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        Alert.alert('Erro', 'Não foi possível sair da conta');
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  // Renderizar cada item da lista
  const renderListItem = ({ item }: { item: ShoppingList }) => (
    <TouchableOpacity 
      style={styles.listItem} 
      onPress={() => handleViewList(item.id)}
    >
      <View style={styles.listItemContent}>
        <Text style={styles.listItemTitle}>{item.name}</Text>
        {item.description && (
          <Text style={styles.listItemDescription} numberOfLines={1}>
            {item.description}
          </Text>
        )}
        <Text style={styles.listItemDate}>
          {new Date(item.created_at).toLocaleDateString('pt-BR')}
        </Text>
      </View>
      <View style={styles.listItemRight}>
        <Text style={styles.listItemCount}>
          {item.total_items || 0} itens
        </Text>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <Text style={styles.title}>Minhas Listas</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            onPress={() => router.push('/product')} 
            style={styles.headerButton}
          >
            <Ionicons name="pricetag-outline" size={24} color="#4CAF50" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.headerButton}>
            <Ionicons name="log-out-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Carregando listas...</Text>
        </View>
      ) : lists.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="basket-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Você ainda não tem listas</Text>
          <Text style={styles.emptySubtext}>Crie sua primeira lista de compras</Text>
        </View>
      ) : (
        <FlatList
          data={lists}
          renderItem={renderListItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}

      <TouchableOpacity 
        style={styles.fab} 
        onPress={handleCreateList}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  listContainer: {
    paddingBottom: 80,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  listItemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  listItemDate: {
    fontSize: 12,
    color: '#999',
  },
  listItemRight: {
    alignItems: 'flex-end',
  },
  listItemCount: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    marginBottom: 4,
  },
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 16,
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    backgroundColor: '#4CAF50',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});