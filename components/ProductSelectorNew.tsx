import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProductService } from '../lib/products';
import { SpecificProduct } from '../lib/supabase';

type ProductSelectorNewProps = {
  visible: boolean;
  onClose: () => void;
  onSelectProduct: (product: SpecificProduct) => void;
  onSelectMultipleProducts: (products: SpecificProduct[]) => void;
  onCreateNewProduct: (name: string) => void;
  allowMultipleSelection?: boolean;
  currentListProductIds?: string[];
  currentListProductNames?: string[];
};

export default function ProductSelectorNew({
  visible,
  onClose,
  onSelectProduct,
  onSelectMultipleProducts,
  onCreateNewProduct,
  allowMultipleSelection = false,
  currentListProductIds = [],
  currentListProductNames = [],
}: ProductSelectorNewProps) {
  const [allProducts, setAllProducts] = useState<SpecificProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<SpecificProduct[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  // Função principal para carregar e filtrar produtos
  const loadProducts = async () => {
    console.log('🆕 NEW SELECTOR - Carregando produtos...');
    console.log('  Produtos na lista atual:', currentListProductNames);
    
    setLoading(true);
    
    try {
      const { data, error } = await ProductService.getSpecificProducts();
      
      if (error) {
        console.error('Erro ao carregar produtos:', error);
        return;
      }
      
      if (data) {
        console.log(`📦 Total de produtos no banco: ${data.length}`);
        
        // Filtrar produtos que NÃO estão na lista atual
        const availableProducts = data.filter(product => {
          // Verificar por ID
          const isInListById = currentListProductIds.includes(product.id);
          
          // Verificar por nome (case-insensitive)
          const productName = product.name.toLowerCase().trim();
          const isInListByName = currentListProductNames.some(listName => 
            listName.toLowerCase().trim() === productName
          );
          
          const shouldExclude = isInListById || isInListByName;
          
          console.log(`${shouldExclude ? '❌' : '✅'} ${product.name} - ${shouldExclude ? 'EXCLUÍDO' : 'DISPONÍVEL'}`);
          
          return !shouldExclude;
        });
        
        console.log(`✅ Produtos disponíveis: ${availableProducts.length}`);
        console.log('Produtos:', availableProducts.map(p => p.name).slice(0, 5));
        
        setAllProducts(availableProducts);
        setFilteredProducts(availableProducts);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar produtos quando o modal abrir
  useEffect(() => {
    if (visible) {
      console.log('🆕 NEW SELECTOR - Modal aberto!');
      setSelectedProducts(new Set());
      setIsMultiSelectMode(allowMultipleSelection);
      setSearchText('');
      loadProducts();
    } else {
      console.log('🆕 NEW SELECTOR - Modal fechado');
      setAllProducts([]);
      setFilteredProducts([]);
      setSelectedProducts(new Set());
      setSearchText('');
    }
  }, [visible]);

  // Memoizar as strings das listas para evitar re-renders desnecessários
  const currentListProductNamesString = useMemo(() => 
    currentListProductNames.join(','), [currentListProductNames]
  );
  const currentListProductIdsString = useMemo(() => 
    currentListProductIds.join(','), [currentListProductIds]
  );

  // Recarregar quando a lista atual mudar
  useEffect(() => {
    if (visible) {
      console.log('🔄 NEW SELECTOR - Lista atual mudou, recarregando...');
      loadProducts();
    }
  }, [currentListProductNamesString, currentListProductIdsString, visible]);

  // Filtrar produtos por busca
  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredProducts(allProducts);
    } else {
      const filtered = allProducts.filter(product =>
        product.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (product.brand && product.brand.toLowerCase().includes(searchText.toLowerCase()))
      );
      setFilteredProducts(filtered);
    }
  }, [searchText, allProducts]);

  const handleSelectProduct = (product: SpecificProduct) => {
    if (isMultiSelectMode) {
      const newSelected = new Set(selectedProducts);
      if (newSelected.has(product.id)) {
        newSelected.delete(product.id);
      } else {
        newSelected.add(product.id);
      }
      setSelectedProducts(newSelected);
    } else {
      onSelectProduct(product);
      onClose();
    }
  };

  const handleConfirmSelection = () => {
    const selectedProductsList = allProducts.filter(p => selectedProducts.has(p.id));
    console.log('✅ Confirmando seleção:', selectedProductsList.map(p => p.name));
    onSelectMultipleProducts(selectedProductsList);
    onClose();
  };

  const handleCreateNew = () => {
    if (searchText.trim()) {
      onCreateNewProduct(searchText.trim());
      onClose();
    }
  };

  const renderProductItem = ({ item }: { item: SpecificProduct }) => {
    const isSelected = selectedProducts.has(item.id);

    return (
      <TouchableOpacity
        style={[styles.productItem, isSelected && styles.selectedItem]}
        onPress={() => handleSelectProduct(item)}
      >
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          {item.brand && <Text style={styles.productBrand}>{item.brand}</Text>}
          {item.barcode && (
            <View style={styles.barcodeContainer}>
              <Ionicons name="barcode-outline" size={12} color="#4CAF50" />
              <Text style={styles.barcode}>{item.barcode}</Text>
            </View>
          )}
        </View>
        
        {isMultiSelectMode ? (
          <Ionicons
            name={isSelected ? 'checkbox' : 'square-outline'}
            size={24}
            color={isSelected ? '#4CAF50' : '#666'}
          />
        ) : (
          <Ionicons name="add-circle-outline" size={24} color="#4CAF50" />
        )}
      </TouchableOpacity>
    );
  };

  const showCreateOption = searchText.trim().length > 0 &&
    !filteredProducts.some(p => p.name.toLowerCase() === searchText.toLowerCase());

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {isMultiSelectMode 
                ? `Selecionados (${selectedProducts.size})`
                : 'Selecionar Produto'
              }
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar produtos..."
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          {/* Content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>Carregando produtos...</Text>
            </View>
          ) : (
            <>
              <FlatList
                data={filteredProducts}
                renderItem={renderProductItem}
                keyExtractor={(item) => item.id}
                style={styles.productList}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                      {searchText.trim() 
                        ? 'Nenhum produto encontrado'
                        : 'Todos os produtos já estão na lista!'
                      }
                    </Text>
                  </View>
                }
              />

              {/* Create new option */}
              {showCreateOption && (
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={handleCreateNew}
                >
                  <Ionicons name="add" size={20} color="#4CAF50" />
                  <Text style={styles.createButtonText}>
                    Criar "{searchText.trim()}"
                  </Text>
                </TouchableOpacity>
              )}

              {/* Confirm button for multi-select */}
              {isMultiSelectMode && selectedProducts.size > 0 && (
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleConfirmSelection}
                >
                  <Text style={styles.confirmButtonText}>
                    Adicionar {selectedProducts.size} produto{selectedProducts.size > 1 ? 's' : ''}
                  </Text>
                </TouchableOpacity>
              )}
            </>
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    margin: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  productList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  selectedItem: {
    backgroundColor: '#f0f8ff',
    borderColor: '#4CAF50',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  productBrand: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  barcodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barcode: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f8ff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
  },
  createButtonText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 8,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
