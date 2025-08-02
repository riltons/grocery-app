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
  onSelectMultipleProducts: (products: SpecificProduct[]) => void;
  onCreateNewProduct: (name: string) => void;
  allowMultipleSelection?: boolean;
  currentListProductIds?: string[]; // IDs dos produtos já na lista atual
  currentListProductNames?: string[]; // Nomes dos produtos já na lista atual (para produtos genéricos)
};

export default function ProductSelector({
  visible,
  onClose,
  onSelectProduct,
  onSelectMultipleProducts,
  onCreateNewProduct,
  allowMultipleSelection = false,
  currentListProductIds = [],
  currentListProductNames = []
}: ProductSelectorProps) {
  const [products, setProducts] = useState<SpecificProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<SpecificProduct[]>([]);
  const [suggestedProducts, setSuggestedProducts] = useState<SpecificProduct[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'scanned' | 'manual'>('all');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  // Função removida - agora filtramos produtos na origem

  // Função para contar apenas produtos NOVOS selecionados (não incluir os já na lista)
  const getNewProductsCount = () => {
    // Como todos os produtos mostrados são novos (já filtrados), 
    // o contador é simplesmente o número de produtos selecionados
    return selectedProducts.size;
  };

  // Carregar produtos quando o modal abrir ou quando as props mudarem
  useEffect(() => {
    if (visible) {
      console.log('🔍🔍🔍 MODAL - ProductSelector ABERTO! 🔍🔍🔍');
      console.log('==========================================');
      console.log('  allowMultipleSelection:', allowMultipleSelection);
      console.log('  currentListProductIds (length):', currentListProductIds.length);
      console.log('  currentListProductIds:', currentListProductIds);
      console.log('  currentListProductNames (length):', currentListProductNames.length);
      console.log('  currentListProductNames:', currentListProductNames);
      console.log('==========================================');

      // Limpar estado anterior
      setSelectedProducts(new Set());
      setIsMultiSelectMode(false);

      // Recarregar produtos imediatamente (sem delay)
      console.log('⚡ IMMEDIATE - Executando fetchProducts imediatamente');
      fetchProducts();

      // Se está em modo múltiplo e há produtos na lista atual, pré-selecioná-los
      if (allowMultipleSelection && (currentListProductIds.length > 0 || currentListProductNames.length > 0)) {
        console.log('  🔄 Ativando modo múltiplo automaticamente');
        setIsMultiSelectMode(true);
      }
    } else {
      console.log('🔍 MODAL - ProductSelector fechado - limpando estado');
      // Limpar completamente o estado quando fechar
      setSearchText('');
      setActiveFilter('all');
      setSelectedProducts(new Set());
      setIsMultiSelectMode(false);
      setProducts([]);
      setFilteredProducts([]);
      setSuggestedProducts([]);
    }
  }, [visible, allowMultipleSelection, currentListProductIds, currentListProductNames]);

  // Efeito adicional para reagir a mudanças nas props mesmo com modal aberto
  useEffect(() => {
    if (visible) {
      console.log('🔄 PROPS CHANGED - Atualizando produtos devido a mudança nas props');
      console.log('  Novos currentListProductNames:', currentListProductNames);
      fetchProducts();
    }
  }, [currentListProductIds.length, currentListProductNames.length]);

  // Ativar modo múltiplo automaticamente se há produtos na lista atual
  useEffect(() => {
    if (visible && allowMultipleSelection && (currentListProductIds.length > 0 || currentListProductNames.length > 0)) {
      setIsMultiSelectMode(true);
    }
  }, [visible, allowMultipleSelection, currentListProductIds, currentListProductNames]);

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

      console.log('🚀🚀🚀 FETCH - INICIANDO BUSCA DE PRODUTOS! 🚀🚀🚀');
      console.log('==========================================');
      console.log('  currentListProductIds:', currentListProductIds);
      console.log('  currentListProductNames:', currentListProductNames);
      console.log('==========================================');

      // Buscar todos os produtos
      const { data, error } = await ProductService.getSpecificProducts();

      if (error) {
        console.error('❌ ERRO ao buscar produtos:', error);
        return;
      }

      if (data) {
        console.log(`📊 DADOS - ${data.length} produtos encontrados no banco`);
        console.log('  Primeiros 3 produtos:', data.slice(0, 3).map(p => ({ id: p.id, name: p.name })));

        console.log('🔍 FILTRO - Aplicando filtro de produtos já na lista:');
        console.log('  IDs para filtrar:', currentListProductIds);
        console.log('  Nomes para filtrar:', currentListProductNames);

        // Filtrar produtos que já estão na lista atual
        const availableProducts = data.filter(product => {
          // Verificar por ID (produtos específicos)
          const isInListById = currentListProductIds.includes(product.id);
          
          // Verificar por nome (produtos genéricos ou específicos com mesmo nome)
          const productName = product.name.toLowerCase().trim();
          const normalizedListNames = currentListProductNames.map(name => name.toLowerCase().trim());
          const isInListByName = normalizedListNames.includes(productName);

          const shouldExclude = isInListById || isInListByName;

          // Log detalhado para debug
          console.log(`🔍 PRODUTO: "${product.name}" (ID: ${product.id})`);
          console.log(`  - Nome normalizado: "${productName}"`);
          console.log(`  - Está na lista por ID: ${isInListById}`);
          console.log(`  - Está na lista por nome: ${isInListByName}`);
          if (isInListByName) {
            const matchingName = normalizedListNames.find(name => name === productName);
            console.log(`  - Nome correspondente na lista: "${matchingName}"`);
          }
          console.log(`  - Será ${shouldExclude ? 'REMOVIDO' : 'MANTIDO'}`);

          return !shouldExclude;
        });

        console.log(`📦 RESULTADO FINAL:`);
        console.log(`  Total no banco: ${data.length}`);
        console.log(`  Disponíveis: ${availableProducts.length}`);
        console.log(`  Removidos: ${data.length - availableProducts.length}`);
        console.log('  Produtos disponíveis:', availableProducts.slice(0, 5).map(p => p.name));

        setProducts(availableProducts);
        setFilteredProducts(availableProducts);
      }

      // Buscar produtos sugeridos (mais usados)
      const { data: suggested, error: suggestedError } = await ProductService.getMostUsedProducts(5);

      if (suggestedError) {
        console.error('Erro ao buscar produtos sugeridos:', suggestedError);
      } else if (suggested) {
        // Filtrar produtos sugeridos que NÃO estão na lista atual
        const availableSuggested = suggested.filter(product => {
          const isInListById = currentListProductIds.includes(product.id);
          const productName = product.name.toLowerCase().trim();
          const isInListByName = currentListProductNames.some(listName =>
            listName.toLowerCase().trim() === productName
          );
          return !isInListById && !isInListByName;
        });

        setSuggestedProducts(availableSuggested);
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = (product: SpecificProduct) => {
    if (allowMultipleSelection && isMultiSelectMode) {
      // Modo de seleção múltipla - simples toggle
      const newSelected = new Set(selectedProducts);

      if (newSelected.has(product.id)) {
        newSelected.delete(product.id);
      } else {
        newSelected.add(product.id);
      }

      setSelectedProducts(newSelected);
    } else {
      // Modo de seleção única
      onSelectProduct(product);
      onClose();
    }
  };

  const handleConfirmMultipleSelection = () => {
    // Como todos os produtos mostrados são novos (já filtrados),
    // basta pegar os produtos selecionados
    const selectedProductsList = products.filter(p => selectedProducts.has(p.id));

    console.log(`🚀 CONFIRMAÇÃO - Adicionando ${selectedProductsList.length} produtos:`, selectedProductsList.map(p => p.name));

    onSelectMultipleProducts(selectedProductsList);
    onClose();
  };

  const handleToggleMultiSelectMode = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    // Ao ativar modo múltiplo, manter produtos da lista atual selecionados
    if (!isMultiSelectMode && (currentListProductIds.length > 0 || currentListProductNames.length > 0)) {
      // Pré-selecionar produtos da lista atual
      const currentListProducts = new Set([
        ...currentListProductIds,
        ...products.filter(p => currentListProductNames.includes(p.name)).map(p => p.id)
      ]);
      setSelectedProducts(currentListProducts);
    } else {
      setSelectedProducts(new Set());
    }
  };

  const handleSelectAll = () => {
    // Como todos os produtos mostrados são novos, simplesmente alternar entre todos selecionados ou nenhum
    if (selectedProducts.size === filteredProducts.length) {
      // Se todos estão selecionados, desmarcar todos
      setSelectedProducts(new Set());
    } else {
      // Selecionar todos os produtos filtrados
      const allIds = new Set(filteredProducts.map(p => p.id));
      setSelectedProducts(allIds);
    }
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
        style={[
          styles.productItem,
          item.barcode && styles.scannedProductItem,
          isSelected && styles.selectedProductItem
        ]}
        onPress={() => handleSelectProduct(item)}
      >
        <View style={styles.productInfo}>
          <View style={styles.productHeader}>
            <Text style={styles.productName}>{item.name}</Text>
            <View style={styles.productIndicators}>
              {item.barcode && (
                <View style={styles.barcodeIndicator}>
                  <Ionicons name="barcode-outline" size={16} color="#4CAF50" />
                </View>
              )}
            </View>
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

        {allowMultipleSelection && isMultiSelectMode ? (
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
            <Text style={styles.modalTitle}>
              {isMultiSelectMode ? (() => {
                const newProductsCount = getNewProductsCount();
                const totalInList = currentListProductIds.length + currentListProductNames.length;

                return totalInList > 0
                  ? `Novos: ${newProductsCount} | Na lista: ${totalInList}`
                  : `Selecionados (${selectedProducts.size})`;
              })() : 'Selecionar Produto'}
            </Text>
            <View style={styles.headerActions}>
              {allowMultipleSelection && (
                <TouchableOpacity
                  onPress={handleToggleMultiSelectMode}
                  style={styles.multiSelectButton}
                >
                  <Ionicons
                    name={isMultiSelectMode ? 'checkmark-done' : 'checkbox-outline'}
                    size={20}
                    color="#4CAF50"
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
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

          {/* Controles de seleção múltipla */}
          {allowMultipleSelection && isMultiSelectMode && filteredProducts.length > 0 && (
            <View style={styles.multiSelectControls}>
              <TouchableOpacity
                style={styles.selectAllButton}
                onPress={handleSelectAll}
              >
                <Ionicons
                  name={selectedProducts.size === filteredProducts.length ? 'checkbox' : 'square-outline'}
                  size={20}
                  color="#4CAF50"
                />
                <Text style={styles.selectAllText}>
                  {selectedProducts.size === filteredProducts.length ? 'Desmarcar todos' : 'Selecionar todos'}
                </Text>
              </TouchableOpacity>

              {(() => {
                const newProductsCount = getNewProductsCount();
                return newProductsCount > 0 ? (
                  <TouchableOpacity
                    style={styles.confirmSelectionButton}
                    onPress={handleConfirmMultipleSelection}
                  >
                    <Text style={styles.confirmSelectionText}>
                      Adicionar {newProductsCount} produto{newProductsCount !== 1 ? 's' : ''}
                    </Text>
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  </TouchableOpacity>
                ) : null;
              })()}
            </View>
          )}

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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  multiSelectButton: {
    padding: 8,
    marginRight: 8,
  },
  selectedProductItem: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  multiSelectControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginBottom: 16,
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  selectAllText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  confirmSelectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  confirmSelectionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  productIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});