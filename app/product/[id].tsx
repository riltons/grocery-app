import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Share, Modal, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { ProductService } from '../../lib/products';
import { StoreService } from '../../lib/stores';
import CategorySelector from '../../components/CategorySelector';
import UnitSelector from '../../components/UnitSelector';
import Toast from '../../components/Toast';
import { useToast } from '../../lib/useToast';
import PriceHistoryModal from '../../components/PriceHistoryModal';
import SafeContainer from '../../components/SafeContainer';
import GenericProductSelector from '../../components/GenericProductSelector';
import { Animated } from 'react-native';

// Tipos para o produto e preços
type Product = {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  default_unit?: string;
  created_at: string;
  generic_product_id: string;
  generic_products?: {
    name: string;
    category: string | null;
  };
};

type Store = {
  id: string;
  name: string;
  address?: string;
};

type PriceRecord = {
  id: string;
  product_id: string;
  store_id: string;
  price: number;
  date: string;
  store?: Store;
};

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { toast, showSuccess, showError, hideToast } = useToast();
  
  // Estados para gerenciar os dados
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [priceHistory, setPriceHistory] = useState<PriceRecord[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [priceModalVisible, setPriceModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string>('un');
  const [showGenericProductModal, setShowGenericProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(false);
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  

  
  // Animações
  const fadeAnim = useState(new Animated.Value(0))[0];
  
  // Carregar dados do produto
  useEffect(() => {
    if (!id) return;
    
    const fetchProductData = async () => {
      try {
        setLoading(true);
        
        // Buscar dados do produto
        const { data, error } = await ProductService.getSpecificProductById(id);
        
        if (error) {
          Alert.alert('Erro', 'Não foi possível carregar os detalhes do produto');
          return;
        }
        
        if (data) {
          setProduct(data);
          setSelectedCategory(data.generic_products?.category || null);
          setSelectedUnit(data.default_unit || 'un');
          setProductName(data.name);
          setProductDescription(data.description || '');
          
          // Animar a entrada dos dados
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true
          }).start();
        }
      } catch (error) {
        console.error('Erro ao buscar detalhes do produto:', error);
        Alert.alert('Erro', 'Ocorreu um erro ao carregar o produto');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProductData();
  }, [id]);
  
  // Carregar lojas e histórico de preços
  useEffect(() => {
    if (!id) return;
    
    const fetchPriceData = async () => {
      try {
        setLoadingPrices(true);
        
        // Buscar lojas
        const { data: storesData, error: storesError } = await StoreService.getStores();
        
        if (storesError) {
          console.error('Erro ao buscar lojas:', storesError);
        } else if (storesData) {
          setStores(storesData);
        }
        
        // Buscar histórico de preços
        const { data: pricesData, error: pricesError } = await ProductService.getProductPrices(id);
        
        if (pricesError) {
          console.error('Erro ao buscar preços:', pricesError);
        } else if (pricesData) {
          setPriceHistory(pricesData);
        }
      } catch (error) {
        console.error('Erro ao buscar dados de preços:', error);
      } finally {
        setLoadingPrices(false);
      }
    };
    
    fetchPriceData();
  }, [id]);
  
  // Navegar para página de edição
  const handleEditProduct = () => {
    if (product) {
      router.push(`/product/edit/${product.id}`);
    }
  };


  
  // Salvar alterações na categoria
  const handleSaveCategory = async () => {
    if (!product) return;
    
    try {
      setSaving(true);
      
      // Atualizar a categoria no produto genérico
      if (!product?.generic_products) {
        Alert.alert('Erro', 'Produto genérico não encontrado');
        return;
      }

      const { error } = await ProductService.updateGenericProduct(product.generic_product_id, {
        category: selectedCategory
      });
      
      if (error) {
        Alert.alert('Erro', 'Não foi possível atualizar a categoria do produto');
      } else {
        showSuccess('Categoria atualizada com sucesso!');
        // Atualizar o produto local
        setProduct(prev => prev ? { 
          ...prev, 
          generic_products: prev.generic_products ? {
            ...prev.generic_products,
            category: selectedCategory
          } : undefined
        } : null);
      }
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao atualizar a categoria');
    } finally {
      setSaving(false);
    }
  };

  // Salvar alterações na unidade padrão
  const handleSaveUnit = async () => {
    if (!product) return;
    
    try {
      setSaving(true);
      
      const { error } = await ProductService.updateSpecificProduct(product.id, {
        default_unit: selectedUnit
      });
      
      if (error) {
        Alert.alert('Erro', 'Não foi possível atualizar a unidade padrão do produto');
      } else {
        showSuccess('Unidade padrão atualizada com sucesso!');
        // Atualizar o produto local
        setProduct(prev => prev ? { 
          ...prev, 
          default_unit: selectedUnit
        } : null);
      }
    } catch (error) {
      console.error('Erro ao atualizar unidade:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao atualizar a unidade padrão');
    } finally {
      setSaving(false);
    }
  };
  
  // Salvar novo preço
  const handleSavePrice = async (storeId: string, price: number) => {
    try {
      const { data, error } = await ProductService.addProductPrice(id, {
        store_id: storeId,
        price: price,
        date: new Date().toISOString()
      });
      
      if (error) {
        throw error;
      }
      
      // Atualizar o histórico de preços local
      if (data) {
        // Os dados já vêm com a informação da loja incluída e processada
        setPriceHistory(prev => [data, ...prev]);
      }
    } catch (error) {
      console.error('Erro ao salvar preço:', error);
      throw error;
    }
  };
  
  // Compartilhar produto
  const handleShare = async () => {
    if (!product) return;
    
    try {
      // Encontrar o preço mais recente
      const latestPrice = priceHistory.length > 0 ? 
        priceHistory.reduce((latest, current) => 
          new Date(current.date) > new Date(latest.date) ? current : latest
        ) : null;
      
      const priceText = latestPrice ? 
        `Preço: ${latestPrice.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} em ${new Date(latestPrice.date).toLocaleDateString('pt-BR')}` : 
        '';
      
      const message = `Produto: ${product.name}\n${priceText}\n\nCompartilhado do meu app de Lista de Supermercado`;
      
      await Share.share({
        message,
        title: `Produto: ${product.name}`
      });
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      Alert.alert('Erro', 'Não foi possível compartilhar o produto');
    }
  };



  // Função para salvar as alterações do produto
  const handleSaveProduct = async () => {
    if (!product || !productName.trim()) {
      Alert.alert('Erro', 'O nome do produto é obrigatório');
      return;
    }

    try {
      setSaving(true);
      
      const { error } = await ProductService.updateSpecificProduct(product.id, {
        name: productName.trim(),
        description: productDescription.trim() || null,
      });

      if (error) {
        Alert.alert('Erro', 'Não foi possível atualizar o produto');
      } else {
        showSuccess('Produto atualizado com sucesso!');
        setProduct(prev => prev ? {
          ...prev,
          name: productName.trim(),
          description: productDescription.trim() || undefined,
        } : null);
        setEditingProduct(false);
      }
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao atualizar o produto');
    } finally {
      setSaving(false);
    }
  };

  // Função para cancelar a edição
  const handleCancelEdit = () => {
    if (product) {
      setProductName(product.name);
      setProductDescription(product.description || '');
    }
    setEditingProduct(false);
  };

  // Função para alterar o produto genérico
  const handleChangeGenericProduct = (newGenericProduct: any) => {
    if (!product) return;

    Alert.alert(
      'Alterar Produto Genérico',
      `Deseja vincular este produto ao produto genérico "${newGenericProduct.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Confirmar', 
          onPress: async () => {
            try {
              setSaving(true);
              
              const { error } = await ProductService.updateSpecificProduct(product.id, {
                generic_product_id: newGenericProduct.id,
              });

              if (error) {
                Alert.alert('Erro', 'Não foi possível alterar o produto genérico');
              } else {
                showSuccess('Produto genérico alterado com sucesso!');
                setProduct(prev => prev ? {
                  ...prev,
                  generic_product_id: newGenericProduct.id,
                  generic_products: {
                    name: newGenericProduct.name,
                    category: newGenericProduct.category,
                  }
                } : null);
                setSelectedCategory(newGenericProduct.category);
              }
            } catch (error) {
              console.error('Erro ao alterar produto genérico:', error);
              Alert.alert('Erro', 'Ocorreu um erro ao alterar o produto genérico');
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Carregando produto...</Text>
      </View>
    );
  }
  
  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
        <Text style={styles.errorText}>Produto não encontrado</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <SafeContainer style={styles.container}>
      <StatusBar style="dark" />
      
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Detalhes do Produto</Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleEditProduct}>
            <Ionicons name="create-outline" size={24} color="#333" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </Animated.View>
      
      <ScrollView style={styles.content}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Seção de edição do produto */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informações do Produto</Text>
            
            {editingProduct ? (
              <View>
                <Text style={styles.fieldLabel}>Nome do Produto</Text>
                <TextInput
                  style={styles.textInput}
                  value={productName}
                  onChangeText={setProductName}
                  placeholder="Nome do produto"
                  multiline={false}
                />
                
                <Text style={styles.fieldLabel}>Descrição (opcional)</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={productDescription}
                  onChangeText={setProductDescription}
                  placeholder="Descrição do produto"
                  multiline={true}
                  numberOfLines={3}
                />
                
                <View style={styles.editActions}>
                  <TouchableOpacity 
                    style={[styles.cancelButton]}
                    onPress={handleCancelEdit}
                    disabled={saving}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.saveButton, saving && styles.buttonDisabled]}
                    onPress={handleSaveProduct}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.saveButtonText}>Salvar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View>
                <Text style={styles.productName}>{product.name}</Text>
                {product.description && (
                  <Text style={styles.productDescription}>{product.description}</Text>
                )}
              </View>
            )}
          </View>

          {/* Seção do produto genérico */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Produto Genérico</Text>
            
            <View style={styles.genericProductInfo}>
              <View style={styles.genericProductDetails}>
                <Text style={styles.genericProductName}>
                  {product.generic_products?.name || 'Não vinculado'}
                </Text>
                {product.generic_products?.category && (
                  <Text style={styles.genericProductCategory}>
                    Categoria: {product.generic_products.category}
                  </Text>
                )}
              </View>
              
              <TouchableOpacity 
                style={styles.changeGenericButton}
                onPress={() => setShowGenericProductModal(true)}
                disabled={saving}
              >
                <Ionicons name="swap-horizontal" size={20} color="#4CAF50" />
                <Text style={styles.changeGenericButtonText}>Alterar</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categoria</Text>
            <CategorySelector 
              selectedCategory={selectedCategory} 
              onSelectCategory={setSelectedCategory} 
            />
            
            <TouchableOpacity 
              style={[styles.saveButton, saving && styles.buttonDisabled]}
              onPress={handleSaveCategory}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Salvar Categoria</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Unidade Padrão</Text>
            <UnitSelector 
              selectedUnit={selectedUnit} 
              onSelectUnit={setSelectedUnit}
              disabled={saving}
            />
            
            <TouchableOpacity 
              style={[styles.saveButton, saving && styles.buttonDisabled]}
              onPress={handleSaveUnit}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Salvar Unidade Padrão</Text>
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preços</Text>
            
            <View style={styles.priceSection}>
              {priceHistory.length > 0 && (
                <View style={styles.latestPrice}>
                  <Text style={styles.latestPriceLabel}>Preço mais recente:</Text>
                  <Text style={styles.latestPriceValue}>
                    {priceHistory[0].price.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </Text>
                  <Text style={styles.latestPriceStore}>
                    {priceHistory[0].store?.name || 'Loja desconhecida'}
                  </Text>
                </View>
              )}
              
              <TouchableOpacity 
                style={styles.priceHistoryButton}
                onPress={() => setPriceModalVisible(true)}
              >
                <Ionicons name="time-outline" size={20} color="#fff" />
                <Text style={styles.priceHistoryButtonText}>
                  {priceHistory.length > 0 ? 'Ver Histórico de Preços' : 'Registrar Preço'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
      
      <PriceHistoryModal
        visible={priceModalVisible}
        onClose={() => setPriceModalVisible(false)}
        productId={id}
        productName={product.name}
        onSavePrice={handleSavePrice}
        priceHistory={priceHistory}
        stores={stores}
        loading={loadingPrices}
      />

      <GenericProductSelector
        visible={showGenericProductModal}
        onClose={() => setShowGenericProductModal(false)}
        onSelectProduct={handleChangeGenericProduct}
        searchQuery={product.name}
      />
      
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '500',
  },
  shareButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    backgroundColor: '#a5d6a7',
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  priceSection: {
    marginTop: 8,
  },
  latestPrice: {
    backgroundColor: '#f0f8f1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  latestPriceLabel: {
    fontSize: 14,
    color: '#666',
  },
  latestPriceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginVertical: 4,
  },
  latestPriceStore: {
    fontSize: 14,
    color: '#666',
  },
  priceHistoryButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  priceHistoryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Estilos do modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
  },
  modalSaveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  // Novos estilos para edição de produto
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Estilos para seção do produto genérico
  genericProductInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  genericProductDetails: {
    flex: 1,
  },
  genericProductName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  genericProductCategory: {
    fontSize: 14,
    color: '#666',
  },
  changeGenericButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8f1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  changeGenericButtonText: {
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 4,
  },
});