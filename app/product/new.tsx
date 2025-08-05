import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { ProductService } from '../../lib/products';
import { BarcodeService } from '../../lib/barcode';
import { supabase } from '../../lib/supabase';
import CategorySelector from '../../components/CategorySelector';
import GenericProductSelector from '../../components/GenericProductSelector';
import SafeContainer from '../../components/SafeContainer';
import Toast from '../../components/Toast';
import { useToast } from '../../lib/useToast';

export default function NewProduct() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { toast, showSuccess, showError, hideToast } = useToast();
  
  // Verificar se veio de uma lista específica
  const listId = params.listId as string;
  const returnTo = params.returnTo as string;
  const prefilledName = params.name as string; // Nome pré-preenchido
  const createGenericOnly = params.createGenericOnly === 'true'; // Criar apenas genérico
  const scannedBarcode = params.barcode as string; // Código de barras escaneado
  
  console.log('📝 NOVO PRODUTO - Parâmetros recebidos:');
  console.log('  listId:', listId);
  console.log('  returnTo:', returnTo);
  console.log('  prefilledName:', prefilledName);
  console.log('  createGenericOnly:', createGenericOnly);
  console.log('  scannedBarcode:', scannedBarcode);
  
  // Estados para gerenciar os dados do formulário
  const [productName, setProductName] = useState(prefilledName || '');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedGenericProduct, setSelectedGenericProduct] = useState<any>(null);
  const [showGenericProductSelector, setShowGenericProductSelector] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingBarcodeInfo, setLoadingBarcodeInfo] = useState(false);
  const [barcodeInfo, setBarcodeInfo] = useState<any>(null);
  
  // Buscar informações do produto pelo código de barras
  useEffect(() => {
    if (scannedBarcode) {
      fetchBarcodeInfo(scannedBarcode);
    }
  }, [scannedBarcode]);

  const fetchBarcodeInfo = async (barcode: string) => {
    try {
      setLoadingBarcodeInfo(true);
      console.log('🔍 Buscando informações do produto para código:', barcode);
      
      const result = await BarcodeService.searchWithFallback(barcode);
      
      if (result.found && result.product) {
        console.log('✅ Produto encontrado:', result.product);
        console.log('🖼️ Imagem do produto:', result.product.image);
        setBarcodeInfo(result.product);
        
        // Preencher campos automaticamente
        if (result.product.name && !productName) {
          setProductName(result.product.name);
        }
        if (result.product.description && !description) {
          setDescription(result.product.description);
        }
        
        showSuccess('Informações do produto carregadas automaticamente!');
      } else {
        console.log('❌ Produto não encontrado nas APIs externas');
        showError('Produto não encontrado nas bases de dados. Preencha as informações manualmente.');
      }
    } catch (error) {
      console.error('❌ Erro ao buscar informações do produto:', error);
      showError('Erro ao buscar informações do produto. Preencha manualmente.');
    } finally {
      setLoadingBarcodeInfo(false);
    }
  };

  // Função para extrair o primeiro nome do produto para busca de genéricos
  const extractFirstProductName = (fullName: string): string => {
    if (!fullName) return '';
    
    console.log('🔍 Extraindo nome genérico de:', fullName);
    
    // Lista de marcas comuns para remover
    const commonBrands = [
      'nestle', 'unilever', 'coca-cola', 'pepsi', 'danone', 'lactalis',
      'uncle', 'bens', 'knorr', 'maggi', 'hellmanns', 'ades', 'sadia',
      'perdigao', 'seara', 'friboi', 'swift', 'aurora', 'korin',
      'tio', 'joao', 'camil', 'namorados', 'kicaldo', 'broto', 'legal',
      'qualita', 'great', 'value', 'marca', 'brand'
    ];
    
    // Lista de palavras a ignorar
    const wordsToIgnore = [
      'com', 'sem', 'para', 'tipo', 'sabor', 'natural', 'integral',
      'light', 'diet', 'zero', 'premium', 'especial', 'tradicional',
      'caseiro', 'artesanal', 'orgânico', 'organico'
    ];
    
    // Remover quantidades e unidades
    let cleanName = fullName
      .replace(/\d+\s*(kg|g|ml|l|un|unidades?|pacotes?|caixas?|latas?|garrafas?|frascos?|sachês?)/gi, '')
      .replace(/\b\d+\b/g, '') // Remove números soltos
      .replace(/[()[\]]/g, '') // Remove parênteses e colchetes
      .replace(/\s+/g, ' ') // Normaliza espaços
      .trim();
    
    console.log('🧹 Após limpeza inicial:', cleanName);
    
    // Dividir em palavras e filtrar
    const words = cleanName.split(' ')
      .map(word => word.toLowerCase().trim())
      .filter(word => 
        word.length > 2 && // Palavras com mais de 2 caracteres
        !commonBrands.includes(word) && // Não é marca conhecida
        !wordsToIgnore.includes(word) && // Não é palavra a ignorar
        !/^\d+$/.test(word) // Não é apenas números
      );
    
    console.log('🔤 Palavras filtradas:', words);
    
    // Pegar a primeira palavra significativa
    const genericName = words[0] || fullName.split(' ')[0] || '';
    
    // Capitalizar primeira letra
    const result = genericName.charAt(0).toUpperCase() + genericName.slice(1).toLowerCase();
    
    console.log('✅ Nome genérico extraído:', result);
    
    return result;
  };

  // Validar formulário
  const isFormValid = productName.trim().length > 0 && 
    (scannedBarcode ? selectedGenericProduct !== null : true);
  
  // Salvar novo produto
  const handleSaveProduct = async () => {
    if (!isFormValid) {
      Alert.alert('Erro', 'Por favor, informe pelo menos o nome do produto');
      return;
    }
    
    try {
      setSaving(true);
      
      // Primeiro, verificar se o produto já existe
      const { exists, error: checkError } = await ProductService.checkProductExists(productName.trim());
      
      if (checkError) {
        console.error('Erro ao verificar produto:', checkError);
        Alert.alert('Erro', 'Não foi possível verificar se o produto já existe');
        return;
      }
      
      if (exists) {
        Alert.alert(
          'Produto já existe', 
          `Já existe um produto com o nome "${productName.trim()}". Por favor, escolha um nome diferente.`
        );
        return;
      }
      
      // Buscar usuário autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Erro', 'Usuário não autenticado');
        return;
      }

      // Se createGenericOnly for true, criar apenas o produto genérico
      if (createGenericOnly) {
        const { data: genericProduct, error: genericError } = await ProductService.createGenericProduct({
          name: productName.trim(),
          category_id: selectedCategory || null,
          user_id: user.id,
        });

        if (genericError || !genericProduct) {
          Alert.alert('Erro', 'Não foi possível criar o produto genérico');
          return;
        }

        // Navegar baseado no contexto de onde veio, passando o ID do produto criado
        if (listId) {
          // Se veio de uma lista específica, voltar para ela com o produto criado
          router.replace(`/list/${listId}?openGenericSelector=true&newProductId=${genericProduct.id}&newProductName=${encodeURIComponent(genericProduct.name)}`);
        } else if (returnTo) {
          // Se há um destino específico, ir para lá
          router.replace(returnTo);
        } else {
          // Caso padrão: voltar para a tela anterior
          router.back();
        }
        return;
      }

      // Se há código de barras escaneado, usar produto genérico selecionado ou criar um novo
      let genericProduct;
      
      if (scannedBarcode && selectedGenericProduct) {
        // Usar produto genérico existente selecionado pelo usuário
        genericProduct = selectedGenericProduct;
      } else {
        // Criar novo produto genérico
        const { data: newGenericProduct, error: genericError } = await ProductService.createGenericProduct({
          name: productName.trim(),
          category_id: selectedCategory || null,
          user_id: user.id,
        });

        if (genericError || !newGenericProduct) {
          Alert.alert('Erro', 'Não foi possível criar o produto genérico');
          return;
        }
        
        genericProduct = newGenericProduct;
      }

      // Criar o produto específico
      const productData = {
        generic_product_id: genericProduct.id,
        name: productName.trim(),
        brand: barcodeInfo?.brand || '',
        description: description.trim() || undefined,
        image_url: barcodeInfo?.image || undefined,
        barcode: scannedBarcode || undefined,
        barcode_type: scannedBarcode ? 'EAN13' : undefined,
        external_id: barcodeInfo?.external_id || undefined,
        data_source: barcodeInfo?.source || 'manual',
        confidence_score: barcodeInfo?.confidence || undefined,
        default_unit: 'un', // Unidade padrão inicial
        user_id: user.id,
      };
      
      console.log('💾 Salvando produto com dados:', productData);
      console.log('🖼️ URL da imagem sendo salva:', productData.image_url);
      
      const { data, error } = await ProductService.createSpecificProduct(productData);
      
      if (error) {
        console.error('Erro ao cadastrar produto:', error);
        Alert.alert('Erro', 'Ocorreu um erro ao cadastrar o produto');
        return;
      }
      
      if (data) {
        // Navegar imediatamente após sucesso
        if (listId) {
          // Se veio de uma lista específica, voltar para ela
          router.replace(`/list/${listId}`);
        } else if (returnTo) {
          // Se há um destino específico, ir para lá
          router.replace(returnTo);
        } else {
          // Caso padrão: voltar para a tela anterior
          router.back();
        }
      }
    } catch (error) {
      console.error('Erro ao cadastrar produto:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao cadastrar o produto');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <SafeContainer style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Novo Produto</Text>
        
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Seção de informações do código de barras */}
        {scannedBarcode && (
          <View style={styles.barcodeSection}>
            <View style={styles.barcodeSectionHeader}>
              <Ionicons name="barcode-outline" size={20} color="#4CAF50" />
              <Text style={styles.barcodeSectionTitle}>Código Escaneado</Text>
            </View>
            
            <Text style={styles.barcodeValue}>{scannedBarcode}</Text>
            
            {loadingBarcodeInfo && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#4CAF50" />
                <Text style={styles.loadingText}>Buscando informações do produto...</Text>
              </View>
            )}
            
            {barcodeInfo && (
              <View style={styles.barcodeInfoContainer}>
                <Text style={styles.barcodeInfoTitle}>Informações encontradas:</Text>
                {console.log('🔍 Estado do barcodeInfo na renderização:', barcodeInfo)}
                
                {barcodeInfo.image ? (
                  <View style={styles.productImagePreview}>
                    <Text style={styles.imagePreviewLabel}>Imagem do produto:</Text>
                    <Image 
                      source={{ uri: barcodeInfo.image }} 
                      style={styles.previewImage}
                      resizeMode="cover"
                      onError={(error) => {
                        console.log('❌ Erro ao carregar imagem:', error);
                        console.log('🖼️ URL da imagem com erro:', barcodeInfo.image);
                      }}
                      onLoad={() => {
                        console.log('✅ Imagem carregada com sucesso:', barcodeInfo.image);
                      }}
                    />
                  </View>
                ) : (
                  <Text style={styles.noImageText}>Nenhuma imagem encontrada</Text>
                )}
                
                <Text style={styles.barcodeInfoSource}>Fonte: {barcodeInfo.source}</Text>
                {barcodeInfo.confidence && (
                  <Text style={styles.barcodeInfoConfidence}>
                    Confiança: {Math.round(barcodeInfo.confidence * 100)}%
                  </Text>
                )}
              </View>
            )}
          </View>
        )}
        
        <View style={styles.formSection}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Nome do Produto *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Arroz Integral"
              value={productName}
              onChangeText={setProductName}
              maxLength={100}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descrição do produto (opcional)"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
          </View>
          
          {/* Se há código de barras, mostrar seletor de produto genérico */}
          {scannedBarcode ? (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Produto Genérico *</Text>
              <TouchableOpacity
                style={styles.genericProductSelector}
                onPress={() => setShowGenericProductSelector(true)}
              >
                <Text style={selectedGenericProduct ? styles.selectedGenericText : styles.placeholderText}>
                  {selectedGenericProduct ? selectedGenericProduct.name : 'Selecionar produto genérico'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
              {selectedGenericProduct && (
                <Text style={styles.helperText}>
                  Este produto específico será vinculado ao produto genérico "{selectedGenericProduct.name}"
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Categoria</Text>
              <CategorySelector 
                selectedCategory={selectedCategory} 
                onSelectCategory={setSelectedCategory} 
              />
            </View>
          )}
        </View>

        {/* Botões na parte inferior */}
        <View style={styles.buttonSection}>
          <TouchableOpacity 
            style={[styles.saveButton, (!isFormValid || saving) && styles.buttonDisabled]}
            onPress={handleSaveProduct}
            disabled={!isFormValid || saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Criar Produto</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <GenericProductSelector
        visible={showGenericProductSelector}
        onClose={() => setShowGenericProductSelector(false)}
        onSelectProduct={(product) => {
          setSelectedGenericProduct(product);
          setShowGenericProductSelector(false);
        }}
        searchQuery={scannedBarcode ? extractFirstProductName(productName) : productName}
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
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    padding: 16,
  },
  formSection: {
    flex: 1,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonSection: {
    paddingTop: 20,
    paddingBottom: 40,
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: '#a5d6a7',
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500',
    fontSize: 16,
  },
  // Estilos para seção de código de barras
  barcodeSection: {
    backgroundColor: '#f8f9fa',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  barcodeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  barcodeSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  barcodeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  barcodeInfoContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  barcodeInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  barcodeInfoSource: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  barcodeInfoConfidence: {
    fontSize: 12,
    color: '#4CAF50',
  },
  noImageText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  productImagePreview: {
    marginBottom: 12,
  },
  imagePreviewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  noImageText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  // Estilos para seletor de produto genérico
  genericProductSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  selectedGenericText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
    flex: 1,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
});