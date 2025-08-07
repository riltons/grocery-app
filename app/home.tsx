import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ListsService } from '../lib/lists';
import ListCard from '../components/ListCard';
import CreateListModal from '../components/CreateListModal';
import SafeContainer from '../components/SafeContainer';
import SafeFAB from '../components/SafeFAB';
import ConfirmDialog from '../components/ConfirmDialog';
import type { List } from '../lib/supabase';

export default function Home() {
  const { user, signOut } = useAuth();
  const { showError, showSuccess } = useToast();
  const router = useRouter();
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

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

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = async () => {
    try {
      setLoggingOut(true);
      await signOut();
      showSuccess('Até logo!', 'Você foi desconectado com sucesso');
      router.replace('/');
    } catch (error) {
      showError('Erro', 'Não foi possível fazer logout');
    } finally {
      setLoggingOut(false);
      setShowLogoutDialog(false);
    }
  };

  const cancelLogout = () => {
    setShowLogoutDialog(false);
  };

  const renderListItem = ({ item }: { item: List }) => (
    <ListCard list={item} />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>Nenhuma lista ainda</Text>
      <Text style={styles.emptySubtitle}>
        Crie sua primeira lista de compras para começar
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.createButtonText}>Criar Lista</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <SafeContainer style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Minhas Listas</Text>
          <Text style={styles.subtitle}>Olá, {user?.email?.split('@')[0]}</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.productsButton} 
            onPress={() => router.push('/product')}
          >
            <Ionicons name="basket-outline" size={20} color="#4CAF50" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.storesButton} 
            onPress={() => router.push('/stores')}
          >
            <Ionicons name="storefront-outline" size={20} color="#4CAF50" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Sair</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={lists}
        renderItem={renderListItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          lists.length > 0 && { paddingBottom: 88 } // Espaço extra para o FAB quando há listas
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

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        visible={showLogoutDialog}
        title="Sair"
        message="Tem certeza que deseja sair?"
        confirmText="Sair"
        cancelText="Cancelar"
        confirmColor="#ef4444"
        icon="log-out"
        iconColor="#ef4444"
        loading={loggingOut}
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
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
    backgroundColor: '#f8fafc',
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productsButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4CAF50',
    marginRight: 8,
  },
  storesButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4CAF50',
    marginRight: 8,
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
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  logoutButtonText: {
    fontSize: 14,
    color: '#64748b',
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
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});