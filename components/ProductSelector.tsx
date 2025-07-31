import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TextInput, 
  FlatList, 
  ActivityIndicator,
  ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProductService } from '../lib/products';
import { SpecificProduct } from '../lib/supabase';

type ProductSelectorProps = {
  visible: boolean;
  onClose: () => void;
  onSelectProduct: (product: SpecificProduct) => void;
  onCreateNewProduct: (name: string) => void;
};

export default function ProductSelector({ 
  visible, 
  onClose, 
  onSelectProduct, 
  onCreateNewProduct 
}: ProductSelectorProps) {
  const [products, setProducts] = useState<SpecificProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<SpecificProduct[]>([]);
  const [suggestedProducts, setSuggestedProducts] = useState<SpecificProduct[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'scanned' | 'manual'>('all');

  // Carregar produtos quando o modal abrir
  useEffect(() => {
    if (visible) {
      fetchProducts();
    } else {
      setSearchText('');
      setActiveFilter('all');
    }
  }, [visible]);

  // Filtrar produtos quando o texto de busca ou filtro mudar
  useEffect(() => {
    let filtered = products;

    // Aplicar filtro por tipo
    if (activeFilter === 'scanned') {
      filtered = products.filter(product => product.barcode);
    } else if (activeFilter === 'manual') {
      filtered = products.filter(product => !product.barcode);
    }

    // Aplicar filtro de busca
    if (searchText.trim() !== '') {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (product.brand && product.brand.toLowerCase().includes(searchText.toLowerCase())) ||
        (product.barcode && product.barcode.includes(searchText))
      );
    }

    setFilteredProducts(filtered);
  }, [searchText, products, activeFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Buscar todos os produtos
      const { data, error } = await ProductService.getSpecificProducts();
      
      if (error) {
        console.error('Erro ao buscar produtos:', error);
        return;
      }
      
      if (data) {
        setProducts(data);
        setFilteredProducts(data);
      }

      // Buscar produtos sugeridos (mais usados)
      const { data: suggested, error: suggestedError } = await ProductService.getMostUsedProducts(5);
      
      if (suggestedError) {
        console.error('Erro ao buscar produtos sugeridos:', suggestedError);
      } else if (suggested) {
        setSuggestedProducts(suggested);
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = (product: SpecificProduct) => {
    onSelectProduct(product);
    onClose();
  };

  const handleCreateNew = () => {
    if (searchText.trim()) {
      onCreateNewProduct(searchText.trim());
      onClose();
    }
  };

  const renderProductItem = ({ item }: { item: SpecificProduct }) => (
    <TouchableOpacity
      style={[
        styles.productItem,
        item.barcode && styles.scannedProductItem
      ]}
      onPress={() => handleSelectProduct(item)}
    >
      <View style={styles.productInfo}>
        <View style={styles.productHeader}>
          <Text style={styles.productName}>{item.name}</Text>
          {item.barcode && (
            <View style={styles.barcodeIndicator}>
              <Ionicons name="barcode-outline" size={16} color="#4CAF50" />
            </View>
          )}
        </View>
        {item.brand && (
          <Text style={styles.productBrand}>{item.brand}</Text>
        )}
        {item.barcode && (
          <Text style={styles.productBarcode}>Código: {item.barcode}</Text>
        )}
        {item.data_source && item.data_source !== 'manual' && (
          <Text style={styles.productSource}>
            Fonte: {getSourceLabel(item.data_source)}
          </Text>
        )}
      </View>
      <Ionicons name="add-circle-outline" size={24} color="#4CAF50" />
    </TouchableOpacity>
  );

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'cosmos': return 'Cosmos';
      case 'openfoodfacts': return 'Open Food Facts';
      case 'local': return 'Local';
      default: return 'Manual';
    }
  };

  const showCreateOption = searchText.trim().length > 0 && 
    !filteredProducts.some(p => p.name.toLowerCase() === searchText.toLowerCase());

  // Contar produtos por tipo
  const scannedCount = products.filter(p => p.barcode).length;
  const manualCount = products.filter(p => !p.barcode).length;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecionar Produto</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nome, marca ou código..."
              value={searchText}
              onChangeText={setSearchText}
              autoFocus
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          {/* Filtros */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filtersContainer}
            contentContainerStyle={styles.filtersContent}
          >
            <TouchableOpacity
              style={[
                styles.filterButton,
                activeFilter === 'all' && styles.activeFilterButton
              ]}
              onPress={() => setActiveFilter('all')}
            >
              <Text style={[
                styles.filterButtonText,
                activeFilter === 'all' && styles.activeFilterButtonText
              ]}>
                Todos ({products.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterButton,
                activeFilter === 'scanned' && styles.activeFilterButton
              ]}
              onPress={() => setActiveFilter('scanned')}
            >
              <Ionicons 
                name="barcode-outline" 
                size={16} 
                color={activeFilter === 'scanned' ? '#fff' : '#666'} 
                style={styles.filterIcon}
              />
              <Text style={[
                styles.filterButtonText,
                activeFilter === 'scanned' && styles.activeFilterButtonText
              ]}>
                Escaneados ({scannedCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterButton,
                activeFilter === 'manual' && styles.activeFilterButton
              ]}
              onPress={() => setActiveFilter('manual')}
            >
              <Ionicons 
                name="create-outline" 
                size={16} 
                color={activeFilter === 'manual' ? '#fff' : '#666'} 
                style={styles.filterIcon}
              />
              <Text style={[
                styles.filterButtonText,
                activeFilter === 'manual' && styles.activeFilterButtonText
              ]}>
                Manuais ({manualCount})
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {showCreateOption && (
            <TouchableOpacity
              style={styles.createOption}
              onPress={handleCreateNew}
            >
              <Ionicons name="add-circle" size={24} color="#4CAF50" />
              <Text style={styles.createOptionText}>
                Criar "{searchText}"
              </Text>
            </TouchableOpacity>
          )}

          {searchText.trim() === '' && activeFilter === 'all' && (
            <>
              {/* Produtos escaneados recentemente */}
              {scannedCount > 0 && (
                <View style={styles.suggestedSection}>
                  <Text style={styles.sectionTitle}>Produtos escaneados recentemente</Text>
                  <FlatList
                    data={products.filter(p => p.barcode).slice(0, 5)}
                    renderItem={renderProductItem}
                    keyExtractor={(item) => `recent-scanned-${item.id}`}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.suggestedList}
                  />
                </View>
              )}

              {/* Produtos mais usados */}
              {suggestedProducts.length > 0 && (
                <View style={styles.suggestedSection}>
                  <Text style={styles.sectionTitle}>Produtos mais usados</Text>
                  <FlatList
                    data={suggestedProducts}
                    renderItem={renderProductItem}
                    keyExtractor={(item) => `suggested-${item.id}`}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.suggestedList}
                  />
                </View>
              )}
            </>
          )}

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>Carregando produtos...</Text>
            </View>
          ) : filteredProducts.length === 0 && searchText.trim() === '' && activeFilter === 'all' ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="basket-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>Nenhum produto cadastrado</Text>
              <Text style={styles.emptySubtext}>
                Digite o nome de um produto para criar ou use o scanner
              </Text>
            </View>
          ) : filteredProducts.length === 0 && searchText.trim() === '' && activeFilter === 'scanned' ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="barcode-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>Nenhum produto escaneado</Text>
              <Text style={styles.emptySubtext}>
                Use o scanner de código de barras para adicionar produtos
              </Text>
            </View>
          ) : filteredProducts.length === 0 && searchText.trim() === '' && activeFilter === 'manual' ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="create-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>Nenhum produto manual</Text>
              <Text style={styles.emptySubtext}>
                Digite o nome de um produto para criar manualmente
              </Text>
            </View>
          ) : filteredProducts.length === 0 && searchText.trim() !== '' ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>Nenhum produto encontrado</Text>
              <Text style={styles.emptySubtext}>
                Toque em "Criar" para adicionar um novo produto
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredProducts}
              renderItem={renderProductItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.productList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
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
  createOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8f1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  createOptionText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  productList: {
    paddingBottom: 20,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  productBrand: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  suggestedSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  suggestedList: {
    paddingRight: 16,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filtersContent: {
    paddingRight: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeFilterButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: '#fff',
  },
  filterIcon: {
    marginRight: 4,
  },
  scannedProductItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  barcodeIndicator: {
    backgroundColor: '#e8f5e8',
    borderRadius: 12,
    padding: 4,
  },
  productBarcode: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  productSource: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
    fontStyle: 'italic',
  },
});