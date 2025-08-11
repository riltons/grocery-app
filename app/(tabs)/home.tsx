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
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ListsService } from '../../lib/lists';
import ListCard from '../../components/ListCard';
import CreateListModal from '../../components/CreateListModal';
import EditListModal from '../../components/EditListModal';
import SafeContainer from '../../components/SafeContainer';
import SafeFAB from '../../components/SafeFAB';
import type { List } from '../../lib/supabase';

export default function HomeTab() {
  const { user } = useAuth();
  const { showError } = useToast();
  const router = useRouter();
  const [pendingLists, setPendingLists] = useState<List[]>([]);
  const [finishedLists, setFinishedLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedList, setSelectedList] = useState<List | null>(null);
  const [showFinished, setShowFinished] = useState(false);

  const loadLists = useCallback(async () => {
    try {
      const [pendingResult, finishedResult] = await Promise.all([
        ListsService.getPendingLists(),
        ListsService.getFinishedLists()
      ]);

      if (pendingResult.error) {
        showError('Erro', 'Erro ao carregar listas pendentes');
      } else {
        setPendingLists(pendingResult.data || []);
      }

      if (finishedResult.error) {
        showError('Erro', 'Erro ao carregar listas finalizadas');
      } else {
        setFinishedLists(finishedResult.data || []);
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

  // Recarregar listas quando a tela voltar ao foco (após criar/clonar listas)
  useFocusEffect(
    useCallback(() => {
      loadLists();
    }, [loadLists])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadLists();
  };

  const handleEditList = (list: List) => {
    setSelectedList(list);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async (newName: string) => {
    if (!selectedList) return;

    try {
      const { error } = await ListsService.updateList(selectedList.id, newName);
      if (error) {
        showError('Erro', 'Erro ao atualizar lista');
      } else {
        loadLists();
        setEditModalVisible(false);
        setSelectedList(null);
      }
    } catch (error) {
      showError('Erro', 'Ocorreu um erro inesperado');
    }
  };

  const handleDeleteList = async (list: List) => {
    try {
      const { error } = await ListsService.deleteList(list.id);
      if (error) {
        showError('Erro', 'Erro ao excluir lista');
      } else {
        loadLists();
      }
    } catch (error) {
      showError('Erro', 'Ocorreu um erro inesperado');
    }
  };

  const renderListItem = ({ item }: { item: List }) => (
    <ListCard 
      list={item} 
      showActions={true}
      onEdit={handleEditList}
      onDelete={handleDeleteList}
    />
  );

  const renderEmptyState = (isFinished: boolean) => (
    <View style={styles.emptyState}>
      <Ionicons 
        name={isFinished ? "checkmark-circle-outline" : "list-outline"} 
        size={64} 
        color="#cbd5e1" 
      />
      <Text style={styles.emptyTitle}>
        {isFinished ? 'Nenhuma lista finalizada' : 'Nenhuma lista pendente'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {isFinished 
          ? 'Finalize suas listas para vê-las aqui'
          : 'Crie sua primeira lista de compras para começar'
        }
      </Text>
      {!isFinished && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.createButtonText}>Criar Lista</Text>
        </TouchableOpacity>
      )}
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

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, !showFinished && styles.activeTab]}
          onPress={() => setShowFinished(false)}
        >
          <Text style={[styles.tabText, !showFinished && styles.activeTabText]}>
            Pendentes ({pendingLists.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, showFinished && styles.activeTab]}
          onPress={() => setShowFinished(true)}
        >
          <Text style={[styles.tabText, showFinished && styles.activeTabText]}>
            Finalizadas ({finishedLists.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={showFinished ? finishedLists : pendingLists}
        renderItem={renderListItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          (pendingLists.length > 0 || finishedLists.length > 0) && { paddingBottom: 88 }
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={() => renderEmptyState(showFinished)}
        showsVerticalScrollIndicator={false}
      />

      {(pendingLists.length > 0 || finishedLists.length > 0) && (
        <SafeFAB onPress={() => setModalVisible(true)} />
      )}

      <CreateListModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={loadLists}
      />

      <EditListModal
        visible={editModalVisible}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedList(null);
        }}
        onSave={handleSaveEdit}
        currentName={selectedList?.name || ''}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#4CAF50',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#ffffff',
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