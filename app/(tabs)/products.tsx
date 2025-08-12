import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import SafeContainer from '../../components/SafeContainer';
import ProductImage from '../../components/ProductImage';
import ListSelectionModal from '../../components/ListSelectionModal';
import { useToast } from '../../context/ToastContext';
import { ProductsService, ProductService } from '../../lib/products';
import type { SpecificProduct, GenericProduct } from '../../lib/supabase';

type TabType = 'specific' | 'generic';

export default function ProductsTab() {
  const router = useRouter();
  const { showError } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('specific');
  const [specificProducts, setSpecificProducts] = useState<SpecificProduct[]>([]);
  const [genericProducts, setGenericProducts] = useState<GenericProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSpecificProducts, setFilteredSpecificProducts] = useState<SpecificProduct[]>([]);
  const [filteredGenericProducts, setFilteredGenericProducts] = useState<GenericProduct[]>([]);
  const [showListModal, setShowListModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SpecificProduct | GenericProduct | null>(null);
  const [selectedProductType, setSelectedProductType] = useState<'specific' | 'generic'>('specific');

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchQuery, specificProducts, genericProducts, activeTab]);

  // Recarregar dados sempre que a tela ganhar foco
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Página de produtos ganhou foco - recarregando dados...');
      loadProducts();
    }, [])
  );

  const loadProducts = async () => {
    try {
      console.log('📦 Carregando produtos...');
      
      // Carregar produtos específicos
      const { data: specificData, error: specificError } = await ProductService.getSpecificProducts();
      if (specificError) {
        console.error('❌ Erro ao carregar produtos específicos:', specificError);
        showError('Erro', 'Não foi possível carregar os produtos específicos');
      } else {
        console.log('✅ Produtos específicos carregados:', specificData?.length || 0);
        setSpecificProducts(specificData || []);
      }

      // Carregar produtos genéricos
      const { data: genericData, error: genericError } = await ProductService.getGenericProducts();
      if (genericError) {
        console.error('❌ Erro ao carregar produtos genéricos:', genericError);
        showError('Erro', 'Não foi possível carregar os produtos genéricos');
      } else {
        console.log('✅ Produtos genéricos carregados:', genericData?.length || 0);
        setGenericProducts(genericData || []);
      }
    } catch (error) {
      console.error('❌ Erro geral ao carregar produtos:', error);
      showError('Erro', 'Ocorreu um erro ao carregar os produtos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterProducts = () => {
    if (!searchQuery.trim()) {
      setFilteredSpecificProducts(specificProducts);
      setFilteredGenericProducts(genericProducts);
      return;
    }

    const query = searchQuery.toLowerCase();

    // Filtrar produtos específicos
    const filteredSpecific = specificProducts.filter(product =>
      product.name.toLowerCase().includes(query) ||
      (product.brand && product.brand.toLowerCase().includes(query)) ||
      (product.barcode && product.barcode.includes(query))
    );

    // Filtrar produtos genéricos
    const filteredGeneric = genericProducts.filter(product =>
      product.name.toLowerCase().includes(query)
    );

    setFilteredSpecificProducts(filteredSpecific);
    setFilteredGenericProducts(filteredGeneric);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const handleAddToList = (product: SpecificProduct | GenericProduct, type: 'specific' | 'generic') => {
    setSelectedProduct(product);
    setSelectedProductType(type);
    setShowListModal(true);
  };

  const handleListModalClose = () => {
    setShowListModal(false);
    setSelectedProduct(null);
  };

  const renderSpecificProductItem = ({ item }: { item: SpecificProduct }) => (
    <View style={styles.productItem}>
      <TouchableOpacity
        style={styles.productMainContent}
        onPress={() => router.push(`/product/${item.id}`)}
      >
        <ProductImage 
          imageUrl={item.image_url}
          size="medium"
          style={styles.productImage}
        />
        
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          {item.brand && (
            <Text style={styles.productBrand}>{item.brand}</Text>
          )}
          {item.barcode && (
            <Text style={styles.productBarcode}>Código: {item.barcode}</Text>
          )}
          <Text style={styles.productDate}>
            Criado em {new Date(item.created_at).toLocaleDateString('pt-BR')}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
      </TouchableOpacity>

      <View style={styles.productActions}>
        <TouchableOpacity
          style={styles.addToListButton}
          onPress={() => handleAddToList(item, 'specific')}
        >
          <Ionicons name="add-circle-outline" size={20} color="#4CAF50" />
          <Text style={styles.addToListText}>Adicionar à Lista</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderGenericProductItem = ({ item }: { item: GenericProduct }) => (
    <View style={styles.genericProductCard}>
      <TouchableOpacity
        style={styles.genericProductMainContent}
        onPress={() => router.push(`/product/generic/${item.id}`)}
      >
        <View style={styles.genericProductIconLarge}>
          <Ionicons 
            name={item.categories?.icon as any || "cube-outline"} 
            size={32} 
            color={item.categories?.color || "#64748b"} 
          />
        </View>
        
        <View style={styles.genericProductInfo}>
          <Text style={styles.genericProductName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.genericProductCategory} numberOfLines={1}>
            {item.categories?.name || 'Sem categoria'}
          </Text>
          {item.is_default && (
            <View style={styles.defaultBadgeSmall}>
              <Text style={styles.defaultBadgeSmallText}>Padrão</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.genericProductActions}>
        <TouchableOpacity
          style={styles.addToListButton}
          onPress={() => handleAddToList(item, 'generic')}
        >
          <Ionicons name="add-circle-outline" size={20} color="#4CAF50" />
          <Text style={styles.addToListText}>Adicionar à Lista</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => {
    const isSpecificTab = activeTab === 'specific';
    const productType = isSpecificTab ? 'específicos' : 'genéricos';
    const addRoute = isSpecificTab ? '/product/scanner' : '/product/generic/new';
    const buttonIcon = isSpecificTab ? 'barcode-outline' : 'add';
    const buttonText = isSpecificTab ? 'Escanear Produto' : 'Adicionar Produto Genérico';
    
    return (
      <View style={styles.emptyState}>
        <Ionicons 
          name={isSpecificTab ? "basket-outline" : "cube-outline"} 
          size={64} 
          color="#cbd5e1" 
        />
        <Text style={styles.emptyTitle}>
          {searchQuery ? 'Nenhum produto encontrado' : `Nenhum produto ${productType} cadastrado`}
        </Text>
        <Text style={styles.emptySubtitle}>
          {searchQuery 
            ? 'Tente ajustar sua pesquisa ou adicionar novos produtos'
            : isSpecificTab 
              ? 'Escaneie códigos de barras para adicionar produtos específicos com informações detalhadas'
              : `Seus produtos ${productType} aparecerão aqui conforme você os adiciona`
          }
        </Text>
        {!searchQuery && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push(addRoute)}
          >
            <Ionicons name={buttonIcon} size={20} color="#fff" />
            <Text style={styles.addButtonText}>
              {buttonText}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeContainer hasTabBar={true}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Carregando produtos...</Text>
        </View>
      </SafeContainer>
    );
  }

  const getCurrentData = () => {
    return activeTab === 'specific' ? filteredSpecificProducts : filteredGenericProducts;
  };

  const getCurrentRenderItem = () => {
    return activeTab === 'specific' ? renderSpecificProductItem : renderGenericProductItem;
  };

  return (
    <SafeContainer style={styles.container} hasTabBar={true}>
      <View style={styles.header}>
        <Text style={styles.title}>Meus Produtos</Text>
        <TouchableOpacity
          style={styles.addProductButton}
          onPress={() => router.push(activeTab === 'specific' ? '/product/scanner' : '/product/generic/new')}
        >
          <Ionicons name={activeTab === 'specific' ? "barcode-outline" : "add"} size={20} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      {/* Abas */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'specific' && styles.activeTab]}
          onPress={() => setActiveTab('specific')}
        >
          <Ionicons 
            name="basket-outline" 
            size={20} 
            color={activeTab === 'specific' ? '#4CAF50' : '#64748b'} 
          />
          <Text style={[styles.tabText, activeTab === 'specific' && styles.activeTabText]}>
            Específicos
          </Text>
          <View style={styles.tabBadge}>
            <Text style={styles.tabBadgeText}>{specificProducts.length}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'generic' && styles.activeTab]}
          onPress={() => setActiveTab('generic')}
        >
          <Ionicons 
            name="cube-outline" 
            size={20} 
            color={activeTab === 'generic' ? '#4CAF50' : '#64748b'} 
          />
          <Text style={[styles.tabText, activeTab === 'generic' && styles.activeTabText]}>
            Genéricos
          </Text>
          <View style={styles.tabBadge}>
            <Text style={styles.tabBadgeText}>{genericProducts.length}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder={`Buscar produtos ${activeTab === 'specific' ? 'específicos' : 'genéricos'}...`}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94a3b8"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={getCurrentData()}
        renderItem={getCurrentRenderItem()}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        numColumns={activeTab === 'generic' ? 2 : 1}
        key={activeTab} // Force re-render when switching tabs
      />

      <ListSelectionModal
        visible={showListModal}
        onClose={handleListModalClose}
        product={selectedProduct}
        productType={selectedProductType}
        onSuccess={() => {
          // Opcional: recarregar dados ou mostrar feedback adicional
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
    marginTop: 16,
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
  addProductButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f8f1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  listContainer: {
    padding: 20,
    flexGrow: 1,
  },
  productItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
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
  productMainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  productActions: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addToListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f8f1',
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  addToListText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4CAF50',
  },
  productImage: {
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
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
  productDate: {
    fontSize: 12,
    color: '#94a3b8',
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
  addButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748b',
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  genericProductIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  productCategory: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  defaultBadge: {
    fontSize: 12,
    color: '#059669',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  // Estilos para produtos genéricos em 2 colunas
  genericProductCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    marginHorizontal: 6,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  genericProductMainContent: {
    padding: 16,
    alignItems: 'center',
  },
  genericProductIconLarge: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  genericProductInfo: {
    alignItems: 'center',
    width: '100%',
  },
  genericProductName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 4,
    minHeight: 40, // Garantir altura consistente
  },
  genericProductCategory: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 6,
  },
  defaultBadgeSmall: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  defaultBadgeSmallText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#059669',
  },
  genericProductActions: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },

});