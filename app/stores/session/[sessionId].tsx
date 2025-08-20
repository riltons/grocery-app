import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import SafeContainer from '../../../components/SafeContainer';
import ProductImage from '../../../components/ProductImage';
import { useToast } from '../../../context/ToastContext';
import { PriceSearchService } from '../../../lib/priceSearch';
import { supabase } from '../../../lib/supabase';
import type { PriceSearchSession, PriceSearchItem, SpecificProduct, Store } from '../../../lib/supabase';

type SessionItemWithProduct = PriceSearchItem & {
  specific_products: SpecificProduct;
};

export default function SessionDetailScreen() {
  const params = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  
  const [session, setSession] = useState<PriceSearchSession | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [items, setItems] = useState<SessionItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.sessionId) {
      loadSessionData();
    }
  }, [params.sessionId]);

  const loadSessionData = async () => {
    if (!params.sessionId) return;

    try {
      setLoading(true);

      // Carregar dados da sessão
      const { data: sessionData, error: sessionError } = await supabase
        .from('price_search_sessions')
        .select(`
          *,
          stores (
            id,
            name,
            address
          )
        `)
        .eq('id', params.sessionId)
        .single();

      if (sessionError) {
        showError('Erro', 'Não foi possível carregar os dados da sessão');
        return;
      }

      setSession(sessionData);
      setStore(sessionData.stores);

      // Carregar itens da sessão
      const { data: itemsData } = await PriceSearchService.getSessionItems(params.sessionId);
      
      if (itemsData) {
        setItems(itemsData as SessionItemWithProduct[]);
      }

    } catch (error) {
      console.error('Erro ao carregar sessão:', error);
      showError('Erro', 'Ocorreu um erro ao carregar a sessão');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!session || !store) return;

    const itemsWithPrice = items.filter(item => item.price && item.price > 0);
    const total = itemsWithPrice.reduce((sum, item) => sum + (item.price || 0), 0);
    
    const shareText = `📋 ${session.name}
🏪 ${store.name}
📅 ${new Date(session.created_at).toLocaleDateString('pt-BR')}

📦 Produtos (${itemsWithPrice.length}):
${itemsWithPrice.map(item => 
  `• ${item.specific_products.name}${item.specific_products.brand ? ` - ${item.specific_products.brand}` : ''}: R$ ${(item.price || 0).toFixed(2)}`
).join('\n')}

💰 Total: R$ ${total.toFixed(2)}

Criado com o app de Lista de Compras`;

    try {
      await Share.share({
        message: shareText,
        title: `Pesquisa de Preços - ${store.name}`,
      });
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  };

  const renderItem = ({ item }: { item: SessionItemWithProduct }) => (
    <View style={styles.itemContainer}>
      <ProductImage 
        imageUrl={item.specific_products.image_url}
        size="medium"
        style={styles.productImage}
      />
      
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.specific_products?.name || 'Produto sem nome'}</Text>
        {item.specific_products?.brand && (
          <Text style={styles.productBrand}>{item.specific_products.brand}</Text>
        )}
        {item.specific_products?.barcode && (
          <Text style={styles.productBarcode}>Código: {item.specific_products.barcode}</Text>
        )}
        <Text style={styles.scanDate}>
          Escaneado em {new Date(item.created_at).toLocaleDateString('pt-BR')} às {new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>

      <View style={styles.priceContainer}>
        {item.price ? (
          <Text style={styles.price}>R$ {item.price.toFixed(2)}</Text>
        ) : (
          <Text style={styles.noPrice}>Sem preço</Text>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Carregando sessão...</Text>
        </View>
      </SafeContainer>
    );
  }

  if (!session || !store) {
    return (
      <SafeContainer>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#f44336" />
          <Text style={styles.errorTitle}>Sessão não encontrada</Text>
          <Text style={styles.errorSubtitle}>
            Esta sessão pode ter sido removida ou você não tem permissão para visualizá-la.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeContainer>
    );
  }

  const itemsWithPrice = items.filter(item => item.price && item.price > 0);
  const total = itemsWithPrice.reduce((sum, item) => sum + (item.price || 0), 0);

  return (
    <SafeContainer>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{session.name}</Text>
          <Text style={styles.headerSubtitle}>{store.name}</Text>
        </View>

        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Session Info */}
        <View style={styles.sessionInfo}>
          <View style={styles.sessionHeader}>
            <View style={styles.sessionIcon}>
              <Ionicons name="receipt-outline" size={24} color="#4CAF50" />
            </View>
            <View style={styles.sessionDetails}>
              <Text style={styles.sessionDate}>
                {new Date(session.created_at).toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
              <Text style={styles.sessionTime}>
                {new Date(session.created_at).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
          </View>

          {store.address && (
            <View style={styles.storeAddress}>
              <Ionicons name="location-outline" size={16} color="#64748b" />
              <Text style={styles.addressText}>{store.address}</Text>
            </View>
          )}
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Resumo da Pesquisa</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{items.length}</Text>
              <Text style={styles.summaryLabel}>Produtos</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{itemsWithPrice.length}</Text>
              <Text style={styles.summaryLabel}>Com Preço</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>R$ {total.toFixed(2)}</Text>
              <Text style={styles.summaryLabel}>Total</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                R$ {itemsWithPrice.length > 0 ? (total / itemsWithPrice.length).toFixed(2) : '0,00'}
              </Text>
              <Text style={styles.summaryLabel}>Média</Text>
            </View>
          </View>
        </View>

        {/* Products List */}
        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>
            Produtos Escaneados ({items.length})
          </Text>
          
          {items.length === 0 ? (
            <View style={styles.emptyProducts}>
              <Ionicons name="cube-outline" size={48} color="#ccc" />
              <Text style={styles.emptyProductsText}>
                Nenhum produto nesta sessão
              </Text>
            </View>
          ) : (
            <FlatList
              data={items}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              style={styles.productsList}
            />
          )}
        </View>
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
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f44336',
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  backButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  headerBackButton: {
    marginRight: 16,
    padding: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  shareButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  sessionInfo: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f8f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sessionDetails: {
    flex: 1,
  },
  sessionDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    textTransform: 'capitalize',
  },
  sessionTime: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  storeAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  addressText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
    flex: 1,
  },
  summary: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  productsSection: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    padding: 20,
    paddingBottom: 0,
  },
  emptyProducts: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyProductsText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
    textAlign: 'center',
  },
  productsList: {
    padding: 20,
    paddingTop: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  productImage: {
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
  productBarcode: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  scanDate: {
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
  noPrice: {
    fontSize: 14,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
});