import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProductService } from '../lib/products';
import { SpecificProduct, GenericProduct } from '../lib/supabase';
import SimpleBarcodeScanner from './SimpleBarcodeScanner';
import { BarcodeResult, BarcodeService, ProductInfo, GenericProductMatcher, SpecificProductCreationService } from '../lib/barcode';
import { supabase } from '../lib/supabase';

interface ProductSubstitutionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubstitute: (specificProduct: SpecificProduct) => void;
  genericProduct: GenericProduct | null;
  currentProductName: string;
}

export default function ProductSubstitutionModal({
  visible,
  onClose,
  onSubstitute,
  genericProduct,
  currentProductName,
}: ProductSubstitutionModalProps) {
  const [specificProducts, setSpecificProducts] = useState<SpecificProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [scanningForSubstitution, setScanningForSubstitution] = useState(false);

  useEffect(() => {
    if (visible && genericProduct) {
      fetchSpecificProducts();
    }
  }, [visible, genericProduct]);

  const fetchSpecificProducts = async () => {
    if (!genericProduct) return;

    try {
      setLoading(true);
      const { data, error } = await ProductService.getSpecificProductsByGenericId(genericProduct.id);
      
      if (error) {
        console.error('Erro ao buscar produtos específicos:', error);
        Alert.alert('Erro', 'Não foi possível carregar os produtos específicos');
        return;
      }
      
      if (data) {
        setSpecificProducts(data);
      }
    } catch (error) {
      console.error('Erro ao buscar produtos específicos:', error);
      Alert.alert('Erro', 'Ocorreu um erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleSubstitute = (product: SpecificProduct) => {
    onSubstitute(product);
    onClose();
  };

  const handleCreateNewSpecific = () => {
    // TODO: Implementar criação de novo produto específico
    Alert.alert(
      'Criar Produto Específico',
      'Esta funcionalidade será implementada em breve. Por enquanto, você pode criar produtos específicos através do scanner de código de barras ou na tela de produtos.',
      [{ text: 'OK' }]
    );
  };

  const handleBarcodeScanner = () => {
    setScanningForSubstitution(true);
    setShowBarcodeScanner(true);
  };

  const handleBarcodeScanned = async (result: BarcodeResult) => {
    try {
      setShowBarcodeScanner(false);
      setLoading(true);
      setScanningForSubstitution(true);

      console.log('Código escaneado para substituição:', result.data);

      // Usar a mesma lógica do AddProductInterface - buscar com fallback nas APIs
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
          image: '',
          source: 'manual',
          confidence: 0.5
        };
      }

      // Verificar se já existe um produto específico cadastrado com este código
      const { data: existingProduct } = await ProductService.getSpecificProductByBarcode(result.data);
      
      if (existingProduct) {
        // Produto específico já existe - verificar compatibilidade
        if (existingProduct.generic_product_id !== genericProduct?.id) {
          Alert.alert(
            'Produto Incompatível',
            `O produto escaneado "${existingProduct.name}" não é compatível com "${genericProduct?.name}". Deseja continuar mesmo assim?`,
            [
              { text: 'Cancelar', style: 'cancel' },
              { 
                text: 'Escanear Outro', 
                onPress: () => setShowBarcodeScanner(true) 
              },
              { 
                text: 'Usar Mesmo Assim', 
                onPress: () => handleSubstitute(existingProduct) 
              }
            ]
          );
          return;
        }

        // Produto compatível - fazer substituição
        Alert.alert(
          'Produto Encontrado',
          `Produto "${existingProduct.name}" encontrado! Deseja fazer a substituição?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { 
              text: 'Escanear Outro', 
              onPress: () => setShowBarcodeScanner(true) 
            },
            { 
              text: 'Substituir', 
              onPress: () => handleSubstitute(existingProduct) 
            }
          ]
        );
        return;
      }

      // Produto não existe localmente - criar novo produto específico
      await handleCreateProductFromScannedInfo(productInfo);

    } catch (error) {
      console.error('Erro ao processar código escaneado:', error);
      Alert.alert(
        'Erro',
        'Ocorreu um erro ao processar o código escaneado. Tente novamente.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setScanningForSubstitution(false);
    }
  };

  const handleCreateProductFromScannedInfo = async (productInfo: ProductInfo) => {
    if (!genericProduct) return;

    try {
      setLoading(true);

      // Usar o nome do produto encontrado nas APIs ou um nome padrão
      const productName = productInfo.name || `${genericProduct.name} - ${productInfo.barcode}`;
      const productBrand = productInfo.brand || 'Marca não identificada';

      // Obter o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        Alert.alert('Erro', 'Usuário não autenticado. Faça login novamente.');
        return;
      }

      // Criar um novo produto específico com as informações escaneadas
      const newProduct = {
        name: productName,
        brand: productBrand,
        description: productInfo.description || '',
        image_url: productInfo.image || '',
        barcode: productInfo.barcode,
        barcode_type: 'EAN13', // Assumir EAN13 por padrão
        data_source: productInfo.source,
        confidence_score: productInfo.confidence,
        generic_product_id: genericProduct.id,
        user_id: user.id, // Usar o ID do usuário autenticado
      };

      const { data: createdProduct, error } = await ProductService.createSpecificProduct(newProduct);

      if (error) {
        console.error('Erro ao criar produto específico:', error);
        Alert.alert(
          'Erro',
          'Não foi possível criar o produto específico. Tente novamente.',
          [{ text: 'OK' }]
        );
        return;
      }

      if (createdProduct) {
        const sourceLabel = productInfo.source === 'cosmos' ? 'Cosmos' : 
                          productInfo.source === 'openfoodfacts' ? 'Open Food Facts' : 
                          'Manual';

        Alert.alert(
          'Produto Criado',
          `Produto "${createdProduct.name}" foi criado com sucesso usando dados do ${sourceLabel}! Deseja fazer a substituição?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { 
              text: 'Substituir', 
              onPress: () => handleSubstitute(createdProduct) 
            }
          ]
        );

        // Atualizar a lista de produtos específicos
        setSpecificProducts(prev => [...prev, createdProduct]);
      }

    } catch (error) {
      console.error('Erro ao criar produto a partir das informações escaneadas:', error);
      Alert.alert(
        'Erro',
        'Ocorreu um erro ao criar o produto. Tente novamente.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProductFromBarcode = async (barcode: string) => {
    // Criar ProductInfo básico para compatibilidade
    const basicProductInfo: ProductInfo = {
      barcode,
      name: `${genericProduct?.name} - ${barcode}`,
      brand: 'Marca não identificada',
      category: '',
      description: '',
      image: '',
      source: 'manual',
      confidence: 0.5
    };

    await handleCreateProductFromScannedInfo(basicProductInfo);
  };

  const handleCloseBarcodeScanner = () => {
    setShowBarcodeScanner(false);
    setScanningForSubstitution(false);
  };

  const handleManualEntry = () => {
    setShowBarcodeScanner(false);
    Alert.alert(
      'Entrada Manual',
      'A funcionalidade de entrada manual será implementada em breve. Por enquanto, você pode criar produtos específicos manualmente na tela de produtos.',
      [{ text: 'OK' }]
    );
  };

  const renderSpecificProduct = ({ item }: { item: SpecificProduct }) => (
    <TouchableOpacity
      style={styles.productItem}
      onPress={() => handleSubstitute(item)}
    >
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        {item.brand && (
          <Text style={styles.productBrand}>{item.brand}</Text>
        )}
        {item.barcode && (
          <View style={styles.barcodeContainer}>
            <Ionicons name="barcode-outline" size={14} color="#4CAF50" />
            <Text style={styles.barcodeText}>{item.barcode}</Text>
          </View>
        )}
        {item.data_source && item.data_source !== 'manual' && (
          <Text style={styles.sourceText}>
            Fonte: {getSourceLabel(item.data_source)}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
    </TouchableOpacity>
  );

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'cosmos': return 'Cosmos';
      case 'openfoodfacts': return 'Open Food Facts';
      case 'local': return 'Local';
      default: return 'Manual';
    }
  };

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
          <Text style={styles.title}>Substituir Produto</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Current Product Info */}
        <View style={styles.currentProductContainer}>
          <View style={styles.currentProductHeader}>
            <Ionicons name="swap-horizontal" size={20} color="#666" />
            <Text style={styles.currentProductLabel}>Substituindo:</Text>
          </View>
          <Text style={styles.currentProductName}>{currentProductName}</Text>
          {genericProduct && (
            <Text style={styles.genericProductInfo}>
              Produto genérico: {genericProduct.name}
            </Text>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>
                {scanningForSubstitution ? 'Processando código escaneado...' : 'Carregando produtos específicos...'}
              </Text>
            </View>
          ) : specificProducts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>
                Nenhum produto específico encontrado
              </Text>
              <Text style={styles.emptyDescription}>
                Não há produtos específicos vinculados a "{genericProduct?.name}".
                Você pode escanear um código de barras ou criar um novo produto específico.
              </Text>
              
              {/* Botões de ação */}
              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity
                  style={styles.scanButton}
                  onPress={handleBarcodeScanner}
                >
                  <Ionicons name="barcode-outline" size={20} color="#fff" />
                  <Text style={styles.scanButtonText}>
                    Escanear Código
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={handleCreateNewSpecific}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.createButtonText}>
                    Criar Produto
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {/* Botão de scanner no topo */}
              <TouchableOpacity
                style={styles.scannerButton}
                onPress={handleBarcodeScanner}
              >
                <Ionicons name="barcode-outline" size={24} color="#4CAF50" />
                <Text style={styles.scannerButtonText}>
                  Escanear código de barras para substituir
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#4CAF50" />
              </TouchableOpacity>
              
              <Text style={styles.sectionTitle}>
                Produtos específicos disponíveis ({specificProducts.length})
              </Text>
              <FlatList
                data={specificProducts}
                renderItem={renderSpecificProduct}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                style={styles.productsList}
              />
              
              {/* Create New Option */}
              <TouchableOpacity
                style={styles.createNewOption}
                onPress={handleCreateNewSpecific}
              >
                <Ionicons name="add-circle-outline" size={24} color="#4CAF50" />
                <Text style={styles.createNewText}>
                  Criar novo produto específico
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Scanner de Código de Barras */}
      {showBarcodeScanner && (
        <Modal
          visible={showBarcodeScanner}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={handleCloseBarcodeScanner}
        >
          <SimpleBarcodeScanner
            onBarcodeScanned={handleBarcodeScanned}
            onClose={handleCloseBarcodeScanner}
            onManualEntry={handleManualEntry}
          />
        </Modal>
      )}
    </Modal>
  );
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
  headerSpacer: {
    width: 60,
  },
  currentProductContainer: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  currentProductHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentProductLabel: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
    fontWeight: '500',
  },
  currentProductName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  genericProductInfo: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
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
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 20,
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
  listContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
    marginTop: 8,
  },
  productsList: {
    flex: 1,
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
  productBrand: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  barcodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  barcodeText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
    fontFamily: 'monospace',
  },
  sourceText: {
    fontSize: 11,
    color: '#94a3b8',
    fontStyle: 'italic',
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
    marginBottom: 20,
  },
  createNewText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4CAF50',
    marginLeft: 8,
  },
  // Estilos para botões de ação
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    gap: 12,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  // Estilos para botão de scanner no topo da lista
  scannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f8f1',
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  scannerButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4CAF50',
    flex: 1,
    marginLeft: 12,
  },
});