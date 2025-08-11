import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeContainer from '../../../components/SafeContainer';
import { useToast } from '../../../context/ToastContext';
import { PriceSearchService } from '../../../lib/priceSearch';
import { StoreService } from '../../../lib/stores';
import type { PriceSearchSession, Store } from '../../../lib/supabase';

type SessionWithStats = PriceSearchSession & {
  itemCount: number;
  totalValue: number;
  averagePrice: number;
};

export default function SearchHistoryScreen() {
  const params = useLocalSearchParams<{ storeId: string }>();
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const insets = useSafeAreaInsets();
  const [store, setStore] = useState<Store | null>(null);
  const [sessions, setSessions] = useState<SessionWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.storeId) {
      loadData();
    }
  }, [params.storeId]);

  const loadData = async () => {
    if (!params.storeId) return;

    try {
      setLoading(true);

      // Carregar dados da loja
      const { data: storeData, error: storeError } = await StoreService.getStoreById(params.storeId);
      if (storeError || !storeData) {
        showError('Erro', 'Não foi possível carregar os dados da loja');
        return;
      }
      setStore(storeData);

      // Carregar sessões de pesquisa
      const { data: sessionsData, error: sessionsError } = await PriceSearchService.getStoreSessions(params.storeId, 50);
      if (sessionsError) {
        showError('Erro', 'Não foi possível carregar o histórico de pesquisas');
        return;
      }

      // Carregar estatísticas para cada sessão
      const sessionsWithStats: SessionWithStats[] = [];
      
      for (const session of sessionsData || []) {
        const { data: items } = await PriceSearchService.getSessionItems(session.id);
        
        const itemCount = items?.length || 0;
        const itemsWithPrice = items?.filter(item => item.price !== null) || [];
        const totalValue = itemsWithPrice.reduce((sum, item) => sum + (item.price || 0), 0);
        const averagePrice = itemsWithPrice.length > 0 ? totalValue / itemsWithPrice.length : 0;

        sessionsWithStats.push({
          ...session,
          itemCount,
          totalValue,
          averagePrice,
        });
      }

      setSessions(sessionsWithStats);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showError('Erro', 'Ocorreu um erro ao carregar os dados');
    } finally {
      setLoading(false);
    }
  };

  const handleViewSession = (sessionId: string) => {
    router.push(`/stores/session/${sessionId}`);
  };

  const handleDeleteSession = (session: SessionWithStats) => {
    Alert.alert(
      'Excluir Pesquisa',
      `Tem certeza que deseja excluir a pesquisa "${session.name}"? Esta ação não pode ser desfeita.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => deleteSession(session.id),
        },
      ]
    );
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const { error } = await PriceSearchService.deleteSession(sessionId);
      
      if (error) {
        showError('Erro', 'Não foi possível excluir a pesquisa');
        return;
      }

      showSuccess('Pesquisa excluída com sucesso');
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (error) {
      console.error('Erro ao excluir sessão:', error);
      showError('Erro', 'Ocorreu um erro ao excluir a pesquisa');
    }
  };

  const renderSessionItem = ({ item }: { item: SessionWithStats }) => (
    <TouchableOpacity
      style={styles.sessionItem}
      onPress={() => handleViewSession(item.id)}
    >
      <View style={styles.sessionHeader}>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionName}>{item.name}</Text>
          <Text style={styles.sessionDate}>
            {new Date(item.created_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        
        <View style={styles.sessionActions}>
          <View style={[styles.statusBadge, item.is_active ? styles.activeBadge : styles.inactiveBadge]}>
            <Text style={[styles.statusText, item.is_active ? styles.activeText : styles.inactiveText]}>
              {item.is_active ? 'Ativa' : 'Finalizada'}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteSession(item)}
          >
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sessionStats}>
        <View style={styles.statItem}>
          <Ionicons name="basket-outline" size={16} color="#64748b" />
          <Text style={styles.statText}>{item.itemCount} itens</Text>
        </View>
        
        {item.totalValue > 0 && (
          <>
            <View style={styles.statItem}>
              <Ionicons name="cash-outline" size={16} color="#64748b" />
              <Text style={styles.statText}>R$ {item.totalValue.toFixed(2)}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="trending-up-outline" size={16} color="#64748b" />
              <Text style={styles.statText}>Média: R$ {item.averagePrice.toFixed(2)}</Text>
            </View>
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Carregando histórico...</Text>
        </View>
      </SafeContainer>
    );
  }

  return (
    <SafeContainer style={{ paddingBottom: 0 }}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Histórico de Pesquisas</Text>
          {store && (
            <TouchableOpacity
              onPress={() => router.push(`/stores/${store.id}`)}
            >
              <Text style={styles.headerSubtitle}>{store.name}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {sessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>Nenhuma pesquisa encontrada</Text>
            <Text style={styles.emptySubtitle}>
              As pesquisas de preços realizadas nesta loja aparecerão aqui
            </Text>
            
            <TouchableOpacity
              style={styles.startSearchButton}
              onPress={() => router.push({
                pathname: '/stores/price-search',
                params: {
                  storeId: params.storeId,
                  storeName: store?.name || '',
                }
              })}
            >
              <Ionicons name="barcode-outline" size={20} color="#fff" />
              <Text style={styles.startSearchButtonText}>Iniciar Pesquisa</Text>
            </TouchableOpacity>
            
            {/* Bottom Spacer */}
            <View style={{ height: Math.max(100, insets.bottom + 100) }} />
          </View>
        ) : (
          <FlatList
            data={sessions}
            renderItem={renderSessionItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.sessionsList, { paddingBottom: Math.max(100, insets.bottom + 100) }]}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
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
    fontSize: 20,
    fontWeight: '600',
    color: '#475569',
    marginTop: 24,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 24,
  },
  startSearchButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 32,
  },
  startSearchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  sessionsList: {
    padding: 20,
    flexGrow: 1,
  },
  sessionItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sessionInfo: {
    flex: 1,
    marginRight: 8,
  },
  sessionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  sessionDate: {
    fontSize: 14,
    color: '#64748b',
  },
  sessionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeBadge: {
    backgroundColor: '#dcfce7',
  },
  inactiveBadge: {
    backgroundColor: '#f1f5f9',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  activeText: {
    color: '#16a34a',
  },
  inactiveText: {
    color: '#64748b',
  },
  deleteButton: {
    padding: 6,
    borderRadius: 4,
  },
  sessionStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: '#64748b',
  },
});