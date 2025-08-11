import React, { useState, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import SafeContainer from '../../components/SafeContainer';
import ProductImage from '../../components/ProductImage';
import { useToast } from '../../context/ToastContext';
import { ProductsService } from '../../lib/products';
import type { SpecificProduct } from '../../lib/supabase';

export default function ProductsTab() {
  const router = useRouter();
  const { showError } = useToast();
  const [products, setProducts] = useState<SpecificProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<SpecificProduct[]>([]);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchQuery, products]);

  const loadProducts = async () => {
    try {
      const { data, error } = await ProductsService.getUserProducts();
      if (error) {
        showError('Erro', 'Não foi possível carregar os produtos');
      } else {
        setProducts(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      showError('Erro', 'Ocorreu um erro ao carregar os produtos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterProducts = () => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.brand && product.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (product.barcode && product.barcode.includes(searchQuery))
    );

    setFilteredProducts(filtered);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const renderProductItem = ({ item }: { item: SpecificProduct }) => (
    <TouchableOpacity
      style={styles.productItem}
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
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="basket-outline" size={64} color="#cbd5e1" />
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery 
          ? 'Tente ajustar sua pesquisa ou adicionar novos produtos'
          : 'Seus produtos específicos aparecerão aqui conforme você os adiciona'
        }
      </Text>
      {!searchQuery && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/product/new')}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Adicionar Produto</Text>
        </TouchableOpacity>
      )}
    </View>
  );

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

  return (
    <SafeContainer style={styles.container} hasTabBar={true}>
      <View style={styles.header}>
        <Text style={styles.title}>Meus Produtos</Text>
        <TouchableOpacity
          style={styles.addProductButton}
          onPress={() => router.push('/product/new')}
        >
          <Ionicons name="add" size={20} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar produtos..."
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
        data={filteredProducts}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
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
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
});