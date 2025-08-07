import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { ProductService, getCategoryNameById } from '../../lib/products';
import { CategoryService } from '../../lib/categories';
import { BarcodeResult } from '../../lib/barcode';
import SafeContainer from '../../components/SafeContainer';
import { useToast } from '../../context/ToastContext';
import FloatingActionButton from '../../components/FloatingActionButton';
import ProductCategorySection from '../../components/ProductCategorySection';
import BarcodeScannerModal from '../../components/BarcodeScannerModal';

// Tipos para os produtos
type Product = {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  created_at: string;
  brand?: string;
  generic_products?: {
    name: string;
    category: string | null;
  };
};

export default function ProductList() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  
  // Estados para gerenciar os dados
  const [specificProducts, setSpecificProducts] = useState<Product[]>([]);
  const [genericProducts, setGenericProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [deletingProducts, setDeletingProducts] = useState<Set<string>>(new Set());
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  
  // Estado para controlar a aba ativa
  const [activeTab, setActiveTab] = useState<'all' | 'generic' | 'specific'>('all');
  
  // Função para atualizar produtos filtrados baseado na aba e busca
  const updateFilteredProducts = (all: any[], specific: any[], generic: any[], tab: string, search: string) => {
    let sourceProducts: any[] = [];
    
    switch (tab) {
      case 'specific':
        sourceProducts = specific;
        break;
      case 'generic':
        sourceProducts = generic;
        break;
      default:
        sourceProducts = all;
        break;
    }
    
    if (search.trim() === '') {
      setFilteredProducts(sourceProducts);
    } else {
      const filtered = sourceProducts.filter(product =>
        product.name.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  };
  
  // Carregar produtos e categorias
  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Buscar produtos específicos, genéricos e categorias em paralelo
      const [specificResult, genericResult, categoriesResult] = await Promise.all([
        ProductService.getSpecificProducts(),
        ProductService.getGenericProducts(),
        CategoryService.getCategories()
      ]);
      
      if (specificResult.error) {
        console.error('Erro ao buscar produtos específicos:', specificResult.error);
      }
      
      if (genericResult.error) {
        console.error('Erro ao buscar produtos genéricos:', genericResult.error);
      }
      
      if (categoriesResult.error) {
        console.error('Erro ao buscar categorias:', categoriesResult.error);
      }
      
      const specificData = specificResult.data || [];
      const genericData = genericResult.data || [];
      const categoriesData = categoriesResult.data || [];
      
      // Combinar todos os produtos para a aba "Todos"
      const combined = [
        ...specificData.map(p => ({ ...p, type: 'specific' })),
        ...genericData.map(p => ({ ...p, type: 'generic' }))
      ];
      
      setSpecificProducts(specificData);
      setGenericProducts(genericData);
      setAllProducts(combined);
      setCategories(categoriesData);
      
      // Atualizar produtos filtrados baseado na aba ativa
      updateFilteredProducts(combined, specificData, genericData, activeTab, searchText);
      
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Carregar produtos quando o componente montar
  useEffect(() => {
    fetchProducts();
  }, []);
  
  // Recarregar produtos quando a tela voltar ao foco (após cadastrar/editar)
  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [])
  );
  
  // Filtrar produtos quando o texto de busca ou aba ativa mudar
  useEffect(() => {
    updateFilteredProducts(allProducts, specificProducts, genericProducts, activeTab, searchText);
  }, [searchText, allProducts, specificProducts, genericProducts, activeTab]);
  
  // Função para mudar aba ativa
  const handleTabChange = (tab: 'all' | 'generic' | 'specific') => {
    setActiveTab(tab);
  };
  
  // Função para atualizar a lista (pull-to-refresh)
  const handleRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };
  
  // Navegar para a tela de detalhes do produto
  const handleProductPress = (product: any) => {
    if (product.type === 'specific') {
      router.push(`/product/${product.id}`);
    } else {
      // Para produtos genéricos, mostrar alerta por enquanto
      Alert.alert(
        'Detalhes do Produto Genérico',
        'A visualização de detalhes de produtos genéricos ainda não foi implementada.',
        [{ text: 'OK' }]
      );
    }
  };
  
  // Excluir produto
  const handleDeleteProduct = (product: Product) => {
    Alert.alert(
      'Excluir Produto',
      `Tem certeza que deseja excluir "${product.name}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingProducts(prev => new Set(prev).add(product.id));
              
              const { error } = await ProductService.deleteSpecificProduct(product.id);
              
              if (error) {
                console.error('Erro ao excluir produto:', error);
                Alert.alert('Erro', 'Não foi possível excluir o produto');
              } else {
                showSuccess('Produto excluído com sucesso!');
                // Remover o produto das listas locais
                if (product.type === 'specific') {
                  setSpecificProducts((prev: any[]) => prev.filter((p: any) => p.id !== product.id));
                } else {
                  setGenericProducts((prev: any[]) => prev.filter((p: any) => p.id !== product.id));
                }
                setAllProducts((prev: any[]) => prev.filter((p: any) => p.id !== product.id));
                setFilteredProducts((prev: any[]) => prev.filter((p: any) => p.id !== product.id));
              }
            } catch (error) {
              console.error('Erro ao excluir produto:', error);
              Alert.alert('Erro', 'Ocorreu um erro ao excluir o produto');
            } finally {
              setDeletingProducts(prev => {
                const newSet = new Set(prev);
                newSet.delete(product.id);
                return newSet;
              });
            }
          },
        },
      ]
    );
  };
  
  // Navegar para edição de produto
  const handleEditProduct = (product: any) => {
    if (product.type === 'specific') {
      router.push(`/product/edit/${product.id}`);
    } else {
      // Para produtos genéricos, por enquanto vamos mostrar um alerta
      // TODO: Implementar página de edição para produtos genéricos
      Alert.alert(
        'Edição de Produto Genérico',
        'A edição de produtos genéricos ainda não foi implementada. Por enquanto, você pode editar produtos genéricos através da página de edição de produtos específicos que os referenciam.',
        [{ text: 'OK' }]
      );
    }
  };

  // Lidar com resultado do scanner de código de barras
  const handleBarcodeScanned = (result: BarcodeResult) => {
    setShowBarcodeScanner(false);
    // Navegar para a página de novo produto com o código de barras
    router.push(`/product/new?barcode=${result.data}`);
  };

  // Lidar com entrada manual de código de barras
  const handleManualEntry = () => {
    setShowBarcodeScanner(false);
    // Navegar para a página de novo produto sem código de barras
    router.push('/product/new?type=specific');
  };

  // Agrupar produtos por categoria
  const groupProductsByCategory = (products: any[]) => {
    const grouped: { [key: string]: any[] } = {};
    const uncategorized: any[] = [];

    products.forEach(product => {
      let categoryName = 'Sem Categoria';
      let categoryId = null;

      if (product.type === 'generic') {
        if (product.category_id) {
          const category = categories.find(cat => cat.id === product.category_id);
          if (category) {
            categoryName = category.name;
            categoryId = category.id;
          }
        }
      } else if (product.generic_products?.categories) {
        categoryName = product.generic_products.categories.name;
        categoryId = product.generic_products.categories.id;
      }

      if (categoryId) {
        if (!grouped[categoryName]) {
          grouped[categoryName] = [];
        }
        grouped[categoryName].push(product);
      } else {
        uncategorized.push(product);
      }
    });

    // Adicionar produtos sem categoria se houver
    if (uncategorized.length > 0) {
      grouped['Sem Categoria'] = uncategorized;
    }

    return grouped;
  };

  // Obter informações da categoria
  const getCategoryInfo = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    return {
      icon: category?.icon || 'pricetag-outline',
      color: category?.color || '#666',
    };
  };
  
  // Renderizar produtos agrupados por categoria
  const renderCategorizedProducts = () => {
    const groupedProducts = groupProductsByCategory(filteredProducts);
    const categoryNames = Object.keys(groupedProducts).sort();

    if (categoryNames.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="basket-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>
            {searchText.length > 0 
              ? 'Nenhum produto encontrado'
              : 'Nenhum produto cadastrado'}
          </Text>
          {searchText.length === 0 && (
            <Text style={styles.emptySubtext}>
              Use o botão + para adicionar produtos
            </Text>
          )}
        </View>
      );
    }

    return (
      <ScrollView 
        style={styles.categoriesContainer}
        showsVerticalScrollIndicator={false}
      >
        {categoryNames.map(categoryName => {
          const categoryInfo = getCategoryInfo(categoryName);
          return (
            <ProductCategorySection
              key={categoryName}
              categoryName={categoryName}
              categoryIcon={categoryInfo.icon}
              categoryColor={categoryInfo.color}
              products={groupedProducts[categoryName]}
              onProductPress={handleProductPress}
              onEditProduct={handleEditProduct}
              onDeleteProduct={handleDeleteProduct}
              deletingProducts={deletingProducts}
              initiallyExpanded={categoryNames.length <= 3}
            />
          );
        })}
        <View style={styles.fabSpacing} />
      </ScrollView>
    );
  };
  
  // Opções do FAB
  const fabOptions = [
    {
      icon: 'barcode-outline',
      label: 'Escanear Código',
      onPress: () => setShowBarcodeScanner(true),
      color: '#2196F3',
    },
    {
      icon: 'add-outline',
      label: 'Produto Genérico',
      onPress: () => router.push('/product/new?type=generic'),
      color: '#FF9800',
    },
    {
      icon: 'create-outline',
      label: 'Produto Específico',
      onPress: () => router.push('/product/new?type=specific'),
      color: '#4CAF50',
    },
  ];

  return (
    <SafeContainer style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meus Produtos</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar produtos..."
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Abas de filtro */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => handleTabChange('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            Todos ({allProducts.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'generic' && styles.activeTab]}
          onPress={() => handleTabChange('generic')}
        >
          <Text style={[styles.tabText, activeTab === 'generic' && styles.activeTabText]}>
            Genéricos ({genericProducts.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'specific' && styles.activeTab]}
          onPress={() => handleTabChange('specific')}
        >
          <Text style={[styles.tabText, activeTab === 'specific' && styles.activeTabText]}>
            Específicos ({specificProducts.length})
          </Text>
        </TouchableOpacity>
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Carregando produtos...</Text>
        </View>
      ) : (
        renderCategorizedProducts()
      )}

      {/* FAB */}
      <FloatingActionButton
        options={fabOptions}
        mainIcon="add"
        mainColor="#4CAF50"
      />

      {/* Scanner de código de barras */}
      <BarcodeScannerModal
        visible={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onBarcodeScanned={handleBarcodeScanned}
        onManualEntry={handleManualEntry}
      />
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  categoriesContainer: {
    flex: 1,
    padding: 16,
  },
  fabSpacing: {
    height: 120, // Espaço aumentado para o FAB e botões de navegação
  },

  // Estilos para as abas
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#4CAF50',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});