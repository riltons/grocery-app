import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProductInfo } from '../lib/barcode';
import { GenericProduct, Store } from '../lib/supabase';
import { StoreService } from '../lib/stores';
import GenericProductSelector from './GenericProductSelector';

interface ScanResultModalProps {
  visible: boolean;
  productInfo: ProductInfo | null;
  suggestedGenericProducts: GenericProduct[];
  selectedGenericProduct?: GenericProduct;
  onConfirm: (product: ProductInfo, genericProduct: GenericProduct, price?: PriceInfo) => void;
  onEdit: (product: ProductInfo) => void;
  onGenericProductChange: (genericProduct: GenericProduct) => void;
  onCancel: () => void;
  loading?: boolean;
}

interface PriceInfo {
  price: number;
  unit: string;
  store?: Store;
  date: Date;
}

export default function ScanResultModal({
  visible,
  productInfo,
  suggestedGenericProducts,
  selectedGenericProduct,
  onConfirm,
  onEdit,
  onGenericProductChange,
  onCancel,
  loading = false,
}: ScanResultModalProps) {
  const [editedProduct, setEditedProduct] = useState<ProductInfo | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [priceInput, setPriceInput] = useState('');
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [showPriceSection, setShowPriceSection] = useState(false);
  const [showGenericSelector, setShowGenericSelector] = useState(false);
  const [showStoreSelector, setShowStoreSelector] = useState(false);
  const [loadingStores, setLoadingStores] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (visible && productInfo) {
      setEditedProduct({ ...productInfo });
      setIsEditing(false);
      setPriceInput('');
      setSelectedStore(null);
      setShowPriceSection(false);
      setShowGenericSelector(false);
      setShowStoreSelector(false);
    }
  }, [visible, productInfo]);

  // Load stores when price section is opened
  useEffect(() => {
    if (showPriceSection && stores.length === 0) {
      loadStores();
    }
  }, [showPriceSection]);

  const loadStores = async () => {
    try {
      setLoadingStores(true);
      const { data, error } = await StoreService.getStores();
      
      if (error) {
        console.error('Erro ao carregar lojas:', error);
        return;
      }
      
      if (data) {
        setStores(data);
        // TODO: Implement geolocation-based store suggestion
        // For now, we'll suggest the most recently used store
        if (data.length > 0) {
          // This could be enhanced with geolocation logic
          setSelectedStore(data[0]);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar lojas:', error);
    } finally {
      setLoadingStores(false);
    }
  };

  const handleConfirm = () => {
    if (!editedProduct) {
      Alert.alert('Erro', 'Dados do produto não encontrados');
      return;
    }

    // If no generic product is selected, we'll let the parent component handle creation
    if (!selectedGenericProduct) {
      console.log('Nenhum produto genérico selecionado, será criado automaticamente');
    }

    let priceInfo: PriceInfo | undefined;
    if (showPriceSection && priceInput.trim()) {
      const price = parseFloat(priceInput.replace(',', '.'));
      if (!isNaN(price) && price > 0) {
        priceInfo = {
          price,
          unit: editedProduct.metadata?.unit || 'un',
          store: selectedStore || undefined,
          date: new Date(),
        };
      }
    }

    onConfirm(editedProduct, selectedGenericProduct, priceInfo);
  };

  const handleEdit = () => {
    if (!editedProduct) return;
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!editedProduct) return;
    
    // Validate required fields
    if (!editedProduct.name.trim()) {
      Alert.alert('Erro', 'O nome do produto é obrigatório');
      return;
    }

    // Trim whitespace from all fields
    const cleanedProduct = {
      ...editedProduct,
      name: editedProduct.name.trim(),
      brand: typeof editedProduct.brand === 'string' ? 
             (editedProduct.brand.trim() || undefined) : 
             (editedProduct.brand?.name?.trim() || undefined),
      category: editedProduct.category?.trim() || undefined,
      description: editedProduct.description?.trim() || undefined,
    };

    setEditedProduct(cleanedProduct);
    setIsEditing(false);
    onEdit(cleanedProduct);
  };

  const handleCancelEdit = () => {
    if (productInfo) {
      setEditedProduct({ ...productInfo });
    }
    setIsEditing(false);
  };

  const formatPrice = (text: string) => {
    const cleaned = text.replace(/[^0-9.,]/g, '');
    setPriceInput(cleaned);
  };

  const hasChanges = (): boolean => {
    if (!productInfo || !editedProduct) return false;
    
    const originalBrand = typeof productInfo.brand === 'string' ? productInfo.brand : 
                         (productInfo.brand?.name || '');
    const editedBrand = typeof editedProduct.brand === 'string' ? editedProduct.brand : 
                       (editedProduct.brand?.name || '');
    
    return (
      productInfo.name !== editedProduct.name ||
      originalBrand !== editedBrand ||
      productInfo.category !== editedProduct.category ||
      productInfo.description !== editedProduct.description
    );
  };

  const getChanges = (): string[] => {
    if (!productInfo || !editedProduct) return [];
    
    const changes: string[] = [];
    
    if (productInfo.name !== editedProduct.name) {
      changes.push(`Nome alterado de "${productInfo.name || 'Não informado'}" para "${editedProduct.name}"`);
    }
    
    const originalBrand = typeof productInfo.brand === 'string' ? productInfo.brand : 
                         (productInfo.brand?.name || '');
    const editedBrand = typeof editedProduct.brand === 'string' ? editedProduct.brand : 
                       (editedProduct.brand?.name || '');
    
    if (originalBrand !== editedBrand) {
      changes.push(`Marca alterada de "${originalBrand || 'Não informada'}" para "${editedBrand || 'Não informada'}"`);
    }
    
    if (productInfo.category !== editedProduct.category) {
      changes.push(`Categoria alterada de "${productInfo.category || 'Não informada'}" para "${editedProduct.category || 'Não informada'}"`);
    }
    
    if (productInfo.description !== editedProduct.description) {
      changes.push(`Descrição alterada`);
    }
    
    return changes;
  };

  const handleResetChanges = () => {
    Alert.alert(
      'Desfazer Alterações',
      'Tem certeza que deseja desfazer todas as alterações feitas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Desfazer', 
          style: 'destructive',
          onPress: () => {
            if (productInfo) {
              setEditedProduct({ ...productInfo });
            }
          }
        }
      ]
    );
  };

  if (!productInfo || !editedProduct) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} disabled={loading}>
            <Text style={styles.cancelButton}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Produto Escaneado</Text>
          <TouchableOpacity 
            onPress={isEditing ? handleSaveEdit : handleEdit} 
            disabled={loading}
          >
            <Text style={styles.editButton}>
              {isEditing ? 'Salvar' : 'Editar'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Product Information Section */}
          <View style={styles.productSection}>
            <Text style={styles.sectionTitle}>Informações do Produto</Text>
            
            {/* Product Image */}
            {editedProduct.image && (
              <View style={styles.imageContainer}>
                <Image 
                  source={{ uri: editedProduct.image }} 
                  style={styles.productImage}
                  resizeMode="contain"
                />
              </View>
            )}

            {/* Barcode */}
            <View style={styles.infoRow}>
              <Ionicons name="barcode-outline" size={20} color="#666" />
              <Text style={styles.infoLabel}>Código de Barras:</Text>
              <Text style={styles.infoValue}>{editedProduct.barcode}</Text>
            </View>

            {/* Product Name */}
            <View style={styles.infoRow}>
              <Ionicons name="pricetag-outline" size={20} color="#666" />
              <Text style={styles.infoLabel}>Nome:</Text>
              {isEditing ? (
                <TextInput
                  style={styles.editInput}
                  value={editedProduct.name}
                  onChangeText={(text) => 
                    setEditedProduct({ ...editedProduct, name: text })
                  }
                  placeholder="Nome do produto"
                  multiline
                />
              ) : (
                <Text style={styles.infoValue}>
                  {editedProduct.name || 'Nome não identificado'}
                </Text>
              )}
            </View>

            {/* Brand */}
            <View style={styles.infoRow}>
              <Ionicons name="business-outline" size={20} color="#666" />
              <Text style={styles.infoLabel}>Marca:</Text>
              {isEditing ? (
                <TextInput
                  style={styles.editInput}
                  value={typeof editedProduct.brand === 'string' ? editedProduct.brand : 
                         (editedProduct.brand?.name || '')}
                  onChangeText={(text) => 
                    setEditedProduct({ ...editedProduct, brand: text })
                  }
                  placeholder="Marca do produto"
                />
              ) : (
                <Text style={styles.infoValue}>
                  {typeof editedProduct.brand === 'string' ? editedProduct.brand : 
                   (editedProduct.brand?.name || 'Marca não identificada')}
                </Text>
              )}
            </View>

            {/* Category */}
            <View style={styles.infoRow}>
              <Ionicons name="grid-outline" size={20} color="#666" />
              <Text style={styles.infoLabel}>Categoria:</Text>
              {isEditing ? (
                <TextInput
                  style={styles.editInput}
                  value={editedProduct.category || ''}
                  onChangeText={(text) => 
                    setEditedProduct({ ...editedProduct, category: text })
                  }
                  placeholder="Categoria do produto"
                />
              ) : (
                <Text style={styles.infoValue}>
                  {editedProduct.category || 'Categoria não identificada'}
                </Text>
              )}
            </View>

            {/* Description */}
            {(isEditing || editedProduct.description) && (
              <View style={styles.infoRow}>
                <Ionicons name="document-text-outline" size={20} color="#666" />
                <Text style={styles.infoLabel}>Descrição:</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.editInput, styles.multilineInput]}
                    value={editedProduct.description || ''}
                    onChangeText={(text) => 
                      setEditedProduct({ ...editedProduct, description: text })
                    }
                    placeholder="Descrição adicional do produto"
                    multiline
                    numberOfLines={3}
                  />
                ) : (
                  <Text style={styles.infoValue}>
                    {editedProduct.description || 'Sem descrição'}
                  </Text>
                )}
              </View>
            )}

            {/* Data Source */}
            <View style={styles.infoRow}>
              <Ionicons name="information-circle-outline" size={20} color="#666" />
              <Text style={styles.infoLabel}>Fonte:</Text>
              <View style={styles.sourceContainer}>
                <Text style={styles.infoValue}>
                  {editedProduct.source === 'local' ? 'Local' :
                   editedProduct.source === 'cosmos' ? 'Cosmos API' :
                   editedProduct.source === 'openfoodfacts' ? 'Open Food Facts' :
                   'Manual'}
                </Text>
                <View style={[
                  styles.confidenceBadge,
                  { backgroundColor: getConfidenceColor(editedProduct.confidence) }
                ]}>
                  <Text style={styles.confidenceText}>
                    {Math.round(editedProduct.confidence * 100)}%
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Changes Preview Section */}
          {!isEditing && hasChanges() && (
            <View style={styles.changesSection}>
              <Text style={styles.sectionTitle}>Alterações Realizadas</Text>
              <Text style={styles.sectionDescription}>
                As seguintes informações foram modificadas:
              </Text>
              
              {getChanges().map((change, index) => (
                <View key={index} style={styles.changeItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  <Text style={styles.changeText}>{change}</Text>
                </View>
              ))}
              
              <TouchableOpacity
                style={styles.resetChangesButton}
                onPress={handleResetChanges}
              >
                <Ionicons name="refresh" size={16} color="#f59e0b" />
                <Text style={styles.resetChangesText}>Desfazer Alterações</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Generic Product Selection Section */}
          <View style={styles.genericSection}>
            <Text style={styles.sectionTitle}>Produto Genérico</Text>
            <Text style={styles.sectionDescription}>
              Selecione o produto genérico correspondente para organizar sua lista
            </Text>
            
            {/* Selected Generic Product */}
            {selectedGenericProduct ? (
              <View style={styles.selectedGenericProduct}>
                <View style={styles.selectedProductInfo}>
                  <Text style={styles.selectedProductName}>
                    {selectedGenericProduct.name}
                  </Text>
                  <Text style={styles.selectedProductCategory}>
                    {selectedGenericProduct.category}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.changeButton}
                  onPress={() => setShowGenericSelector(true)}
                >
                  <Text style={styles.changeButtonText}>Alterar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.selectGenericButton}
                onPress={() => setShowGenericSelector(true)}
              >
                <Ionicons name="add-circle-outline" size={24} color="#4CAF50" />
                <Text style={styles.selectGenericText}>
                  Selecionar Produto Genérico
                </Text>
              </TouchableOpacity>
            )}

            {/* Suggested Generic Products */}
            {suggestedGenericProducts.length > 0 && !selectedGenericProduct && (
              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsTitle}>Sugestões:</Text>
                {suggestedGenericProducts.slice(0, 3).map((product) => (
                  <TouchableOpacity
                    key={product.id}
                    style={styles.suggestionItem}
                    onPress={() => onGenericProductChange(product)}
                  >
                    <Text style={styles.suggestionName}>{product.name}</Text>
                    <Text style={styles.suggestionCategory}>{product.category}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Price Section (Optional) */}
          <View style={styles.priceSection}>
            <TouchableOpacity
              style={styles.priceSectionHeader}
              onPress={() => setShowPriceSection(!showPriceSection)}
            >
              <Text style={styles.sectionTitle}>Preço (Opcional)</Text>
              <Ionicons 
                name={showPriceSection ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#666" 
              />
            </TouchableOpacity>

            {showPriceSection && (
              <View style={styles.priceInputs}>
                <View style={styles.priceInputContainer}>
                  <Text style={styles.inputLabel}>Preço pago</Text>
                  <View style={styles.priceInputWrapper}>
                    <Text style={styles.currencySymbol}>R$</Text>
                    <TextInput
                      style={styles.priceInput}
                      placeholder="0,00"
                      value={priceInput}
                      onChangeText={formatPrice}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  {priceInput.trim() && (
                    <Text style={styles.priceHint}>
                      Preço por {editedProduct.metadata?.unit || 'unidade'}
                    </Text>
                  )}
                </View>

                <View style={styles.storeInputContainer}>
                  <Text style={styles.inputLabel}>Loja (opcional)</Text>
                  {loadingStores ? (
                    <View style={styles.loadingStoreContainer}>
                      <ActivityIndicator size="small" color="#4CAF50" />
                      <Text style={styles.loadingStoreText}>Carregando lojas...</Text>
                    </View>
                  ) : selectedStore ? (
                    <TouchableOpacity
                      style={styles.selectedStoreContainer}
                      onPress={() => setShowStoreSelector(true)}
                    >
                      <View style={styles.selectedStoreInfo}>
                        <Text style={styles.selectedStoreName}>{selectedStore.name}</Text>
                        {selectedStore.address && (
                          <Text style={styles.selectedStoreAddress}>{selectedStore.address}</Text>
                        )}
                      </View>
                      <Ionicons name="chevron-down" size={20} color="#64748b" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.selectStoreButton}
                      onPress={() => setShowStoreSelector(true)}
                    >
                      <Ionicons name="storefront-outline" size={20} color="#4CAF50" />
                      <Text style={styles.selectStoreText}>Selecionar Loja</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Price validation */}
                {priceInput.trim() && (
                  <View style={styles.priceValidation}>
                    {(() => {
                      const price = parseFloat(priceInput.replace(',', '.'));
                      if (isNaN(price)) {
                        return (
                          <View style={styles.validationError}>
                            <Ionicons name="alert-circle" size={16} color="#ef4444" />
                            <Text style={styles.validationErrorText}>Preço inválido</Text>
                          </View>
                        );
                      }
                      if (price <= 0) {
                        return (
                          <View style={styles.validationError}>
                            <Ionicons name="alert-circle" size={16} color="#ef4444" />
                            <Text style={styles.validationErrorText}>Preço deve ser maior que zero</Text>
                          </View>
                        );
                      }
                      return (
                        <View style={styles.validationSuccess}>
                          <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                          <Text style={styles.validationSuccessText}>
                            Preço válido: R$ {price.toFixed(2).replace('.', ',')}
                          </Text>
                        </View>
                      );
                    })()}
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.footer}>
          {isEditing ? (
            <TouchableOpacity
              style={styles.cancelEditButton}
              onPress={handleCancelEdit}
            >
              <Text style={styles.cancelEditText}>Cancelar Edição</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.confirmButton, loading && styles.buttonDisabled]}
              onPress={handleConfirm}
              disabled={loading || !selectedGenericProduct}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                  <Text style={styles.confirmButtonText}>
                    Adicionar à Lista
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Generic Product Selector Modal */}
      <GenericProductSelector
        visible={showGenericSelector}
        onClose={() => setShowGenericSelector(false)}
        onSelectProduct={(product) => {
          onGenericProductChange(product);
          setShowGenericSelector(false);
        }}
        suggestedProducts={suggestedGenericProducts}
        searchQuery={(() => {
          const productName = editedProduct?.name || productInfo?.name || '';
          // Extrair apenas a primeira palavra do nome do produto
          const firstWord = productName.split(' ')[0];
          return firstWord;
        })()}
      />

      {/* Store Selector Modal */}
      <Modal
        visible={showStoreSelector}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowStoreSelector(false)}
      >
        <View style={styles.storeModalContainer}>
          <View style={styles.storeModalHeader}>
            <TouchableOpacity onPress={() => setShowStoreSelector(false)}>
              <Text style={styles.cancelButton}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Selecionar Loja</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView style={styles.storeModalContent}>
            {/* No Store Option */}
            <TouchableOpacity
              style={[
                styles.storeOption,
                !selectedStore && styles.storeOptionSelected
              ]}
              onPress={() => {
                setSelectedStore(null);
                setShowStoreSelector(false);
              }}
            >
              <Ionicons name="close-circle-outline" size={24} color="#64748b" />
              <Text style={styles.storeOptionText}>Não informar loja</Text>
              {!selectedStore && (
                <Ionicons name="checkmark" size={20} color="#4CAF50" />
              )}
            </TouchableOpacity>

            {/* Store List */}
            {stores.map((store) => (
              <TouchableOpacity
                key={store.id}
                style={[
                  styles.storeOption,
                  selectedStore?.id === store.id && styles.storeOptionSelected
                ]}
                onPress={() => {
                  setSelectedStore(store);
                  setShowStoreSelector(false);
                }}
              >
                <Ionicons name="storefront" size={24} color="#4CAF50" />
                <View style={styles.storeOptionInfo}>
                  <Text style={styles.storeOptionName}>{store.name}</Text>
                  {store.address && (
                    <Text style={styles.storeOptionAddress}>{store.address}</Text>
                  )}
                </View>
                {selectedStore?.id === store.id && (
                  <Ionicons name="checkmark" size={20} color="#4CAF50" />
                )}
              </TouchableOpacity>
            ))}

            {/* Create New Store Option */}
            <TouchableOpacity
              style={styles.createStoreOption}
              onPress={() => {
                // TODO: Implement create new store functionality
                Alert.alert('Em breve', 'Funcionalidade de criar nova loja será implementada em breve');
              }}
            >
              <Ionicons name="add-circle-outline" size={24} color="#4CAF50" />
              <Text style={styles.createStoreText}>Criar Nova Loja</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </Modal>
  );
}

// Helper function to get confidence color
function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return '#4CAF50'; // Green
  if (confidence >= 0.6) return '#FF9800'; // Orange
  return '#F44336'; // Red
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
  editButton: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  productSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 20,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 16,
  },
  productImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    minHeight: 24,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 8,
    marginRight: 8,
    minWidth: 80,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 20,
  },
  editInput: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
  },
  sourceContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  genericSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  selectedGenericProduct: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#0ea5e9',
    borderRadius: 8,
    padding: 12,
  },
  selectedProductInfo: {
    flex: 1,
  },
  selectedProductName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0c4a6e',
    marginBottom: 2,
  },
  selectedProductCategory: {
    fontSize: 14,
    color: '#0369a1',
  },
  changeButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  changeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  selectGenericButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
  },
  selectGenericText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4CAF50',
    marginLeft: 8,
  },
  suggestionsContainer: {
    marginTop: 16,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  suggestionItem: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  suggestionName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 2,
  },
  suggestionCategory: {
    fontSize: 13,
    color: '#64748b',
  },
  priceSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  priceSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceInputs: {
    marginTop: 16,
  },
  priceInputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: '#1f2937',
  },
  storeInputContainer: {
    marginBottom: 8,
  },
  storeInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  footer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  cancelEditButton: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelEditText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748b',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  changesSection: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  changeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  changeText: {
    flex: 1,
    fontSize: 14,
    color: '#92400e',
    marginLeft: 8,
    lineHeight: 20,
  },
  resetChangesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  resetChangesText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#f59e0b',
    marginLeft: 4,
  },
  priceHint: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  loadingStoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  loadingStoreText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
  },
  selectedStoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#0ea5e9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectedStoreInfo: {
    flex: 1,
  },
  selectedStoreName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0c4a6e',
    marginBottom: 2,
  },
  selectedStoreAddress: {
    fontSize: 12,
    color: '#0369a1',
  },
  selectStoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 12,
  },
  selectStoreText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4CAF50',
    marginLeft: 8,
  },
  priceValidation: {
    marginTop: 8,
  },
  validationError: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  validationErrorText: {
    fontSize: 12,
    color: '#ef4444',
    marginLeft: 4,
  },
  validationSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  validationSuccessText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
  },
  storeModalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  storeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  storeModalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  storeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  storeOptionSelected: {
    backgroundColor: '#f0f9ff',
    borderColor: '#0ea5e9',
  },
  storeOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    marginLeft: 12,
  },
  storeOptionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  storeOptionName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 2,
  },
  storeOptionAddress: {
    fontSize: 14,
    color: '#64748b',
  },
  createStoreOption: {
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
  createStoreText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4CAF50',
    marginLeft: 8,
  },
  headerSpacer: {
    width: 60,
  },
});