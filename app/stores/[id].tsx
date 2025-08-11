import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeContainer from '../../components/SafeContainer';
import ProductImage from '../../components/ProductImage';
import { useToast } from '../../context/ToastContext';
import { StoreService } from '../../lib/stores';
import type { Store } from '../../lib/supabase';

type StoreStats = {
  totalProducts: number;
  totalSpent: number;
  averagePrice: number;
  lastVisit: string | null;
  priceEntries: number;
};

type ProductWithPrice = {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  image_url?: string;
  latest_price: number;
  latest_date: string;
  generic_products?: {
    name: string;
    categories?: {
      name: string;
    };
  };
};

export default function StoreDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { showError } = useToast();
  const insets = useSafeAreaInsets();
  const [store, setStore] = useState<Store | null>(null);
  const [stats, setStats] = useState<StoreStats | null>(null);
  const [products, setProducts] = useState<ProductWithPrice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadStoreData();
    }
  }, [params.id]);

  const loadStoreData = async () => {
    if (!params.id) return;

    try {
      setLoading(true);

      // Carregar dados da loja
      const { data: storeData, error: storeError } = await StoreService.getStoreById(params.id);
      if (storeError || !storeData) {
        showError('Erro', 'Não foi possível carregar os dados da loja');
        return;
      }
      setStore(storeData);

      // Carregar estatísticas
      const { data: statsData } = await StoreService.getStoreStats(params.id);
      if (statsData) {
        setStats(statsData);
      }

      // Carregar produtos
      const { data: productsData } = await StoreService.getStoreProducts(params.id);
      if (productsData) {
        setProducts(productsData);
      }

    } catch (error) {
      console.error('Erro ao carregar dados da loja:', error);
      showError('Erro', 'Ocorreu um erro ao carregar os dados da loja');
    } finally {
      setLoading(false);
    }
  };

  const handleStartPriceSearch = () => {
    if (!store) return;
    
    router.push({
      pathname: '/stores/price-search',
      params: {
        storeId: store.id,
        storeName: store.name,
      }
    });
  };

  const handleViewHistory = () => {
    if (!store) return;
    
    router.push(`/stores/sessions/${store.id}`);
  };

  const handleViewSearchHistory = () => {
    if (!store) return;
    
    router.push(`/stores/search-history/${store.id}`);
  };

  const renderProductItem = ({ item }: { item: ProductWithPrice }) => (
    <View style={styles.productItem}>
      <ProductImage 
        imageUrl={item.image_url}
        size="medium"
        style={styles.productItemImage}
      />
      
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        {item.brand && (
          <Text style={styles.productBrand}>{item.brand}</Text>
        )}
        {item.generic_products?.categories?.name && (
          <Text style={styles.productCategory}>
            {item.generic_products.categories.name}
          </Text>
        )}
        <Text style={styles.productDate}>
          Última atualização: {new Date(item.latest_date).toLocaleDateString('pt-BR')}
        </Text>
      </View>
      <View style={styles.priceContainer}>
        <Text style={styles.price}>R$ {item.latest_price.toFixed(2)}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </SafeContainer>
    );
  }

  if (!store) {
    return (
      <SafeContainer>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Loja não encontrada</Text>
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
          <Text style={styles.headerTitle}>{store.name}</Text>
          {store.address && (
            <Text style={styles.headerSubtitle}>{store.address}</Text>
          )}
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.priceSearchButton}
            onPress={handleStartPriceSearch}
          >
            <Ionicons name="barcode-outline" size={24} color="#fff" />
            <Text style={styles.priceSearchButtonText}>Pesquisar Preços</Text>
          </TouchableOpacity>
          
          <View style={styles.secondaryButtons}>
            <TouchableOpacity
              style={styles.historyButton}
              onPress={handleViewHistory}
            >
              <Ionicons name="receipt-outline" size={18} color="#4CAF50" />
              <Text style={styles.historyButtonText}>Histórico</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.searchHistoryButton}
              onPress={handleViewSearchHistory}
            >
              <Ionicons name="search-outline" size={18} color="#4CAF50" />
              <Text style={styles.searchHistoryButtonText}>Pesquisas</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Statistics */}
        {stats && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Estatísticas</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalProducts}</Text>
                <Text style={styles.statLabel}>Produtos</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>R$ {stats.totalSpent.toFixed(2)}</Text>
                <Text style={styles.statLabel}>Total Gasto</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>R$ {stats.averagePrice.toFixed(2)}</Text>
                <Text style={styles.statLabel}>Preço Médio</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.priceEntries}</Text>
                <Text style={styles.statLabel}>Registros</Text>
              </View>
            </View>
            {stats.lastVisit && (
              <Text style={styles.lastVisit}>
                Última visita: {new Date(stats.lastVisit).toLocaleDateString('pt-BR')}
              </Text>
            )}
          </View>
        )}

        {/* Products List */}
        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>
            Produtos com Preços ({products.length})
          </Text>
          
          {products.length === 0 ? (
            <View style={styles.emptyProducts}>
              <Ionicons name="basket-outline" size={48} color="#ccc" />
              <Text style={styles.emptyProductsText}>
                Nenhum produto com preço registrado
              </Text>
              <Text style={styles.emptyProductsSubtext}>
                Use a pesquisa de preços para começar a registrar
              </Text>
            </View>
          ) : (
            <FlatList
              data={products}
              renderItem={renderProductItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              style={styles.productsList}
            />
          )}
        </View>
        
        {/* Bottom Spacer */}
        <View style={[styles.bottomSpacer, { height: Math.max(80, insets.bottom + 80) }]} />
      </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
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
  scrollContent: {
    flexGrow: 1,
  },
  actionSection: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 12,
  },
  priceSearchButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  priceSearchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  historyButton: {
    flex: 1,
    backgroundColor: '#f0f8f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4CAF50',
    minHeight: 44,
  },
  historyButtonText: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
    textAlign: 'center',
  },
  searchHistoryButton: {
    flex: 1,
    backgroundColor: '#f0f8f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4CAF50',
    minHeight: 44,
  },
  searchHistoryButtonText: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
    textAlign: 'center',
  },
  statsSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  lastVisit: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },
  productsSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  bottomSpacer: {
    // Height será definido dinamicamente no componente
  },
  emptyProducts: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyProductsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyProductsSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
  },
  productsList: {
    marginTop: 8,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginBottom: 8,
  },
  productItemImage: {
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 2,
  },
  productBrand: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  productCategory: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 2,
  },
  productDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
});