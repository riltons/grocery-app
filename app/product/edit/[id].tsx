import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { ProductService } from '../../../lib/products';
import { barcodeApiService, ProductApiInfo } from '../../../lib/barcodeApiService';
import { useToast } from '../../../context/ToastContext';
import SafeContainer from '../../../components/SafeContainer';
import GenericProductSelector from '../../../components/GenericProductSelector';
import ProductImage from '../../../components/ProductImage';

type Product = {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  barcode?: string;
  barcode_type?: string;
  brand?: string;
  generic_product_id: string;
  generic_products?: {
    name: string;
    category_id: string | null;
    categories?: {
      id: string;
      name: string;
      icon: string;
      color?: string;
    };
  };
};

export default function EditProduct() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  
  // Estados do produto
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estados do formulário
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productBrand, setProductBrand] = useState('');
  const [productImage, setProductImage] = useState<string | undefined>(undefined);
  const [selectedGenericProduct, setSelectedGenericProduct] = useState<any>(null);
  
  // Estados dos modais
  const [showGenericProductModal, setShowGenericProductModal] = useState(false);
  const [showBarcodeUpdateModal, setBarcodeUpdateModal] = useState(false);
  
  // Estados da API de código de barras
  const [updatingFromBarcode, setUpdatingFromBarcode] = useState(false);
  const [apiProductInfo, setApiProductInfo] = useState<ProductApiInfo | null>(null);

  // Carregar dados do produto
  useEffect(() => {
    if (!id) return;
    
    const fetchProduct = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await ProductService.getSpecificProductById(id);
        
        if (error) {
          showError('Erro', 'Não foi possível carregar o produto');
          router.back();
          return;
        }
        
        if (data) {
          setProduct(data);
          setProductName(data.name);
          setProductDescription(data.description || '');
          setProductBrand(data.brand || '');
          setProductImage(data.image_url);
          setSelectedGenericProduct(data.generic_products);
        }
      } catch (error) {
        console.error('Erro ao carregar produto:', error);
        showError('Erro', 'Ocorreu um erro ao carregar o produto');
        router.back();
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [id]);

  // Atualizar informações via API de código de barras
  const handleUpdateFromBarcode = async () => {
    if (!product?.barcode) {
      showError('Erro', 'Este produto não possui código de barras');
      return;
    }

    try {
      setUpdatingFromBarcode(true);
      console.log('🔍 Iniciando busca para código:', product.barcode);
      
      const productInfo = await barcodeApiService.getProductInfo(product.barcode);
      
      if (!productInfo) {
        showError('Produto não encontrado', 'Não foi possível encontrar informações para este código de barras nas APIs disponíveis');
        return;
      }

      console.log('✅ Informações encontradas:', productInfo);
      setApiProductInfo(productInfo);
      setBarcodeUpdateModal(true);
    } catch (error) {
      console.error('Erro ao buscar informações do código de barras:', error);
      showError('Erro', 'Ocorreu um erro ao consultar as APIs de código de barras');
    } finally {
      setUpdatingFromBarcode(false);
    }
  };

  // Aplicar informações da API
  const handleApplyApiInfo = () => {
    if (!apiProductInfo) return;

    console.log('📝 Aplicando informações da API:', apiProductInfo);
    
    setProductName(apiProductInfo.name);
    setProductBrand(apiProductInfo.brand || '');
    setProductDescription(apiProductInfo.description || '');
    
    if (apiProductInfo.image) {
      setProductImage(apiProductInfo.image);
    }

    setBarcodeUpdateModal(false);
    setApiProductInfo(null);
    
    showSuccess('Informações atualizadas', 'As informações do produto foram atualizadas com base na API');
  };

  // Aplicar informações automaticamente (sem modal)
  const handleAutoApplyApiInfo = async () => {
    if (!product?.barcode) {
      showError('Erro', 'Este produto não possui código de barras');
      return;
    }

    try {
      setUpdatingFromBarcode(true);
      console.log('🔍 Busca automática para código:', product.barcode);
      
      const productInfo = await barcodeApiService.getProductInfo(product.barcode);
      
      if (!productInfo) {
        showError('Produto não encontrado', 'Não foi possível encontrar informações para este código de barras nas APIs disponíveis');
        return;
      }

      console.log('✅ Informações encontradas:', productInfo);
      
      // Aplicar informações diretamente nos estados
      console.log('📝 Aplicando nos estados do formulário...');
      console.log('📝 Nome atual:', productName, '→ Novo:', productInfo.name);
      console.log('📝 Marca atual:', productBrand, '→ Nova:', productInfo.brand || '');
      console.log('📝 Descrição atual:', productDescription, '→ Nova:', productInfo.description || '');
      console.log('📝 Imagem atual:', productImage, '→ Nova:', productInfo.image);
      
      setProductName(productInfo.name);
      setProductBrand(productInfo.brand || '');
      setProductDescription(productInfo.description || '');
      
      if (productInfo.image) {
        console.log('📷 Aplicando nova imagem:', productInfo.image);
        setProductImage(productInfo.image);
      }
      
      console.log('✅ Estados atualizados com sucesso');
      showSuccess('Informações atualizadas', `Produto atualizado com dados da ${productInfo.source.toUpperCase()}. Clique no ✓ para salvar.`);
    } catch (error) {
      console.error('❌ Erro ao buscar informações do código de barras:', error);
      showError('Erro', 'Ocorreu um erro ao consultar as APIs de código de barras');
    } finally {
      setUpdatingFromBarcode(false);
    }
  };

  // Salvar alterações
  const handleSave = async () => {
    console.log('💾 Iniciando salvamento do produto...');
    console.log('💾 Produto atual:', product);
    console.log('💾 Nome:', productName);
    console.log('💾 Marca:', productBrand);
    console.log('💾 Descrição:', productDescription);
    console.log('💾 Imagem:', productImage);
    console.log('💾 Produto genérico:', selectedGenericProduct);
    
    if (!product || !productName.trim()) {
      console.log('❌ Nome do produto é obrigatório');
      showError('Erro', 'O nome do produto é obrigatório');
      return;
    }

    if (!selectedGenericProduct) {
      console.log('❌ Produto genérico é obrigatório');
      showError('Erro', 'É necessário selecionar um produto genérico');
      return;
    }

    try {
      setSaving(true);
      
      const updates = {
        name: productName.trim(),
        description: productDescription.trim() || null,
        brand: productBrand.trim() || null,
        image_url: productImage || null,
        generic_product_id: selectedGenericProduct.id,
      };

      console.log('💾 Dados para atualização:', updates);
      console.log('💾 ID do produto:', product.id);

      const { data, error } = await ProductService.updateSpecificProduct(product.id, updates);

      console.log('💾 Resultado da atualização:', { data, error });

      if (error) {
        console.error('❌ Erro ao salvar:', error);
        showError('Erro', `Não foi possível salvar as alterações: ${error.message || error}`);
        return;
      }

      console.log('✅ Produto salvo com sucesso:', data);
      showSuccess('Produto atualizado', 'As alterações foram salvas com sucesso');
      router.back();
    } catch (error) {
      console.error('❌ Erro ao salvar produto:', error);
      showError('Erro', `Ocorreu um erro ao salvar as alterações: ${error.message || error}`);
    } finally {
      setSaving(false);
    }
  };

  // Selecionar imagem
  const handleSelectImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar suas fotos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProductImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      showError('Erro', 'Não foi possível selecionar a imagem');
    }
  };

  // Tirar foto
  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos de permissão para usar a câmera.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProductImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao tirar foto:', error);
      showError('Erro', 'Não foi possível tirar a foto');
    }
  };

  // Opções de imagem
  const handleImageOptions = () => {
    Alert.alert(
      'Imagem do Produto',
      'Escolha uma opção:',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Galeria', onPress: handleSelectImage },
        { text: 'Câmera', onPress: handleTakePhoto },
        ...(productImage ? [{ text: 'Remover', onPress: () => setProductImage(undefined), style: 'destructive' as const }] : [])
      ]
    );
  };

  if (loading) {
    return (
      <SafeContainer style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Carregando produto...</Text>
        </View>
      </SafeContainer>
    );
  }

  if (!product) {
    return (
      <SafeContainer style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
          <Text style={styles.errorText}>Produto não encontrado</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeContainer>
    );
  }

  return (
    <SafeContainer style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Editar Produto</Text>
        
        <TouchableOpacity 
          style={[styles.headerButton, saving && styles.buttonDisabled]} 
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#4CAF50" />
          ) : (
            <Ionicons name="checkmark" size={24} color="#4CAF50" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Seção de atualização via código de barras */}
        {product.barcode && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Atualizar via Código de Barras</Text>
            <Text style={styles.sectionDescription}>
              Consulte APIs de produtos para atualizar automaticamente as informações
            </Text>
            
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.updateButton, styles.updateButtonSecondary, updatingFromBarcode && styles.buttonDisabled]}
                onPress={handleUpdateFromBarcode}
                disabled={updatingFromBarcode}
              >
                {updatingFromBarcode ? (
                  <ActivityIndicator size="small" color="#2196F3" />
                ) : (
                  <Ionicons name="eye-outline" size={20} color="#2196F3" />
                )}
                <Text style={styles.updateButtonSecondaryText}>
                  Ver Informações
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.updateButton, updatingFromBarcode && styles.buttonDisabled]}
                onPress={handleAutoApplyApiInfo}
                disabled={updatingFromBarcode}
              >
                {updatingFromBarcode ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="download-outline" size={20} color="#fff" />
                )}
                <Text style={styles.updateButtonText}>
                  Aplicar Automaticamente
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Imagem do produto */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Imagem do Produto</Text>
          <TouchableOpacity style={styles.imageContainer} onPress={handleImageOptions}>
            {productImage ? (
              <Image source={{ uri: productImage }} style={styles.productImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera-outline" size={40} color="#999" />
                <Text style={styles.imagePlaceholderText}>Adicionar Imagem</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Informações básicas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Básicas</Text>
          
          <Text style={styles.fieldLabel}>Nome do Produto *</Text>
          <TextInput
            style={styles.textInput}
            value={productName}
            onChangeText={setProductName}
            placeholder="Nome do produto"
            multiline={false}
          />
          
          <Text style={styles.fieldLabel}>Marca</Text>
          <TextInput
            style={styles.textInput}
            value={productBrand}
            onChangeText={setProductBrand}
            placeholder="Marca do produto"
            multiline={false}
          />
          
          <Text style={styles.fieldLabel}>Descrição</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={productDescription}
            onChangeText={setProductDescription}
            placeholder="Descrição do produto"
            multiline={true}
            numberOfLines={3}
          />
        </View>

        {/* Produto genérico */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Produto Genérico *</Text>
          
          <TouchableOpacity 
            style={styles.genericProductSelector}
            onPress={() => setShowGenericProductModal(true)}
          >
            <View style={styles.genericProductInfo}>
              <Text style={styles.genericProductName}>
                {selectedGenericProduct?.name || 'Selecionar produto genérico'}
              </Text>
              {selectedGenericProduct?.categories && (
                <Text style={styles.genericProductCategory}>
                  {selectedGenericProduct.categories.name}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Código de barras (apenas exibição) */}
        {product.barcode && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Código de Barras</Text>
            <View style={styles.barcodeInfo}>
              <Text style={styles.barcodeText}>{product.barcode}</Text>
              <Text style={styles.barcodeType}>{product.barcode_type || 'EAN13'}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modal de seleção de produto genérico */}
      <GenericProductSelector
        visible={showGenericProductModal}
        onClose={() => setShowGenericProductModal(false)}
        onSelectProduct={(genericProduct) => {
          setSelectedGenericProduct(genericProduct);
          setShowGenericProductModal(false);
        }}
        searchQuery={productName}
      />

      {/* Modal de atualização via API */}
      <Modal
        visible={showBarcodeUpdateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setBarcodeUpdateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Informações Encontradas</Text>
              <TouchableOpacity
                onPress={() => setBarcodeUpdateModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {apiProductInfo && (
              <ScrollView style={styles.modalBody}>
                <Text style={styles.modalDescription}>
                  Encontramos as seguintes informações na {apiProductInfo.source}:
                </Text>

                {apiProductInfo.image && (
                  <Image source={{ uri: apiProductInfo.image }} style={styles.apiProductImage} />
                )}

                <View style={styles.apiInfoItem}>
                  <Text style={styles.apiInfoLabel}>Nome:</Text>
                  <Text style={styles.apiInfoValue}>{apiProductInfo.name}</Text>
                </View>

                {apiProductInfo.brand && (
                  <View style={styles.apiInfoItem}>
                    <Text style={styles.apiInfoLabel}>Marca:</Text>
                    <Text style={styles.apiInfoValue}>{apiProductInfo.brand}</Text>
                  </View>
                )}

                {apiProductInfo.description && (
                  <View style={styles.apiInfoItem}>
                    <Text style={styles.apiInfoLabel}>Descrição:</Text>
                    <Text style={styles.apiInfoValue}>{apiProductInfo.description}</Text>
                  </View>
                )}

                <View style={styles.apiInfoItem}>
                  <Text style={styles.apiInfoLabel}>Fonte:</Text>
                  <Text style={styles.apiInfoValue}>{apiProductInfo.source}</Text>
                </View>

                <View style={styles.apiInfoItem}>
                  <Text style={styles.apiInfoLabel}>Confiança:</Text>
                  <Text style={styles.apiInfoValue}>{Math.round(apiProductInfo.confidence * 100)}%</Text>
                </View>
              </ScrollView>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setBarcodeUpdateModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalApplyButton}
                onPress={handleApplyApiInfo}
              >
                <Text style={styles.modalApplyText}>Aplicar Informações</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerButton: {
    padding: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  backButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  updateButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 1,
  },
  updateButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  updateButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  updateButtonSecondaryText: {
    color: '#2196F3',
    fontWeight: '600',
    marginLeft: 8,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  productImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 12,
    color: '#999',
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
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
  genericProductSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  genericProductInfo: {
    flex: 1,
  },
  genericProductName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  genericProductCategory: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  barcodeInfo: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  barcodeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'monospace',
  },
  barcodeType: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  apiProductImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 16,
  },
  apiInfoItem: {
    marginBottom: 12,
  },
  apiInfoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  apiInfoValue: {
    fontSize: 16,
    color: '#666',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  modalApplyButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  modalApplyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});