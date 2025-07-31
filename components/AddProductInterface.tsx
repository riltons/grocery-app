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
import { BarcodeService, ProductInfo, BarcodeResult, GenericProductMatcher, SpecificProductCreationService } from '../lib/barcode';
import { supabase } from '../lib/supabase';

interface AddProductInterfaceProps {
  onAddProduct: (productName: string, quantity: number, unit: string) => Promise<void>;
  onSelectProduct: (product: SpecificProduct, quantity: number, unit: string) => Promise<void>;
  onCreateNewProduct: (productName: string, quantity: number, unit: string) => Promise<void>;
  suggestions: SpecificProduct[];
  frequentProducts: SpecificProduct[];
  loading: boolean;
}

const COMMON_UNITS = ['un', 'kg', 'g', 'L', 'ml', 'pct', 'cx'];
const QUICK_QUANTITIES = [1, 2, 3, 5];

export default function AddProductInterface({
  onAddProduct,
  onSelectProduct,
  onCreateNewProduct,
  suggestions,
  frequentProducts,
  loading,
}: AddProductInterfaceProps) {
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [selectedUnit, setSelectedUnit] = useState('un');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<SpecificProduct[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Scanner states
  const [showScanner, setShowScanner] = useState(false);
  const [showScanResult, setShowScanResult] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<ProductInfo | null>(null);
  const [suggestedGenericProducts, setSuggestedGenericProducts] = useState<GenericProduct[]>([]);
  const [selectedGenericProduct, setSelectedGenericProduct] = useState<GenericProduct | null>(null);
  const [scannerLoading, setScannerLoading] = useState(false);
  
  const slideAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  // Filtrar sugestões baseado no texto digitado
  useEffect(() => {
    if (productName.length > 1) {
      const filtered = suggestions.filter(product =>
        product.name.toLowerCase().includes(productName.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
      setFilteredSuggestions([]);
    }
  }, [productName, suggestions]);

  // Animação para expandir/contrair interface
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: true, // Usa native driver para melhor performance
    }).start();
  }, [isExpanded]);

  const handleAddProduct = async () => {
    if (!productName.trim()) return;

    const qty = parseFloat(quantity) || 1;
    
    // Verifica se é um produto existente nas sugestões
    const existingProduct = filteredSuggestions.find(
      p => p.name.toLowerCase() === productName.toLowerCase()
    );

    try {
      if (existingProduct) {
        await onSelectProduct(existingProduct, qty, selectedUnit);
      } else {
        await onCreateNewProduct(productName.trim(), qty, selectedUnit);
      }
      
      // Limpar campos após adicionar
      setProductName('');
      setQuantity('1');
      setSelectedUnit('un');
      setIsExpanded(false);
      Keyboard.dismiss();
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
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
      setIsExpanded(false);
      Keyboard.dismiss();
    } catch (error) {
      console.error('Erro ao adicionar produto sugerido:', error);
    }
  };

  const handleFrequentProductPress = async (product: SpecificProduct) => {
    const qty = parseFloat(quantity) || 1;
    try {
      await onSelectProduct(product, qty, selectedUnit);
    } catch (error) {
      console.error('Erro ao adicionar produto frequente:', error);
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
      setIsExpanded(true);
    }, 100);
  };

  const handleBarcodeScanned = async (result: BarcodeResult) => {
    console.log('Código de barras escaneado:', result);
    setShowScanner(false);
    setScannerLoading(true);

    try {
      // Process the barcode using BarcodeService
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
      
      // Get suggested generic products
      const suggestions = await GenericProductMatcher.suggestGenericProducts(
        productInfo.name, 
        productInfo.category
      );
      // Extract just the GenericProduct objects from the suggestions
      const genericProducts = suggestions.map(s => s.product);
      setSuggestedGenericProducts(genericProducts);
      
      // Try to auto-select a generic product
      if (suggestions.length > 0) {
        setSelectedGenericProduct(suggestions[0].product);
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
        setIsExpanded(false);
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
                        setIsExpanded(false);
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

  const renderFrequentProduct = ({ item }: { item: SpecificProduct }) => (
    <TouchableOpacity
      style={styles.frequentProductChip}
      onPress={() => handleFrequentProductPress(item)}
    >
      <Text style={styles.frequentProductText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Produtos Frequentes */}
      {frequentProducts.length > 0 && !isExpanded && (
        <View style={styles.frequentSection}>
          <Text style={styles.sectionTitle}>Produtos frequentes</Text>
          <FlatList
            data={frequentProducts.slice(0, 5)}
            renderItem={renderFrequentProduct}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.frequentList}
          />
        </View>
      )}

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
              onFocus={() => setIsExpanded(true)}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleAddProduct}
            />
            
            <TouchableOpacity
              style={styles.scannerButton}
              onPress={handleOpenScanner}
              disabled={loading}
            >
              <Ionicons name="barcode-outline" size={20} color="#4CAF50" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => setIsExpanded(!isExpanded)}
            >
              <Ionicons 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#4CAF50" 
              />
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
        </View>

        {/* Controles Expandidos */}
        {isExpanded && (
          <Animated.View
            style={[
              styles.expandedControls,
              {
                opacity: slideAnim,
              },
            ]}
          >
            {/* Quantidade */}
            <View style={styles.quantitySection}>
              <Text style={styles.controlLabel}>Quantidade</Text>
              <View style={styles.quantityControls}>
                {QUICK_QUANTITIES.map((qty) => (
                  <TouchableOpacity
                    key={qty}
                    style={[
                      styles.quickQuantityButton,
                      quantity === qty.toString() && styles.quickQuantitySelected,
                    ]}
                    onPress={() => setQuantity(qty.toString())}
                  >
                    <Text
                      style={[
                        styles.quickQuantityText,
                        quantity === qty.toString() && styles.quickQuantityTextSelected,
                      ]}
                    >
                      {qty}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TextInput
                  style={styles.customQuantityInput}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  placeholder="Qtd"
                />
              </View>
            </View>

            {/* Unidade */}
            <View style={styles.unitSection}>
              <Text style={styles.controlLabel}>Unidade</Text>
              <FlatList
                data={COMMON_UNITS}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.unitButton,
                      selectedUnit === item && styles.unitButtonSelected,
                    ]}
                    onPress={() => setSelectedUnit(item)}
                  >
                    <Text
                      style={[
                        styles.unitButtonText,
                        selectedUnit === item && styles.unitButtonTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.unitsList}
              />
            </View>
          </Animated.View>
        )}

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
  frequentSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  frequentList: {
    paddingRight: 16,
  },
  frequentProductChip: {
    backgroundColor: '#f0f8f1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  frequentProductText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
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
  scannerButton: {
    marginLeft: 8,
    padding: 8,
    backgroundColor: '#f0f8f1',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  expandButton: {
    marginLeft: 8,
    padding: 8,
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
  expandedControls: {
    paddingTop: 8,
  },
  quantitySection: {
    marginBottom: 20,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickQuantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quickQuantitySelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  quickQuantityText: {
    fontSize: 14,
    color: '#666',
  },
  quickQuantityTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  customQuantityInput: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 6,
    width: 60,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  unitSection: {
    marginBottom: 20,
  },
  unitsList: {
    paddingRight: 16,
  },
  unitButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  unitButtonSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  unitButtonText: {
    fontSize: 12,
    color: '#666',
  },
  unitButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
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
});