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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProductService } from '../lib/products';
import { CategoryService, Category } from '../lib/categories';
import { GenericProduct, supabase } from '../lib/supabase';

interface GenericProductSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelectProduct: (product: GenericProduct) => void;
  onSelectMultipleProducts?: (products: GenericProduct[]) => void;
  suggestedProducts?: GenericProduct[];
  searchQuery?: string;
  allowMultipleSelection?: boolean;
  currentListProductNames?: string[]; // Nomes dos produtos já na lista atual
}

export default function GenericProductSelector({
  visible,
  onClose,
  onSelectProduct,
  onSelectMultipleProducts,
  suggestedProducts = [],
  searchQuery = '',
  allowMultipleSelection = false,
  currentListProductNames = [],
}: GenericProductSelectorProps) {
  const [products, setProducts] = useState<GenericProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<GenericProduct[]>([]);
  const [searchText, setSearchText] = useState(searchQuery);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Memoizar a string da lista para evitar re-renders desnecessários
  const currentListProductNamesString = useMemo(() => 
    currentListProductNames.join(','), [currentListProductNames]
  );

  // Função para carregar categorias
  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const { data, error } = await CategoryService.getCategories();
      
      if (error) {
        console.error('Erro ao carregar categorias:', error);
        return;
      }
      
      if (data) {
        setCategories(data);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Load products when modal opens
  useEffect(() => {
    if (visible) {
      fetchProducts();
      loadCategories(); // Carregar categorias também
      setSearchText(searchQuery);
      setShowCreateForm(false);
      setNewProductName('');
      setNewProductCategory('');
      setSelectedProducts(new Set());
      setIsMultiSelectMode(allowMultipleSelection);
      
      // Se está em modo múltiplo e há produtos na lista atual, ativar automaticamente
      if (allowMultipleSelection && currentListProductNames.length > 0) {
        setIsMultiSelectMode(true);
      }
    }
  }, [visible, searchQuery, allowMultipleSelection, currentListProductNamesString]);

  // Recarregar produtos quando a lista atual mudar
  useEffect(() => {
    if (visible) {
      console.log('🔄 GENERIC SELECTOR - Lista atual mudou, recarregando...');
      fetchProducts();
    }
  }, [currentListProductNamesString, visible]);

  // Atualizar seleção quando a lista de produtos atuais mudar (mesmo com modal aberto)
  useEffect(() => {
    if (visible && allowMultipleSelection && products.length > 0) {
      // Manter produtos da lista atual sempre selecionados
      setSelectedProducts(prevSelected => {
        const newSelected = new Set(prevSelected);
        
        // Adicionar produtos por nome (produtos genéricos já na lista)
        products.forEach(product => {
          if (currentListProductNames.includes(product.name)) {
            newSelected.add(product.id);
          }
        });
        
        return newSelected;
      });
      
      // Se há produtos na lista, ativar modo múltiplo automaticamente
      if (currentListProductNames.length > 0) {
        setIsMultiSelectMode(true);
      }
    }
  }, [currentListProductNamesString, visible, allowMultipleSelection, products]);

  // Filter products when search text changes
  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (product.category && product.category.toLowerCase().includes(searchText.toLowerCase()))
      );
      setFilteredProducts(filtered);
    }
  }, [searchText, products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      console.log('🆕 GENERIC SELECTOR - Carregando produtos genéricos...');
      console.log('  Produtos na lista atual:', currentListProductNames);
      
      const { data, error } = await ProductService.getGenericProducts();
      
      if (error) {
        console.error('Erro ao buscar produtos genéricos:', error);
        Alert.alert('Erro', 'Não foi possível carregar os produtos');
        return;
      }
      
      if (data) {
        console.log(`📦 Total de produtos genéricos no banco: ${data.length}`);
        
        // Filtrar produtos que NÃO estão na lista atual
        const availableProducts = data.filter(product => {
          const productName = product.name.toLowerCase().trim();
          const isInList = currentListProductNames.some(listName => 
            listName.toLowerCase().trim() === productName
          );
          
          console.log(`${isInList ? '❌' : '✅'} ${product.name} - ${isInList ? 'EXCLUÍDO' : 'DISPONÍVEL'}`);
          
          return !isInList;
        });
        
        console.log(`✅ Produtos genéricos disponíveis: ${availableProducts.length}`);
        console.log('Produtos:', availableProducts.map(p => p.name).slice(0, 5));
        
        setProducts(availableProducts);
        setFilteredProducts(availableProducts);
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      Alert.alert('Erro', 'Ocorreu um erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = (product: GenericProduct) => {
    if (allowMultipleSelection && isMultiSelectMode) {
      // Modo de seleção múltipla
      const newSelected = new Set(selectedProducts);
      const isInCurrentList = currentListProductNames.includes(product.name);
      
      if (newSelected.has(product.id)) {
        // Se o produto está na lista atual, não permitir desmarcar
        if (!isInCurrentList) {
          newSelected.delete(product.id);
        }
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
    if (onSelectMultipleProducts) {
      const selectedProductsList = products.filter(p => selectedProducts.has(p.id));
      onSelectMultipleProducts(selectedProductsList);
      onClose();
    }
  };

  const handleToggleMultiSelectMode = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    setSelectedProducts(new Set());
  };

  const handleSelectAll = () => {
    // Contar apenas produtos que não estão na lista atual para determinar se "todos" estão selecionados
    const selectableProducts = filteredProducts.filter(p => !currentListProductNames.includes(p.name));
    const selectableSelected = selectableProducts.filter(p => selectedProducts.has(p.id));
    
    if (selectableSelected.length === selectableProducts.length) {
      // Se todos os produtos selecionáveis estão marcados, desmarcar apenas eles
      const newSelected = new Set(selectedProducts);
      selectableProducts.forEach(p => newSelected.delete(p.id));
      
      // Manter produtos da lista atual sempre selecionados
      products.forEach(product => {
        if (currentListProductNames.includes(product.name)) {
          newSelected.add(product.id);
        }
      });
      
      setSelectedProducts(newSelected);
    } else {
      // Selecionar todos os produtos filtrados + manter produtos da lista atual
      const allIds = new Set([
        ...filteredProducts.map(p => p.id),
        ...products.filter(p => currentListProductNames.includes(p.name)).map(p => p.id)
      ]);
      setSelectedProducts(allIds);
    }
  };

  const handleCreateProduct = async () => {
    if (!newProductName.trim()) {
      Alert.alert('Erro', 'Digite o nome do produto');
      return;
    }

    if (!newProductCategory.trim()) {
      Alert.alert('Erro', 'Selecione uma categoria');
      return;
    }

    try {
      setCreating(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        Alert.alert('Erro', 'Usuário não autenticado. Faça login novamente.');
        return;
      }
      
      const { data, error } = await ProductService.createGenericProduct({
        name: newProductName.trim(),
        category: newProductCategory,
        user_id: user.id,
      });

      if (error) {
        console.error('Erro ao criar produto genérico:', error);
        Alert.alert('Erro', 'Não foi possível criar o produto');
        return;
      }

      if (data) {
        // Add to local state
        setProducts(prev => [data, ...prev]);
        setFilteredProducts(prev => [data, ...prev]);
        
        // Select the new product
        handleSelectProduct(data);
      }
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      Alert.alert('Erro', 'Ocorreu um erro inesperado');
    } finally {
      setCreating(false);
    }
  };

  const handleShowCreateForm = () => {
    setNewProductName(searchText);
    setShowCreateForm(true);
  };

  const handleCancelCreate = () => {
    setShowCreateForm(false);
    setNewProductName('');
    setNewProductCategory('');
  };

  const renderProductItem = ({ item }: { item: GenericProduct }) => {
    const isSelected = selectedProducts.has(item.id);
    const isInCurrentList = currentListProductNames.includes(item.name);
    
    return (
      <TouchableOpacity
        style={[
          styles.productItem,
          isSelected && styles.selectedProductItem,
          isInCurrentList && styles.inListProductItem
        ]}
        onPress={() => handleSelectProduct(item)}
      >
        <View style={styles.productInfo}>
          <View style={styles.productHeader}>
            <Text style={styles.productName}>{item.name}</Text>
            {isInCurrentList && (
              <View style={styles.inListIndicator}>
                <Ionicons name="checkmark-circle" size={16} color="#FF9800" />
              </View>
            )}
          </View>
          {item.category && (
            <Text style={styles.productCategory}>{item.category}</Text>
          )}
          {isInCurrentList && (
            <Text style={styles.inListText}>Já na lista</Text>
          )}
        </View>
        
        {allowMultipleSelection && isMultiSelectMode ? (
          <Ionicons 
            name={
              isInCurrentList 
                ? 'checkmark-circle' // Ícone diferente para produtos já na lista (não desmarcável)
                : isSelected 
                  ? 'checkbox' 
                  : 'square-outline'
            } 
            size={24} 
            color={
              isInCurrentList 
                ? '#FF9800' // Cor laranja para produtos já na lista
                : isSelected 
                  ? '#4CAF50' 
                  : '#94a3b8'
            } 
          />
        ) : (
          <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
        )}
      </TouchableOpacity>
    );
  };

  const renderSuggestedItem = ({ item }: { item: GenericProduct }) => (
    <TouchableOpacity
      style={styles.suggestedItem}
      onPress={() => handleSelectProduct(item)}
    >
      <View style={styles.suggestedInfo}>
        <Text style={styles.suggestedName}>{item.name}</Text>
        {item.category && (
          <Text style={styles.suggestedCategory}>{item.category}</Text>
        )}
      </View>
      <View style={styles.suggestedBadge}>
        <Text style={styles.suggestedBadgeText}>Sugerido</Text>
      </View>
    </TouchableOpacity>
  );

  const renderSuggestedBadge = ({ item }: { item: GenericProduct }) => (
    <TouchableOpacity
      style={styles.suggestedBadgeItem}
      onPress={() => handleSelectProduct(item)}
    >
      <Text style={styles.suggestedBadgeItemText}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        newProductCategory === item.name && styles.categoryItemSelected
      ]}
      onPress={() => setNewProductCategory(item.name)}
    >
      <Text style={[
        styles.categoryText,
        newProductCategory === item.name && styles.categoryTextSelected
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {showCreateForm 
              ? 'Novo Produto' 
              : isMultiSelectMode 
                ? `Selecionados (${selectedProducts.size})` 
                : 'Selecionar Produto'
            }
          </Text>
          {showCreateForm ? (
            <TouchableOpacity onPress={handleCreateProduct} disabled={creating}>
              <Text style={[styles.saveButton, creating && styles.disabledButton]}>
                {creating ? 'Criando...' : 'Criar'}
              </Text>
            </TouchableOpacity>
          ) : allowMultipleSelection ? (
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
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>

        {showCreateForm ? (
          /* Create Form */
          <View style={styles.createForm}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nome do Produto</Text>
              <TextInput
                style={styles.textInput}
                value={newProductName}
                onChangeText={setNewProductName}
                placeholder="Ex: Arroz, Feijão, Leite..."
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Categoria</Text>
              <FlatList
                data={categories}
                renderItem={renderCategoryItem}
                keyExtractor={(item) => item.id}
                numColumns={2}
                style={styles.categoriesList}
                columnWrapperStyle={styles.categoriesRow}
              />
            </View>

            <TouchableOpacity
              style={styles.cancelCreateButton}
              onPress={handleCancelCreate}
            >
              <Text style={styles.cancelCreateText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Search and List */
          <View style={styles.content}>
            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#94a3b8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar produtos..."
                value={searchText}
                onChangeText={setSearchText}
                autoFocus
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText('')}>
                  <Ionicons name="close-circle" size={20} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>

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
                    {(() => {
                      const selectableProducts = filteredProducts.filter(p => !currentListProductNames.includes(p.name));
                      const selectableSelected = selectableProducts.filter(p => selectedProducts.has(p.id));
                      return selectableSelected.length === selectableProducts.length ? 'Desmarcar novos' : 'Selecionar todos';
                    })()}
                  </Text>
                </TouchableOpacity>
                
                {selectedProducts.size > 0 && (
                  <TouchableOpacity
                    style={styles.confirmSelectionButton}
                    onPress={handleConfirmMultipleSelection}
                  >
                    <Text style={styles.confirmSelectionText}>
                      Adicionar {selectedProducts.size} produtos
                    </Text>
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>Carregando produtos...</Text>
              </View>
            ) : (
              <View style={styles.listContainer}>
                {/* Suggested Products */}
                {suggestedProducts.length > 0 && searchText.trim() === '' && (
                  <View style={styles.suggestedSection}>
                    <Text style={styles.sectionTitle}>Sugestões</Text>
                    <FlatList
                      data={suggestedProducts.slice(0, 10)} // Limitar a 10 sugestões
                      renderItem={renderSuggestedBadge}
                      keyExtractor={(item) => item.id}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.suggestedBadgesList}
                    />
                  </View>
                )}

                {/* All Products */}
                <View style={styles.allProductsSection}>
                  <Text style={styles.sectionTitle}>
                    {searchText.trim() ? 'Resultados da Busca' : 'Todos os Produtos'}
                  </Text>
                  
                  {filteredProducts.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Ionicons name="search" size={48} color="#cbd5e1" />
                      <Text style={styles.emptyTitle}>
                        {searchText.trim() ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
                      </Text>
                      <Text style={styles.emptyDescription}>
                        {searchText.trim() 
                          ? 'Tente buscar com outros termos ou crie um novo produto'
                          : 'Crie seu primeiro produto genérico'
                        }
                      </Text>
                      <TouchableOpacity
                        style={styles.createButton}
                        onPress={handleShowCreateForm}
                      >
                        <Ionicons name="add" size={20} color="#fff" />
                        <Text style={styles.createButtonText}>
                          Criar Produto{searchText.trim() ? ` "${searchText}"` : ''}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      <FlatList
                        data={filteredProducts}
                        renderItem={renderProductItem}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={true}
                        style={styles.productsList}
                        contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
                        nestedScrollEnabled={true}
                      />
                      
                      {/* Create New Option */}
                      {searchText.trim() && (
                        <TouchableOpacity
                          style={styles.createNewOption}
                          onPress={handleShowCreateForm}
                        >
                          <Ionicons name="add-circle-outline" size={24} color="#4CAF50" />
                          <Text style={styles.createNewText}>
                            Criar "{searchText}"
                          </Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    height: '100%',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  cancelButton: {
    fontSize: 16,
    color: '#64748b',
  },
  saveButton: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  disabledButton: {
    color: '#94a3b8',
  },
  headerSpacer: {
    width: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 12,
  },
  listContainer: {
    flex: 1,
  },
  suggestedSection: {
    marginBottom: 16,
  },
  allProductsSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  suggestedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#0ea5e9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  suggestedInfo: {
    flex: 1,
  },
  suggestedName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0c4a6e',
    marginBottom: 2,
  },
  suggestedCategory: {
    fontSize: 14,
    color: '#0369a1',
  },
  suggestedBadge: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  suggestedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  suggestedBadgesList: {
    paddingRight: 16,
    paddingBottom: 8,
  },
  suggestedBadgeItem: {
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#0ea5e9',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    maxWidth: 120,
  },
  suggestedBadgeItemText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0369a1',
    textAlign: 'center',
  },
  productsList: {
    flex: 1,
    minHeight: 200,
    maxHeight: 400,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
  productCategory: {
    fontSize: 14,
    color: '#64748b',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  createNewOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  createNewText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4CAF50',
    marginLeft: 8,
  },
  createForm: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  categoriesList: {
    maxHeight: 200,
  },
  categoriesRow: {
    justifyContent: 'space-between',
  },
  categoryItem: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  categoryItemSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  categoryTextSelected: {
    color: '#ffffff',
  },
  cancelCreateButton: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  cancelCreateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748b',
  },
  multiSelectButton: {
    padding: 8,
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
    borderTopColor: '#e2e8f0',
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
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
  inListProductItem: {
    backgroundColor: '#fff3e0',
    borderColor: '#FF9800',
    borderWidth: 1,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inListIndicator: {
    backgroundColor: '#fff3e0',
    borderRadius: 12,
    padding: 4,
  },
  inListText: {
    fontSize: 11,
    color: '#FF9800',
    marginTop: 2,
    fontWeight: '500',
  },
});