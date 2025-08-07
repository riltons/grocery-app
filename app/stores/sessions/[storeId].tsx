import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import SafeContainer from '../../../components/SafeContainer';
import { useToast } from '../../../context/ToastContext';
import { PriceSearchService } from '../../../lib/priceSearch';
import { supabase } from '../../../lib/supabase';
import type { PriceSearchSession, Store } from '../../../lib/supabase';

type SessionWithStats = PriceSearchSession & {
  itemCount: number;
  totalValue: number;
  itemsWithPrice: number;
};

export default function StoreSessionsScreen() {
  const params = useLocalSearchParams<{ storeId: string }>();
  const router = useRouter();
  const { showError } = useToast();
  
  const [store, setStore] = useState<Store | null>(null);
  const [sessions, setSessions] = useState<SessionWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('id', params.storeId)
        .single();

      if (storeError) {
        showError('Erro', 'Não foi possível carregar os dados da loja');
        return;
      }

      setStore(storeData);

      // Carregar sessões da loja
      const { data: sessionsData } = await PriceSearchService.getStoreSessions(params.storeId, 50);
      
      if (sessionsData) {
        // Carregar estatísticas para cada sessão
        const sessionsWithStats = await Promise.all(
          sessionsData.map(async (session) => {
            const { data: items } = await PriceSearchService.getSessionItems(session.id);
            
            const itemCount = items?.length || 0;
            const itemsWithPrice = items?.filter(item => item.price && item.price > 0).length || 0;
            const totalValue = items?.reduce((sum, item) => sum + (item.price || 0), 0) || 0;

            return {
              ...session,
              itemCount,
              itemsWithPrice,
              totalValue,
            };
          })
        );

        setSessions(sessionsWithStats);
      }

    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
      showError('Erro', 'Ocorreu um erro ao carregar as sessões');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSessionPress = (session: SessionWithStats) => {
    router.push(`/stores/session/${session.id}`);
  };

  const renderSessionItem = ({ item }: { item: SessionWithStats }) => (
    <TouchableOpacity
      style={styles.sessionItem}
      onPress={() => handleSessionPress(item)}
    >
      <View style={styles.sessionIcon}>
        <Ionicons 
          name={item.is_active ? "time-outline" : "receipt-outline"} 
          size={24} 
          color={item.is_active ? "#f59e0b" : "#4CAF50"} 
        />
      </View>
      
      <View style={styles.sessionInfo}>
        <Text style={styles.sessionName}>{item.name}</Text>
        <Text style={styles.sessionDate}>
          {new Date(item.created_at).toLocaleDateString('pt-BR')} às {' '}
          {new Date(item.created_at).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
        
        <View style={styles.sessionStats}>
          <View style={styles.statItem}>
            <Ionicons name="cube-outline" size={14} color="#64748b" />
            <Text style={styles.statText}>{item.itemCount} produtos</Text>
          </View>
          
          {item.itemsWithPrice > 0 && (
            <View style={styles.statItem}>
              <Ionicons name="pricetag-outline" size={14} color="#64748b" />
              <Text style={styles.statText}>{item.itemsWithPrice} com preço</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.sessionValue}>
        {item.totalValue > 0 ? (
          <>
            <Text style={styles.totalValue}>R$ {item.totalValue.toFixed(2)}</Text>
            <Text style={styles.statusText}>
              {item.is_active ? 'Em andamento' : 'Finalizada'}
            </Text>
          </>
        ) : (
          <Text style={styles.noValue}>Sem preços</Text>
        )}
        
        <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Carregando sessões...</Text>
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
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Histórico de Pesquisas</Text>
          {store && (
            <Text style={styles.headerSubtitle}>{store.name}</Text>
          )}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {sessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>Nenhuma pesquisa realizada</Text>
            <Text style={styles.emptySubtitle}>
              As pesquisas de preços finalizadas aparecerão aqui
            </Text>
          </View>
        ) : (
          <FlatList
            data={sessions}
            renderItem={renderSessionItem}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={handleRefresh}
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
  list: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  sessionItem: {
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
  sessionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sessionInfo: {
    flex: 1,
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
    marginBottom: 8,
  },
  sessionStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  sessionValue: {
    alignItems: 'flex-end',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 2,
  },
  statusText: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  noValue: {
    fontSize: 14,
    color: '#94a3b8',
    fontStyle: 'italic',
    marginBottom: 4,
  },
});