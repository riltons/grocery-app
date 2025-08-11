import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ListsService } from '../../lib/lists';
import ListCard from '../../components/ListCard';
import CreateListModal from '../../components/CreateListModal';
import SafeContainer from '../../components/SafeContainer';
import SafeFAB from '../../components/SafeFAB';
import type { List } from '../../lib/supabase';

export default function HomeTab() {
  const { user } = useAuth();
  const { showError } = useToast();
  const router = useRouter();
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const loadLists = useCallback(async () => {
    try {
      const { data, error } = await ListsService.getUserLists();
      if (error) {
        showError('Erro', 'Erro ao carregar listas');
      } else {
        setLists(data || []);
      }
    } catch (error) {
      showError('Erro', 'Ocorreu um erro inesperado');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadLists();
  };

  const renderListItem = ({ item }: { item: List }) => (
    <ListCard list={item} />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="list-outline" size={64} color="#cbd5e1" />
      <Text style={styles.emptyTitle}>Nenhuma lista ainda</Text>
      <Text style={styles.emptySubtitle}>
        Crie sua primeira lista de compras para começar
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.createButtonText}>Criar Lista</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeContainer hasTabBar={true}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </SafeContainer>
    );
  }

  return (
    <SafeContainer style={styles.container} hasTabBar={true}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Minhas Listas</Text>
          <Text style={styles.subtitle}>Olá, {user?.email?.split('@')[0]}</Text>
        </View>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => router.push('/profile')}
        >
          <Ionicons name="menu-outline" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={lists}
        renderItem={renderListItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          lists.length > 0 && { paddingBottom: 88 }
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {lists.length > 0 && (
        <SafeFAB onPress={() => setModalVisible(true)} />
      )}

      <CreateListModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={loadLists}
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
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  menuButton: {
    padding: 8,
  },
  listContainer: {
    padding: 20,
    flexGrow: 1,
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
  createButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});