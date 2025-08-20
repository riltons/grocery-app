import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Modal, StyleSheet } from 'react-native';
import SafeContainer from '../../components/SafeContainer';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { 
  ProductComparison, 
  ProductComparisonService, 
  ComparisonResult,
  PRODUCT_CATEGORIES,
  UNIT_CONVERSIONS
} from '../../lib/productComparison';

export default function ComparisonScreen() {
  const [products, setProducts] = useState<ProductComparison[]>([]);
  const [currentProduct, setCurrentProduct] = useState<Partial<ProductComparison>>({
    name: '',
    quantity: 0,
    unit: 'un',
    price: 0,
    category: ''
  });
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [comparisonResults, setComparisonResults] = useState<ComparisonResult[]>([]);

  const addProduct = () => {
    if (!currentProduct.name || !currentProduct.quantity || !currentProduct.price) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    const newProduct: ProductComparison = {
      id: Date.now().toString(),
      name: currentProduct.name!,
      quantity: currentProduct.quantity!,
      unit: currentProduct.unit!,
      price: currentProduct.price!,
      category: currentProduct.category,
      description: currentProduct.description,
      metersPerUnit: currentProduct.metersPerUnit,
      layers: currentProduct.layers,
      totalMeters: currentProduct.metersPerUnit && currentProduct.quantity ? 
        currentProduct.quantity * currentProduct.metersPerUnit : undefined
    };

    const updatedProducts = [...products, newProduct];
    setProducts(updatedProducts);
    
    // Recalcular comparação automaticamente
    const results = ProductComparisonService.compareProducts(updatedProducts);
    setComparisonResults(results);
    
    setCurrentProduct({
      name: '',
      quantity: 0,
      unit: 'un',
      price: 0,
      category: '',
      metersPerUnit: undefined,
      layers: undefined
    });
  };

  const removeProduct = (id: string) => {
    const updatedProducts = products.filter(p => p.id !== id);
    setProducts(updatedProducts);
    
    // Recalcular comparação
    const results = ProductComparisonService.compareProducts(updatedProducts);
    setComparisonResults(results);
  };

  const generateReport = () => {
    if (comparisonResults.length === 0) {
      Alert.alert('Aviso', 'Adicione pelo menos 2 produtos para gerar relatório');
      return;
    }
    
    const report = ProductComparisonService.generateComparisonReport(comparisonResults);
    Alert.alert('Relatório de Comparação', report);
  };

  const clearAllProducts = () => {
    Alert.alert(
      'Limpar Produtos',
      'Tem certeza que deseja remover todos os produtos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Limpar', 
          style: 'destructive',
          onPress: () => {
            setProducts([]);
            setComparisonResults([]);
          }
        }
      ]
    );
  };

  const getCategoryIcon = (category: string) => {
    const categoryInfo = PRODUCT_CATEGORIES[category as keyof typeof PRODUCT_CATEGORIES];
    return categoryInfo?.icon || '[ITEM]';
  };

  const formatPrice = (price: number) => {
    return ProductComparisonService.formatPrice(price);
  };

  const getUnitLabel = (unit: string) => {
    return ProductComparisonService.formatUnit(unit);
  };

  return (
    <SafeContainer>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Comparar Produtos</Text>
            <View style={styles.headerActions}>
              {products.length > 0 && (
                <TouchableOpacity onPress={clearAllProducts} style={styles.actionButton}>
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              )}
              {comparisonResults.length > 0 && (
                <TouchableOpacity onPress={generateReport}>
                  <Ionicons name="document-text-outline" size={20} color="#3b82f6" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <ScrollView style={styles.scrollView}>
          {/* Formulário para adicionar produto */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Adicionar Produto</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nome do Produto</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: Papel Higiênico Marca A"
                value={currentProduct.name}
                onChangeText={(text) => setCurrentProduct({...currentProduct, name: text})}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Categoria</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowCategoryModal(true)}
              >
                {currentProduct.category ? (
                  <View style={styles.categoryDisplay}>
                    <Text style={styles.selectButtonTextSelected}>
                      {getCategoryIcon(currentProduct.category)}
                    </Text>
                    <Text style={styles.selectButtonTextSelected}>
                      {PRODUCT_CATEGORIES[currentProduct.category as keyof typeof PRODUCT_CATEGORIES]?.name || currentProduct.category}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.selectButtonTextPlaceholder}>
                    Selecionar categoria
                  </Text>
                )}
                <Ionicons name="chevron-down" size={16} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Descrição (opcional)</Text>
              <TextInput
                style={[styles.textInput, styles.textInputMultiline]}
                placeholder="Ex: 4 rolos, dupla folha, 30m cada"
                value={currentProduct.description}
                onChangeText={(text) => setCurrentProduct({...currentProduct, description: text})}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Campos específicos para papel higiênico */}
            {currentProduct.category === 'papel_higienico' && (
              <View style={styles.specificFieldsContainer}>
                <Text style={styles.specificFieldsTitle}>Detalhes do Papel Higiênico</Text>
                
                <View style={styles.rowContainer}>
                  <View style={styles.halfWidth}>
                    <Text style={styles.inputLabel}>Metros por rolo</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="30"
                      keyboardType="numeric"
                      value={currentProduct.metersPerUnit?.toString() || ''}
                      onChangeText={(text) => setCurrentProduct({...currentProduct, metersPerUnit: parseFloat(text) || 0})}
                    />
                  </View>
                  
                  <View style={styles.halfWidth}>
                    <Text style={styles.inputLabel}>Camadas</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="2"
                      keyboardType="numeric"
                      value={currentProduct.layers?.toString() || ''}
                      onChangeText={(text) => setCurrentProduct({...currentProduct, layers: parseInt(text) || 0})}
                    />
                  </View>
                </View>

                {currentProduct.quantity && currentProduct.metersPerUnit && (
                  <View style={styles.calculatedInfo}>
                    <Text style={styles.calculatedLabel}>
                      Total: {currentProduct.quantity || 0} rolos × {currentProduct.metersPerUnit || 0}m = {((currentProduct.quantity || 0) * (currentProduct.metersPerUnit || 0)).toFixed(1)}m
                    </Text>
                    {currentProduct.price && (
                      <Text style={styles.calculatedLabel}>
                        Preço por metro: {formatPrice(currentProduct.price / (currentProduct.quantity * currentProduct.metersPerUnit))}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            )}

            <View style={styles.rowContainer}>
              <View style={styles.halfWidth}>
                <Text style={styles.inputLabel}>Quantidade</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="0"
                  keyboardType="numeric"
                  value={currentProduct.quantity?.toString() || ''}
                  onChangeText={(text) => setCurrentProduct({...currentProduct, quantity: parseFloat(text) || 0})}
                />
              </View>
              
              <View style={styles.halfWidth}>
                <Text style={styles.inputLabel}>Unidade</Text>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setShowUnitModal(true)}
                >
                  <Text style={styles.selectButtonTextSelected}>{currentProduct.unit}</Text>
                  <Ionicons name="chevron-down" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Preço</Text>
              <TextInput
                style={styles.textInput}
                placeholder="0,00"
                keyboardType="numeric"
                value={currentProduct.price?.toString() || ''}
                onChangeText={(text) => setCurrentProduct({...currentProduct, price: parseFloat(text) || 0})}
              />
            </View>

            <TouchableOpacity
              style={styles.addButton}
              onPress={addProduct}
            >
              <Text style={styles.addButtonText}>Adicionar Produto</Text>
            </TouchableOpacity>
          </View>

          {/* Lista de produtos adicionados */}
          {products.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Produtos Adicionados</Text>
              {products.map((product) => (
                <View key={product.id} style={styles.productItem}>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productDetails}>
                      {product.quantity || 0} {product.unit || ''} - {formatPrice(product.price)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeProduct(product.id)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Resultados da comparação */}
          {comparisonResults.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Resultados da Comparação</Text>
              
              {comparisonResults.map((result, resultIndex) => (
                <View key={`${result.category}-${resultIndex}`} style={styles.categoryGroup}>
                  <Text style={styles.categoryTitle}>
                    Categoria: {result.category}
                  </Text>
                  
                  {result.products.map((product, index) => {
                    const savings = result.savings[product.id];
                    return (
                      <View 
                        key={product.id} 
                        style={[
                          styles.resultItem,
                          index === 0 ? styles.bestResult : styles.normalResult
                        ]}
                      >
                        <View style={styles.resultHeader}>
                          <View style={styles.resultInfo}>
                            <View style={styles.resultTitleRow}>
                              <Text style={styles.resultProductName}>{product.name}</Text>
                              {index === 0 && (
                                <View style={styles.bestBadge}>
                                  <Text style={styles.bestBadgeText}>MELHOR</Text>
                                </View>
                              )}
                              {savings && savings > 0 && (
                                <View style={styles.savingsBadge}>
                                  <Text style={styles.savingsBadgeText}>+{savings.toFixed(1)}%</Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.resultDetails}>
                              {product.quantity || 0} {product.unit || ''} por {formatPrice(product.price)}
                            </Text>
                            
                            {/* Informações específicas para papel higiênico */}
                            {product.totalMeters ? (
                              <View>
                                <Text style={styles.resultSpecific}>
                                  {product.quantity || 0} rolos × {product.metersPerUnit || 0}m = {product.totalMeters || 0}m total
                                </Text>
                                {product.layers && (
                                  <Text style={styles.resultSpecific}>
                                    {product.layers || 0} camadas
                                  </Text>
                                )}
                                <Text style={styles.resultUnitPrice}>
                                  {formatPrice(product.unitPrice || 0)} por metro
                                </Text>
                              </View>
                            ) : (
                              <Text style={styles.resultUnitPrice}>
                                {formatPrice(product.unitPrice || 0)} por {getUnitLabel(product.unit)}
                              </Text>
                            )}
                            
                            {product.description && (
                              <Text style={styles.resultDescription}>{product.description}</Text>
                            )}
                          </View>
                          
                          {index === 0 && (
                            <Ionicons name="trophy" size={24} color="#fbbf24" />
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          )}

          {/* Dicas de uso */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>Dicas de Uso</Text>
            <Text style={styles.tipsText}>• Use unidades compatíveis para comparação (g, kg, mg para peso)</Text>
            <Text style={styles.tipsText}>• Produtos com unidades diferentes são agrupados por categoria</Text>
            <Text style={styles.tipsText}>• O produto com menor preço por unidade aparece em destaque</Text>
          </View>
        </ScrollView>

        {/* Modal de Seleção de Categoria */}
        <Modal
          visible={showCategoryModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowCategoryModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Selecionar Categoria</Text>
                <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalScrollView}>
                {Object.entries(PRODUCT_CATEGORIES).map(([key, category]) => (
                  <TouchableOpacity
                    key={key}
                    style={styles.modalItem}
                    onPress={() => {
                      setCurrentProduct({...currentProduct, category: key});
                      setShowCategoryModal(false);
                    }}
                  >
                    <View style={styles.modalItemIcon}>
                      <Text style={styles.modalItemIconText}>{category.icon}</Text>
                    </View>
                    <View style={styles.modalItemContent}>
                      <Text style={styles.modalItemTitle}>{category.name}</Text>
                    </View>
                    {currentProduct.category === key && (
                      <Ionicons name="checkmark" size={20} color="#16a34a" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Modal de Seleção de Unidade */}
        <Modal
          visible={showUnitModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowUnitModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Selecionar Unidade</Text>
                <TouchableOpacity onPress={() => setShowUnitModal(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalScrollView}>
                {ProductComparisonService.getUnitSuggestions(currentProduct.category).map((unit) => (
                  <TouchableOpacity
                    key={unit}
                    style={styles.modalUnitItem}
                    onPress={() => {
                      setCurrentProduct({...currentProduct, unit});
                      setShowUnitModal(false);
                    }}
                  >
                    <Text style={styles.modalItemTitle}>{unit}</Text>
                    {currentProduct.unit === unit && (
                      <Ionicons name="checkmark" size={20} color="#16a34a" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#111827',
  },
  textInputMultiline: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  selectButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectButtonTextSelected: {
    color: '#111827',
    fontSize: 16,
  },
  selectButtonTextPlaceholder: {
    color: '#9ca3af',
    fontSize: 16,
  },
  categoryDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  halfWidth: {
    flex: 1,
  },
  addButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  productDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  deleteButton: {
    marginLeft: 8,
    padding: 4,
  },
  categoryGroup: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  resultItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  bestResult: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  normalResult: {
    backgroundColor: '#f9fafb',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultInfo: {
    flex: 1,
  },
  resultTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  resultProductName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  bestBadge: {
    marginLeft: 8,
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  bestBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '500',
  },
  savingsBadge: {
    marginLeft: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  savingsBadgeText: {
    fontSize: 10,
    color: '#dc2626',
    fontWeight: '500',
  },
  resultDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  resultUnitPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563eb',
    marginTop: 2,
  },
  resultDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  resultSpecific: {
    fontSize: 13,
    color: '#059669',
    marginTop: 2,
    fontWeight: '500',
  },
  specificFieldsContainer: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  specificFieldsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 12,
  },
  calculatedInfo: {
    backgroundColor: '#ecfdf5',
    borderRadius: 6,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  calculatedLabel: {
    fontSize: 14,
    color: '#065f46',
    fontWeight: '500',
    marginBottom: 4,
  },
  tipsContainer: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e3a8a',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#1e40af',
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: 384,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalScrollView: {
    maxHeight: 320,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalItemIcon: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalItemIconText: {
    fontSize: 24,
  },
  modalItemContent: {
    flex: 1,
  },
  modalItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  modalItemDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  modalUnitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
});