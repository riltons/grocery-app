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
import { supabase } from '../../lib/supabase';

import ListCard from '../../components/ListCard';
import SharedListCard from '../../components/SharedListCard';
import CreateListModal from '../../components/CreateListModal';
import EditListModal from '../../components/EditListModal';
import InvitationModal from '../../components/InvitationModal';
import SafeContainer from '../../components/SafeContainer';
import SafeFAB from '../../components/SafeFAB';
import type { List } from '../../lib/supabase';


export default function HomeTab() {
  const { user } = useAuth();
  const { showError } = useToast();
  const router = useRouter();
  const [pendingLists, setPendingLists] = useState<List[]>([]);
  const [finishedLists, setFinishedLists] = useState<List[]>([]);
  const [sharedLists, setSharedLists] = useState<SharedList[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [invitationModalVisible, setInvitationModalVisible] = useState(false);
  const [selectedList, setSelectedList] = useState<List | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'finished' | 'shared'>('pending');

  const loadLists = useCallback(async () => {
    try {
      const [pendingResult, finishedResult, sharedResult] = await Promise.all([
        ListsService.getPendingLists(),
        ListsService.getFinishedLists(),
        loadSharedLists()
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

      setSharedLists(sharedResult);
    } catch (error) {
      showError('Erro', 'Ocorreu um erro inesperado');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadSharedLists = async (): Promise<List[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: sharedLists, error } = await supabase
        .from('list_shares')
        .select(`
          list_id,
          permission,
          created_at,
          lists!inner(
            id,
            name,
            created_at,
            updated_at,
            user_id,
            status,
            items_count
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // Converter para o formato esperado
      const formattedLists: List[] = (sharedLists || []).map(share => ({
        ...share.lists,
        shared_by: 'Usuário compartilhou',
        permission: share.permission,
        is_shared: true
      } as any));

      return formattedLists;
    } catch (error) {
      console.error('Erro ao carregar listas compartilhadas:', error);
      return [];
    }
  };

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

  const handleLeaveSharedList = async (list: List) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('list_shares')
        .delete()
        .eq('list_id', list.id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // Remove da lista local
      setSharedLists(prev => prev.filter(l => l.id !== list.id));
      showSuccess('Sucesso', 'Você saiu da lista compartilhada');
    } catch (error) {
      showError('Erro', error instanceof Error ? error.message : 'Não foi possível sair da lista');
    }
  };

  const renderListItem = ({ item }: { item: List }) => {
    if (activeTab === 'shared') {
      return (
        <SharedListCard 
          list={item as any} 
          onLeave={handleLeaveSharedList}
        />
      );
    }
    
    return (
      <ListCard 
        list={item} 
        showActions={true}
        onEdit={handleEditList}
        onDelete={handleDeleteList}
      />
    );
  };

  const renderEmptyState = (tab: 'pending' | 'finished' | 'shared') => {
    const config = {
      pending: {
        icon: "list-outline",
        title: "Nenhuma lista pendente",
        subtitle: "Crie sua primeira lista de compras para começar",
        showButton: true
      },
      finished: {
        icon: "checkmark-circle-outline",
        title: "Nenhuma lista finalizada",
        subtitle: "Finalize suas listas para vê-las aqui",
        showButton: false
      },
      shared: {
        icon: "people-outline",
        title: "Nenhuma lista compartilhada",
        subtitle: "Quando alguém compartilhar uma lista com você, ela aparecerá aqui",
        showButton: false
      }
    };

    const current = config[tab];

    return (
      <View style={styles.emptyState}>
        <Ionicons 
          name={current.icon as any} 
          size={64} 
          color="#cbd5e1" 
        />
        <Text style={styles.emptyTitle}>
          {current.title}
        </Text>
        <Text style={styles.emptySubtitle}>
          {current.subtitle}
        </Text>
        {current.showButton && (
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
  };

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
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.invitationButton}
            onPress={() => setInvitationModalVisible(true)}
          >
            <Ionicons name="mail-outline" size={20} color="#4CAF50" />
            {/* Badge será mostrado apenas quando houver convites reais */}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => router.push('/profile')}
          >
            <Ionicons name="menu-outline" size={24} color="#4CAF50" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            Minhas ({pendingLists.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'shared' && styles.activeTab]}
          onPress={() => setActiveTab('shared')}
        >
          <Text style={[styles.tabText, activeTab === 'shared' && styles.activeTabText]}>
            Compartilhadas ({sharedLists.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'finished' && styles.activeTab]}
          onPress={() => setActiveTab('finished')}
        >
          <Text style={[styles.tabText, activeTab === 'finished' && styles.activeTabText]}>
            Finalizadas ({finishedLists.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={
          activeTab === 'pending' ? pendingLists :
          activeTab === 'shared' ? sharedLists :
          finishedLists
        }
        renderItem={renderListItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          (pendingLists.length > 0 || finishedLists.length > 0 || sharedLists.length > 0) && { paddingBottom: 88 }
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={() => renderEmptyState(activeTab)}
        showsVerticalScrollIndicator={false}
      />

      {(pendingLists.length > 0 || finishedLists.length > 0 || sharedLists.length > 0) && activeTab !== 'shared' && (
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

      <InvitationModal
        visible={invitationModalVisible}
        onClose={() => setInvitationModalVisible(false)}
        onSuccess={() => {
          loadLists(); // Recarregar listas após aceitar convite
        }}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  invitationButton: {
    position: 'relative',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
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