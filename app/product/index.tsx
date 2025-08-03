import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { ProductService, getCategoryNameById } from '../../lib/products';
import SafeContainer from '../../components/SafeContainer';
import Toast from '../../components/Toast';
import { useToast } from '../../lib/useToast';

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
  const { toast, showSuccess, showError, hideToast } = useToast();
  
  // Estados para gerenciar os dados
  const [specificProducts, setSpecificProducts] = useState<Product[]>([]);
  const [genericProducts, setGenericProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [deletingProducts, setDeletingProducts] = useState<Set<string>>(new Set());
  
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
  
  // Carregar produtos
  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Buscar produtos específicos e genéricos em paralelo
      const [specificResult, genericResult] = await Promise.all([
        ProductService.getSpecificProducts(),
        ProductService.getGenericProducts()
      ]);
      
      if (specificResult.error) {
        console.error('Erro ao buscar produtos específicos:', specificResult.error);
      }
      
      if (genericResult.error) {
        console.error('Erro ao buscar produtos genéricos:', genericResult.error);
      }
      
      const specificData = specificResult.data || [];
      const genericData = genericResult.data || [];
      
      // Combinar todos os produtos para a aba "Todos"
      const combined = [
        ...specificData.map(p => ({ ...p, type: 'specific' })),
        ...genericData.map(p => ({ ...p, type: 'generic' }))
      ];
      
      setSpecificProducts(specificData);
      setGenericProducts(genericData);
      setAllProducts(combined);
      
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
  
  // Renderizar cada item da lista
  const renderProductItem = ({ item }: { item: any }) => {
    const isDeleting = deletingProducts.has(item.id);
    const isGeneric = item.type === 'generic';
    
    return (
      <View style={styles.productItem}>
        <TouchableOpacity 
          style={styles.productContent}
          onPress={() => handleProductPress(item)}
          disabled={isDeleting}
        >
          <View style={styles.productInfo}>
            <View style={styles.productHeader}>
              <Text style={styles.productName}>{item.name}</Text>
              <View style={[styles.typeBadge, isGeneric ? styles.genericBadge : styles.specificBadge]}>
                <Text style={styles.typeBadgeText}>
                  {isGeneric ? 'Genérico' : 'Específico'}
                </Text>
              </View>
            </View>
            
            {item.brand && (
              <Text style={styles.productBrand}>{item.brand}</Text>
            )}
            
            {item.description && (
              <Text style={styles.productDescription} numberOfLines={1}>
                {item.description}
              </Text>
            )}
            
            {item.category && (
              <Text style={styles.productCategory}>Categoria: {item.category}</Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.editButton, isDeleting && styles.actionButtonDisabled]}
            onPress={() => handleEditProduct(item)}
            disabled={isDeleting}
          >
            <Ionicons name="pencil-outline" size={18} color="#4CAF50" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
            onPress={() => handleDeleteProduct(item)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#ff6b6b" />
            ) : (
              <Ionicons name="trash-outline" size={18} color="#ff6b6b" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  return (
    <SafeContainer style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meus Produtos</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/product/new')}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
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
        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.productList}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="basket-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>
                {searchText.length > 0 
                  ? 'Nenhum produto encontrado'
                  : 'Nenhum produto cadastrado'}
              </Text>
              {searchText.length === 0 && (
                <TouchableOpacity 
                  style={styles.emptyButton}
                  onPress={() => router.push('/product/new')}
                >
                  <Text style={styles.emptyButtonText}>Adicionar Produto</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
      
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  addButton: {
    backgroundColor: '#4CAF50',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
  productList: {
    padding: 16,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  productContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  deleteButton: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderLeftWidth: 1,
    borderLeftColor: '#e0e0e0',
  },
  deleteButtonDisabled: {
    opacity: 0.5,
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
  // Estilos para os novos elementos do produto
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  genericBadge: {
    backgroundColor: '#E3F2FD',
  },
  specificBadge: {
    backgroundColor: '#E8F5E8',
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
  },
  productBrand: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  productCategory: {
    fontSize: 12,
    color: '#4CAF50',
    fontStyle: 'italic',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  editButton: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderLeftWidth: 1,
    borderLeftColor: '#e0e0e0',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});