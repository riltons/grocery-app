import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Animated,
  Keyboard,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SpecificProduct, GenericProduct } from '../lib/supabase';
import SimpleBarcodeScanner from './SimpleBarcodeScanner';
import ScanResultModal from './ScanResultModal';
import GenericProductSelector from './GenericProductSelector';
import ProductCreationModal from './ProductCreationModal';

import { BarcodeService, ProductInfo, BarcodeResult, GenericProductMatcher, SpecificProductCreationService } from '../lib/barcode';
import { ProductService } from '../lib/products';
import { supabase } from '../lib/supabase';

interface AddProductInterfaceProps {
  onAddProduct: (productName: string, quantity: number, unit: string) => Promise<void>;
  onSelectProduct: (product: SpecificProduct, quantity: number, unit: string) => Promise<void>;
  onSelectGenericProduct: (product: GenericProduct, quantity: number, unit: string) => Promise<void>;
  onCreateNewProduct: (productName: string, quantity: number, unit: string) => Promise<void>;
  onCreateNewProductWithCategory: (productName: string, categoryId: string | null, quantity: number, unit: string) => Promise<void>;
  suggestions: SpecificProduct[];
  loading: boolean;
  currentListProductIds?: string[]; // IDs dos produtos já na lista atual
  currentListProductNames?: string[]; // Nomes dos produtos já na lista atual
  listId?: string; // ID da lista atual para navegação
}

const COMMON_UNITS = ['un', 'kg', 'g', 'L', 'ml', 'pct', 'cx'];
const QUICK_QUANTITIES = [1, 2, 3, 5];

export default function AddProductInterface({
  onAddProduct,
  onSelectProduct,
  onSelectGenericProduct,
  onCreateNewProduct,
  onCreateNewProductWithCategory,
  suggestions,
  loading,
  currentListProductIds = [],
  currentListProductNames = [],
  listId,
}: AddProductInterfaceProps) {
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [selectedUnit, setSelectedUnit] = useState('un');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<SpecificProduct[]>([]);

  const [showAllProducts, setShowAllProducts] = useState(false);
  const [allProducts, setAllProducts] = useState<SpecificProduct[]>([]);
  const [loadingAllProducts, setLoadingAllProducts] = useState(false);
  
  // Scanner states
  const [showScanner, setShowScanner] = useState(false);
  const [showScanResult, setShowScanResult] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<ProductInfo | null>(null);
  const [suggestedGenericProducts, setSuggestedGenericProducts] = useState<GenericProduct[]>([]);
  const [selectedGenericProduct, setSelectedGenericProduct] = useState<GenericProduct | null>(null);
  const [scannerLoading, setScannerLoading] = useState(false);
  
  // Generic product selector states
  const [showGenericSelector, setShowGenericSelector] = useState(false);
  const [genericProducts, setGenericProducts] = useState<GenericProduct[]>([]);
  const [genericSelectorMultiMode, setGenericSelectorMultiMode] = useState(false);
  
  // Product creation modal states
  const [showProductCreationModal, setShowProductCreationModal] = useState(false);
  const [productToCreate, setProductToCreate] = useState('');

  const inputRef = useRef<TextInput>(null);

  // Carregar todos os produtos cadastrados
  const loadAllProducts = async () => {
    try {
      setLoadingAllProducts(true);
      const { data, error } = await ProductService.getSpecificProducts();
      if (error) {
        console.error('Erro ao carregar produtos:', error);
        return;
      }
      if (data) {
        setAllProducts(data);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoadingAllProducts(false);
    }
  };

  // Filtrar sugestões baseado no texto digitado
  useEffect(() => {
    if (productName.length > 1) {
      const filtered = suggestions.filter(product =>
        product.name.toLowerCase().includes(productName.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setShowAllProducts(false); // Esconder lista completa quando há busca
    } else if (productName.length === 0 && showAllProducts) {
      // Mostrar todos os produtos quando campo está vazio e foi focado
      setShowSuggestions(false);
      setFilteredSuggestions([]);
    } else {
      setShowSuggestions(false);
      setFilteredSuggestions([]);
      setShowAllProducts(false);
    }
  }, [productName, suggestions, showAllProducts]);



  const handleAddProduct = async () => {
    if (!productName.trim()) return;

    // Verifica se é um produto existente nas sugestões
    const existingProduct = filteredSuggestions.find(
      p => p.name.toLowerCase() === productName.toLowerCase()
    );

    if (existingProduct) {
      // Se é um produto existente, adiciona diretamente
      const qty = parseFloat(quantity) || 1;
      try {
        await onSelectProduct(existingProduct, qty, selectedUnit);
        // Limpar campos após adicionar
        setProductName('');
        setQuantity('1');
        setSelectedUnit('un');
        Keyboard.dismiss();
      } catch (error) {
        console.error('Erro ao adicionar produto:', error);
      }
    } else {
      // Se é um produto novo, abre o modal para escolher categoria e unidade
      setProductToCreate(productName.trim());
      setShowProductCreationModal(true);
    }
  };

  const handleSuggestionPress = async (product: SpecificProduct) => {
    const qty = parseFloat(quantity) || 1;
    try {
      await onSelectProduct(product, qty, selectedUnit);
      setProductName('');
      setQuantity('1');
      setSelectedUnit('un');
      setShowSuggestions(false);
      Keyboard.dismiss();
    } catch (error) {
      console.error('Erro ao adicionar produto sugerido:', error);
    }
  };



  // Scanner functions
  const handleOpenScanner = () => {
    setShowScanner(true);
  };

  const handleCloseScanner = () => {
    setShowScanner(false);
  };

  const handleManualEntry = () => {
    setShowScanner(false);
    // Focus on the input field for manual entry
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleBarcodeScanned = async (result: BarcodeResult) => {
    console.log('Código de barras escaneado:', result);
    setShowScanner(false);
    setScannerLoading(true);

    try {
      // Primeiro, verificar se o produto já existe no banco de dados local
      const { data: existingProduct } = await ProductService.getSpecificProductByBarcode(result.data);
      
      if (existingProduct) {
        console.log('Produto encontrado no banco local:', existingProduct);
        
        // Produto já existe no banco - adicionar diretamente à lista
        try {
          const qty = parseFloat(quantity) || 1;
          await onSelectProduct(existingProduct, qty, selectedUnit);
          
          // Limpar campos após adicionar
          setQuantity('1');
          setSelectedUnit('un');
          
          console.log('Produto existente adicionado automaticamente à lista');
          return; // Sair da função sem mostrar o modal
        } catch (error) {
          console.error('Erro ao adicionar produto existente automaticamente:', error);
          // Se der erro ao adicionar automaticamente, continuar com o fluxo normal do modal
        }
        
        // Fallback: se não conseguiu adicionar automaticamente, mostrar o modal
        const productInfo: ProductInfo = {
          barcode: existingProduct.barcode || result.data,
          name: existingProduct.name,
          brand: existingProduct.brand || '',
          category: existingProduct.generic_product?.category || '',
          description: existingProduct.description || '',
          image_url: existingProduct.image_url || '',
          data_source: 'local_database',
          confidence_score: 1.0
        };
        
        setScannedProduct(productInfo);
        
        // Se tem produto genérico associado, usar ele
        if (existingProduct.generic_product) {
          console.log('Produto genérico encontrado:', existingProduct.generic_product);
          setSelectedGenericProduct(existingProduct.generic_product);
          setSuggestedGenericProducts([existingProduct.generic_product]);
        } else {
          // Se não tem produto genérico, tentar vinculação automática
          const autoLinkResult = await SpecificProductCreationService.autoLinkToGenericProduct(productInfo);
          
          if (autoLinkResult.success && autoLinkResult.genericProduct) {
            console.log(`Vinculação automática: ${autoLinkResult.reason}`);
            setSelectedGenericProduct(autoLinkResult.genericProduct);
            setSuggestedGenericProducts([autoLinkResult.genericProduct]);
          } else {
            console.log(`Vinculação automática falhou: ${autoLinkResult.reason}`);
            const suggestions = await GenericProductMatcher.suggestGenericProducts(
              productInfo.name, 
              productInfo.category
            );
            const genericProducts = suggestions.map(s => s.product);
            setSuggestedGenericProducts(genericProducts);
            
            if (suggestions.length > 0) {
              setSelectedGenericProduct(suggestions[0].product);
            }
          }
        }
      } else {
        // Se não existe no banco local, buscar nas APIs externas
        const searchResult = await BarcodeService.searchWithFallback(result.data);
        let productInfo = searchResult.found ? searchResult.product : null;
        
        // Se não encontrou o produto, criar um produto básico com o código de barras
        if (!productInfo) {
          productInfo = {
            barcode: result.data,
            name: `Produto ${result.data}`,
            brand: '',
            category: '',
            description: '',
            image_url: '',
            data_source: 'manual',
            confidence_score: 0.5
          };
        }
        
        setScannedProduct(productInfo);
        
        // Usar vinculação automática melhorada
        const autoLinkResult = await SpecificProductCreationService.autoLinkToGenericProduct(productInfo);
        
        if (autoLinkResult.success && autoLinkResult.genericProduct) {
          // Vinculação automática bem-sucedida
          console.log(`Vinculação automática: ${autoLinkResult.reason}`);
          setSelectedGenericProduct(autoLinkResult.genericProduct);
          setSuggestedGenericProducts([autoLinkResult.genericProduct]);
        } else {
          // Fallback para o método anterior se a vinculação automática falhar
          console.log(`Vinculação automática falhou: ${autoLinkResult.reason}`);
          const suggestions = await GenericProductMatcher.suggestGenericProducts(
            productInfo.name, 
            productInfo.category
          );
          const genericProducts = suggestions.map(s => s.product);
          setSuggestedGenericProducts(genericProducts);
          
          if (suggestions.length > 0) {
            setSelectedGenericProduct(suggestions[0].product);
          }
        }
      }
      
      setShowScanResult(true);
    } catch (error) {
      console.error('Erro ao processar código de barras:', error);
      // Fallback to manual entry
      handleManualEntry();
    } finally {
      setScannerLoading(false);
    }
  };

  const handleScanResultConfirm = async (
    product: ProductInfo, 
    genericProduct: GenericProduct | null, 
    priceInfo?: any
  ) => {
    try {
      setScannerLoading(true);
      
      // If no generic product is selected, create one automatically
      let genericProductId = genericProduct?.id;
      
      if (!genericProductId) {
        console.log('Nenhum produto genérico selecionado, criando automaticamente...');
        
        // Ensure user is authenticated before creating generic product
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) {
          Alert.alert('Erro', 'Usuário não autenticado. Faça login novamente.');
          return;
        }
        
        // Create generic product automatically
        const genericResult = await SpecificProductCreationService.createGenericProductFromProductInfo(product);
        
        if (genericResult.success && genericResult.product) {
          genericProductId = genericResult.product.id;
          console.log('Produto genérico criado automaticamente:', genericResult.product.name);
        } else {
          console.error('Erro ao criar produto genérico:', genericResult.errors);
          Alert.alert(
            'Erro', 
            `Não foi possível criar o produto genérico automaticamente:\n${genericResult.errors.join('\n')}`
          );
          return;
        }
      }
      
      // Use the validation function that checks for duplicates
      const result = await SpecificProductCreationService.createSpecificProductWithValidation(
        product, 
        genericProductId,
        { createGenericIfNotExists: true }
      );
      
      if (result.success && result.product) {
        // TODO: Handle price info separately if needed
        if (priceInfo) {
          console.log('Price info received:', priceInfo);
        }
        
        const qty = parseFloat(quantity) || 1;
        await onSelectProduct(result.product, qty, selectedUnit);
        
        // Reset scanner state
        setShowScanResult(false);
        setScannedProduct(null);
        setSuggestedGenericProducts([]);
        setSelectedGenericProduct(null);
        
        // Reset form
        setQuantity('1');
        setSelectedUnit('un');
      } else if (result.errors && result.errors.length > 0) {
        // Handle duplicate or validation errors
        if (result.errors.some(error => error.includes('já existe'))) {
          Alert.alert(
            'Produto já existe',
            'Este produto já foi adicionado anteriormente. Deseja usar o produto existente?',
            [
              { text: 'Cancelar', style: 'cancel' },
              { 
                text: 'Usar existente', 
                onPress: async () => {
                  // Try to find the existing product and use it
                  try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                      const { data: existingProduct } = await supabase
                        .from('specific_products')
                        .select('*')
                        .eq('barcode', product.barcode)
                        .eq('user_id', user.id)
                        .single();
                      
                      if (existingProduct) {
                        const qty = parseFloat(quantity) || 1;
                        await onSelectProduct(existingProduct, qty, selectedUnit);
                        
                        // Reset scanner state
                        setShowScanResult(false);
                        setScannedProduct(null);
                        setSuggestedGenericProducts([]);
                        setSelectedGenericProduct(null);
                        
                        // Reset form
                        setQuantity('1');
                        setSelectedUnit('un');
                      }
                    }
                  } catch (error) {
                    console.error('Erro ao buscar produto existente:', error);
                    Alert.alert('Erro', 'Não foi possível encontrar o produto existente');
                  }
                }
              }
            ]
          );
        } else {
          Alert.alert('Erro', result.errors.join('\n'));
        }
      }
    } catch (error) {
      console.error('Erro ao confirmar produto escaneado:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao processar o produto escaneado');
    } finally {
      setScannerLoading(false);
    }
  };

  const handleScanResultCancel = () => {
    setShowScanResult(false);
    setScannedProduct(null);
    setSuggestedGenericProducts([]);
    setSelectedGenericProduct(null);
  };

  const handleScanResultEdit = (editedProduct: ProductInfo) => {
    setScannedProduct(editedProduct);
  };

  const handleGenericProductChange = (genericProduct: GenericProduct) => {
    setSelectedGenericProduct(genericProduct);
  };

  // Generic product functions
  const handleOpenGenericSelector = (multiMode = false) => {
    setGenericSelectorMultiMode(multiMode);
    setShowGenericSelector(true);
    loadGenericProducts();
  };

  const handleCloseGenericSelector = () => {
    setShowGenericSelector(false);
    setGenericSelectorMultiMode(false);
  };

  const loadGenericProducts = async () => {
    try {
      const { data, error } = await ProductService.getGenericProducts();
      if (error) {
        console.error('Erro ao carregar produtos genéricos:', error);
        return;
      }
      if (data) {
        setGenericProducts(data);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos genéricos:', error);
    }
  };

  const handleSelectGenericProduct = async (product: GenericProduct) => {
    const qty = parseFloat(quantity) || 1;
    try {
      await onSelectGenericProduct(product, qty, selectedUnit);
      setShowGenericSelector(false);
      setQuantity('1');
      setSelectedUnit('un');
      Keyboard.dismiss();
    } catch (error) {
      console.error('Erro ao adicionar produto genérico:', error);
    }
  };

  const handleSelectMultipleGenericProducts = async (products: GenericProduct[]) => {
    const qty = parseFloat(quantity) || 1;
    try {
      // Adicionar todos os produtos genéricos selecionados
      for (const product of products) {
        await onSelectGenericProduct(product, qty, selectedUnit);
      }
      setShowGenericSelector(false);
      setQuantity('1');
      setSelectedUnit('un');
      Keyboard.dismiss();
    } catch (error) {
      console.error('Erro ao adicionar produtos genéricos múltiplos:', error);
    }
  };

  // Product creation modal functions
  const handleProductCreationConfirm = async (productName: string, categoryId: string | null, unit: string, quantity: number) => {
    try {
      await onCreateNewProductWithCategory(productName, categoryId, quantity, unit);
      
      // Fechar modal e limpar campos
      setShowProductCreationModal(false);
      setProductToCreate('');
      setProductName('');
      setQuantity('1');
      setSelectedUnit('un');
      Keyboard.dismiss();
    } catch (error) {
      console.error('Erro ao criar produto:', error);
    }
  };

  const handleProductCreationCancel = () => {
    setShowProductCreationModal(false);
    setProductToCreate('');
  };

  const renderSuggestion = ({ item }: { item: SpecificProduct }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionPress(item)}
    >
      <Ionicons name="search" size={16} color="#666" />
      <Text style={styles.suggestionText}>{item.name}</Text>
      {item.brand && <Text style={styles.suggestionBrand}>{item.brand}</Text>}
    </TouchableOpacity>
  );



  const renderProductItem = ({ item }: { item: SpecificProduct }) => (
    <TouchableOpacity
      style={styles.productItem}
      onPress={() => handleSuggestionPress(item)}
    >
      <View style={styles.productItemInfo}>
        <Text style={styles.productItemName}>{item.name}</Text>
        {item.brand && (
          <Text style={styles.productItemBrand}>{item.brand}</Text>
        )}
        {item.barcode && (
          <View style={styles.productItemBarcodeContainer}>
            <Ionicons name="barcode-outline" size={12} color="#4CAF50" />
            <Text style={styles.productItemBarcode}>{item.barcode}</Text>
          </View>
        )}
      </View>
      <Ionicons name="add-circle-outline" size={20} color="#4CAF50" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Interface Principal */}
      <View style={styles.mainInterface}>
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              style={styles.productInput}
              placeholder="O que você precisa comprar?"
              value={productName}
              onChangeText={setProductName}
              onFocus={() => {
                if (productName.length === 0) {
                  loadAllProducts();
                  setShowAllProducts(true);
                }
              }}
              onBlur={() => {
                // Delay para permitir que o toque nos itens funcione
                setTimeout(() => {
                  setShowAllProducts(false);
                }, 150);
              }}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleAddProduct}
            />
            
            <TouchableOpacity
              style={styles.genericButton}
              onPress={() => handleOpenGenericSelector(true)}
              disabled={loading}
            >
              <Ionicons name="list-outline" size={20} color="#FF9800" />
            </TouchableOpacity>



            <TouchableOpacity
              style={styles.scannerButton}
              onPress={handleOpenScanner}
              disabled={loading}
            >
              <Ionicons name="barcode-outline" size={20} color="#4CAF50" />
            </TouchableOpacity>
            

          </View>

          {/* Sugestões */}
          {showSuggestions && (
            <View style={styles.suggestionsContainer}>
              <FlatList
                data={filteredSuggestions.slice(0, 3)}
                renderItem={renderSuggestion}
                keyExtractor={(item) => item.id}
                style={styles.suggestionsList}
              />
            </View>
          )}

          {/* Lista completa de produtos */}
          {showAllProducts && productName.length === 0 && (
            <View style={styles.allProductsContainer}>
              <View style={styles.allProductsHeader}>
                <Text style={styles.allProductsTitle}>Produtos cadastrados</Text>
                <TouchableOpacity 
                  onPress={() => setShowAllProducts(false)}
                  style={styles.closeAllProductsButton}
                >
                  <Ionicons name="close" size={16} color="#666" />
                </TouchableOpacity>
              </View>
              {loadingAllProducts ? (
                <View style={styles.loadingAllProductsContainer}>
                  <ActivityIndicator size="small" color="#4CAF50" />
                  <Text style={styles.loadingAllProductsText}>Carregando produtos...</Text>
                </View>
              ) : allProducts.length === 0 ? (
                <View style={styles.emptyAllProductsContainer}>
                  <Ionicons name="cube-outline" size={32} color="#ccc" />
                  <Text style={styles.emptyAllProductsText}>Nenhum produto cadastrado</Text>
                  <Text style={styles.emptyAllProductsSubtext}>
                    Use o scanner ou digite para criar produtos
                  </Text>
                </View>
              ) : (
                <>
                  <FlatList
                    data={allProducts.slice(0, 10)} // Limitar a 10 produtos para performance
                    renderItem={renderProductItem}
                    keyExtractor={(item) => item.id}
                    style={styles.allProductsList}
                    showsVerticalScrollIndicator={false}
                  />
                  {allProducts.length > 10 && (
                    <Text style={styles.moreProductsText}>
                      E mais {allProducts.length - 10} produtos... Digite para buscar
                    </Text>
                  )}
                </>
              )}
            </View>
          )}
        </View>



        {/* Botão Adicionar */}
        <TouchableOpacity
          style={[
            styles.addButton,
            !productName.trim() && styles.addButtonDisabled,
          ]}
          onPress={handleAddProduct}
          disabled={!productName.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Adicionar</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Barcode Scanner Modal */}
      <Modal
        visible={showScanner}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleCloseScanner}
      >
        <SimpleBarcodeScanner
          onBarcodeScanned={handleBarcodeScanned}
          onClose={handleCloseScanner}
          onManualEntry={handleManualEntry}
        />
      </Modal>

      {/* Scan Result Modal */}
      <ScanResultModal
        visible={showScanResult}
        productInfo={scannedProduct}
        suggestedGenericProducts={suggestedGenericProducts}
        selectedGenericProduct={selectedGenericProduct}
        onConfirm={handleScanResultConfirm}
        onEdit={handleScanResultEdit}
        onGenericProductChange={handleGenericProductChange}
        onCancel={handleScanResultCancel}
        loading={scannerLoading}
      />

      {/* Generic Product Selector Modal */}
      <GenericProductSelector
        visible={showGenericSelector}
        onClose={handleCloseGenericSelector}
        onSelectProduct={handleSelectGenericProduct}
        onSelectMultipleProducts={handleSelectMultipleGenericProducts}
        suggestedProducts={genericProducts.slice(0, 5)} // Passar produtos carregados como sugestões
        searchQuery={productName}
        allowMultipleSelection={genericSelectorMultiMode}
        currentListProductNames={currentListProductNames}
        listId={listId}
      />

      {/* Product Creation Modal */}
      <ProductCreationModal
        visible={showProductCreationModal}
        onClose={handleProductCreationCancel}
        onConfirm={handleProductCreationConfirm}
        productName={productToCreate}
        loading={loading}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  mainInterface: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  inputContainer: {
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productInput: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  genericButton: {
    marginLeft: 8,
    padding: 8,
    backgroundColor: '#fff3e0',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FF9800',
  },

  scannerButton: {
    marginLeft: 8,
    padding: 8,
    backgroundColor: '#f0f8f1',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  suggestionsContainer: {
    marginTop: 8,
  },
  suggestionsList: {
    maxHeight: 120,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  suggestionText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  suggestionBrand: {
    fontSize: 12,
    color: '#666',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  addButtonDisabled: {
    backgroundColor: '#a5d6a7',
    opacity: 0.7,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  allProductsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    maxHeight: 300,
  },
  allProductsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  allProductsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  closeAllProductsButton: {
    padding: 4,
  },
  allProductsList: {
    maxHeight: 240,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  productItemInfo: {
    flex: 1,
  },
  productItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  productItemBrand: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  productItemBarcodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productItemBarcode: {
    fontSize: 10,
    color: '#4CAF50',
    marginLeft: 4,
    fontFamily: 'monospace',
  },
  moreProductsText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 8,
    fontStyle: 'italic',
  },
  loadingAllProductsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingAllProductsText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  emptyAllProductsContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyAllProductsText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontWeight: '500',
  },
  emptyAllProductsSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
});