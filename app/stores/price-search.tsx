import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import SafeContainer from '../../components/SafeContainer';
import SimpleBarcodeScanner from '../../components/SimpleBarcodeScanner';
import PriceInputModal from '../../components/PriceInputModal';
import ConfirmDialog from '../../components/ConfirmDialog';
import ProductImage from '../../components/ProductImage';
import { useToast } from '../../context/ToastContext';
import { BarcodeService, ProductInfo, BarcodeResult } from '../../lib/barcode';
import { ProductService } from '../../lib/products';
import { PriceSearchService } from '../../lib/priceSearch';
import { CategoryService } from '../../lib/categories';
import { supabase } from '../../lib/supabase';
import type { SpecificProduct, Store, PriceSearchSession, PriceSearchItem } from '../../lib/supabase';

// Tipos para a lista de preços
type PriceListItem = {
  id: string;
  product: SpecificProduct;
  price?: number;
  scanned: boolean;
  created_at: string;
  session_item_id?: string; // ID do item na sessão
};

export default function PriceSearchScreen() {
  const params = useLocalSearchParams<{ storeId?: string; storeName?: string }>();
  const router = useRouter();
  const { showSuccess, showError, showWarning } = useToast();
  
  const [store, setStore] = useState<Store | null>(null);
  const [priceList, setPriceList] = useState<PriceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showPriceModal, setPriceModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PriceListItem | null>(null);
  const [scannerLoading, setScannerLoading] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<PriceListItem | null>(null);
  const [currentSession, setCurrentSession] = useState<PriceSearchSession | null>(null);
  const [showSessionFinalizedModal, setShowSessionFinalizedModal] = useState(false);
  const [finalizedSessionId, setFinalizedSessionId] = useState<string | null>(null);

  // Carregar dados da loja
  useEffect(() => {
    if (params.storeId) {
      loadStoreData();
    } else {
      setLoading(false);
    }
  }, [params.storeId]);

  const loadStoreData = async () => {
    if (!params.storeId) return;

    try {
      setLoading(true);
      
      // Carregar dados da loja
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('id', params.storeId)
        .single();

      if (storeError) {
        showError('Erro', 'Não foi possível carregar os dados da loja');
        return;
      }

      setStore(storeData);

      // Buscar ou criar sessão ativa
      let session = null;
      const { data: existingSession } = await PriceSearchService.getActiveSession(params.storeId);
      
      if (existingSession) {
        session = existingSession;
      } else {
        // Criar nova sessão
        const { data: newSession } = await PriceSearchService.createSession(params.storeId);
        session = newSession;
      }

      if (session) {
        setCurrentSession(session);
        await loadSessionItems(session.id);
      }

    } catch (error) {
      console.error('Erro ao carregar loja:', error);
      showError('Erro', 'Ocorreu um erro ao carregar a loja');
    } finally {
      setLoading(false);
    }
  };

  const loadSessionItems = async (sessionId: string) => {
    try {
      const { data: items } = await PriceSearchService.getSessionItems(sessionId);
      
      if (items) {
        const priceListItems: PriceListItem[] = items.map(item => ({
          id: `session_${item.id}`,
          session_item_id: item.id,
          product: item.specific_products as SpecificProduct,
          price: item.price || undefined,
          scanned: item.scanned,
          created_at: item.created_at,
        }));
        
        setPriceList(priceListItems);
      }
    } catch (error) {
      console.error('Erro ao carregar itens da sessão:', error);
    }
  };

  const handleOpenScanner = () => {
    setShowScanner(true);
  };

  const handleCloseScanner = () => {
    setShowScanner(false);
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
        
        // Verificar se já está na lista de preços
        const alreadyInList = priceList.some(item => item.product.id === existingProduct.id);
        
        if (alreadyInList) {
          showWarning('Produto já adicionado', 'Este produto já está na sua lista de preços.');
          return;
        }

        // Adicionar à sessão no banco de dados
        if (currentSession) {
          const { data: sessionItem, alreadyExists } = await PriceSearchService.addItemToSession(
            currentSession.id, 
            existingProduct.id, 
            true
          );

          if (alreadyExists) {
            showWarning('Produto já adicionado', 'Este produto já está na sua lista de preços.');
            return;
          }

          if (sessionItem) {
            // Adicionar à lista local
            const newItem: PriceListItem = {
              id: `session_${sessionItem.id}`,
              session_item_id: sessionItem.id,
              product: existingProduct,
              scanned: true,
              created_at: new Date().toISOString(),
            };

            setPriceList(prev => [...prev, newItem]);
            setSelectedItem(newItem);
            setPriceModalVisible(true);
          }
        }
        
      } else {
        // Produto não existe, buscar nas APIs externas
        const searchResult = await BarcodeService.searchWithFallback(result.data);
        
        if (searchResult.found && searchResult.product) {
          // Criar produto automaticamente
          await createProductFromScan(searchResult.product);
        } else {
          showWarning('Produto não encontrado', 'Este produto não foi encontrado em nossa base de dados. Será criado automaticamente.');
          createManualProduct(result.data);
        }
      }
    } catch (error) {
      console.error('Erro ao processar código de barras:', error);
      showError('Erro', 'Ocorreu um erro ao processar o código de barras');
    } finally {
      setScannerLoading(false);
    }
  };

  const createProductFromScan = async (productInfo: ProductInfo) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        showError('Erro', 'Usuário não autenticado');
        return;
      }

      // Buscar ou criar produto genérico padrão "Outros"
      const { data: genericProduct, error: genericError } = await ProductService.getOrCreateDefaultGenericProduct();

      if (genericError || !genericProduct) {
        throw new Error('Erro ao obter produto genérico padrão');
      }

      // Criar produto específico
      const { data: specificProduct, error: specificError } = await ProductService.createSpecificProduct({
        generic_product_id: genericProduct.id,
        name: productInfo.name || `Produto ${productInfo.barcode}`,
        brand: productInfo.brand || '',
        barcode: productInfo.barcode,
        description: productInfo.description || '',
        image_url: productInfo.image || '',
        data_source: productInfo.source,
        confidence_score: productInfo.confidence,
        user_id: user.id,
      });

      if (specificError || !specificProduct) {
        throw new Error('Erro ao criar produto específico');
      }

      // Adicionar à sessão no banco de dados
      if (currentSession) {
        const { data: sessionItem } = await PriceSearchService.addItemToSession(
          currentSession.id, 
          specificProduct.id, 
          true
        );

        if (sessionItem) {
          // Adicionar à lista local
          const newItem: PriceListItem = {
            id: `session_${sessionItem.id}`,
            session_item_id: sessionItem.id,
            product: { ...specificProduct, generic_products: genericProduct },
            scanned: true,
            created_at: new Date().toISOString(),
          };

          setPriceList(prev => [...prev, newItem]);
          setSelectedItem(newItem);
          setPriceModalVisible(true);
        }
      }

    } catch (error) {
      console.error('Erro ao criar produto:', error);
      showError('Erro', 'Não foi possível criar o produto');
    }
  };

  const createManualProduct = async (barcode: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        showError('Erro', 'Usuário não autenticado');
        return;
      }

      const productName = `Produto ${barcode}`;

      // Buscar ou criar produto genérico padrão "Outros"
      const { data: genericProduct, error: genericError } = await ProductService.getOrCreateDefaultGenericProduct();

      if (genericError || !genericProduct) {
        throw new Error('Erro ao obter produto genérico padrão');
      }

      // Criar produto específico
      const { data: specificProduct, error: specificError } = await ProductService.createSpecificProduct({
        generic_product_id: genericProduct.id,
        name: productName,
        brand: '',
        barcode: barcode,
        data_source: 'manual',
        confidence_score: 0.5,
        user_id: user.id,
      });

      if (specificError || !specificProduct) {
        throw new Error('Erro ao criar produto específico');
      }

      // Adicionar à sessão no banco de dados
      if (currentSession) {
        const { data: sessionItem } = await PriceSearchService.addItemToSession(
          currentSession.id, 
          specificProduct.id, 
          true
        );

        if (sessionItem) {
          // Adicionar à lista local
          const newItem: PriceListItem = {
            id: `session_${sessionItem.id}`,
            session_item_id: sessionItem.id,
            product: { ...specificProduct, generic_products: genericProduct },
            scanned: true,
            created_at: new Date().toISOString(),
          };

          setPriceList(prev => [...prev, newItem]);
          setSelectedItem(newItem);
          setPriceModalVisible(true);
        }
      }

    } catch (error) {
      console.error('Erro ao criar produto manual:', error);
      showError('Erro', 'Não foi possível criar o produto');
    }
  };

  const handlePriceConfirm = async (price: number) => {
    if (!selectedItem || !store || !selectedItem.session_item_id) return;

    try {
      // Atualizar preço na sessão
      await PriceSearchService.updateItemPrice(selectedItem.session_item_id, price);

      // Salvar preço no histórico
      await ProductService.addProductPrice(selectedItem.product.id, {
        store_id: store.id,
        price: price,
        date: new Date().toISOString(),
      });

      // Atualizar item na lista local
      setPriceList(prev =>
        prev.map(item =>
          item.id === selectedItem.id
            ? { ...item, price: price }
            : item
        )
      );

      setPriceModalVisible(false);
      setSelectedItem(null);

      showSuccess('Sucesso', 'Preço salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar preço:', error);
      showError('Erro', 'Não foi possível salvar o preço');
    }
  };

  const handleEditPrice = (item: PriceListItem) => {
    setSelectedItem(item);
    setPriceModalVisible(true);
  };

  const handleRemoveItem = (itemId: string) => {
    const item = priceList.find(p => p.id === itemId);
    if (item) {
      setItemToRemove(item);
      setShowRemoveDialog(true);
    }
  };

  const confirmRemoveItem = async () => {
    if (itemToRemove && itemToRemove.session_item_id) {
      try {
        // Remover da sessão no banco
        await PriceSearchService.removeItemFromSession(itemToRemove.session_item_id);
        
        // Remover da lista local
        setPriceList(prev => prev.filter(item => item.id !== itemToRemove.id));
        showSuccess('Removido', 'Produto removido da lista');
        setShowRemoveDialog(false);
        setItemToRemove(null);
      } catch (error) {
        console.error('Erro ao remover item:', error);
        showError('Erro', 'Não foi possível remover o produto');
      }
    }
  };

  const cancelRemoveItem = () => {
    setShowRemoveDialog(false);
    setItemToRemove(null);
  };

  const handleFinalizeSession = async () => {
    if (!currentSession) return;

    try {
      const itemsWithPrice = priceList.filter(item => item.price && item.price > 0);
      
      if (itemsWithPrice.length === 0) {
        showWarning('Atenção', 'Adicione pelo menos um preço antes de finalizar');
        return;
      }

      const { error, itemsCount } = await PriceSearchService.finalizeSession(currentSession.id);
      
      if (error) {
        showError('Erro', 'Não foi possível finalizar a sessão');
        return;
      }

      // Mostrar toast com link para a sessão finalizada
      showSessionFinalized(currentSession.id, itemsCount);
      
      // Limpar lista local e criar nova sessão
      setPriceList([]);
      const { data: newSession } = await PriceSearchService.createSession(params.storeId!);
      setCurrentSession(newSession);
      
    } catch (error) {
      console.error('Erro ao finalizar sessão:', error);
      showError('Erro', 'Ocorreu um erro ao finalizar a sessão');
    }
  };

  const showSessionFinalized = (sessionId: string, itemsCount: number) => {
    // Usar um toast customizado com ação
    showSuccess(
      'Pesquisa Finalizada!', 
      `${itemsCount} preços salvos. Toque aqui para ver o resumo.`
    );
    
    // Mostrar um modal com opções
    setTimeout(() => {
      setShowSessionFinalizedModal(true);
      setFinalizedSessionId(sessionId);
    }, 1000);
  };

  const handleClearSession = async () => {
    if (!currentSession) return;

    try {
      await PriceSearchService.clearSession(currentSession.id);
      setPriceList([]);
      showSuccess('Limpo', 'Lista de preços limpa');
    } catch (error) {
      console.error('Erro ao limpar sessão:', error);
      showError('Erro', 'Não foi possível limpar a lista');
    }
  };

  const renderPriceItem = ({ item }: { item: PriceListItem }) => (
    <View style={styles.priceItem}>
      <View style={styles.productImageContainer}>
        <ProductImage 
          imageUrl={item.product.image_url}
          size="medium"
        />
      </View>

      <View style={styles.productInfo}>
        <View style={styles.productHeader}>
          <Text style={styles.productName}>{item.product.name}</Text>
          {item.scanned && (
            <Ionicons name="barcode-outline" size={16} color="#4CAF50" />
          )}
        </View>
        
        {item.product.brand && (
          <Text style={styles.productBrand}>{item.product.brand}</Text>
        )}
        
        {item.product.barcode && (
          <Text style={styles.productBarcode}>Código: {item.product.barcode}</Text>
        )}
      </View>

      <View style={styles.priceSection}>
        {item.price ? (
          <TouchableOpacity
            style={styles.priceButton}
            onPress={() => handleEditPrice(item)}
          >
            <Text style={styles.priceText}>R$ {item.price.toFixed(2)}</Text>
            <Ionicons name="pencil" size={16} color="#4CAF50" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.addPriceButton}
            onPress={() => handleEditPrice(item)}
          >
            <Text style={styles.addPriceText}>Adicionar preço</Text>
            <Ionicons name="add" size={16} color="#666" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveItem(item.id)}
        >
          <Ionicons name="trash-outline" size={16} color="#f44336" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </SafeContainer>
    );
  }

  return (
    <SafeContainer>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Pesquisa de Preços</Text>
          {store && (
            <Text style={styles.headerSubtitle}>{store.name}</Text>
          )}
        </View>
      </View>

      {/* Scanner Button */}
      <View style={styles.scannerSection}>
        <TouchableOpacity
          style={styles.scannerButton}
          onPress={handleOpenScanner}
          disabled={scannerLoading}
        >
          {scannerLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="barcode-outline" size={24} color="#fff" />
          )}
          <Text style={styles.scannerButtonText}>
            {scannerLoading ? 'Processando...' : 'Escanear Produto'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Price List */}
      <View style={styles.listContainer}>
        {priceList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="barcode-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>Nenhum produto escaneado</Text>
            <Text style={styles.emptySubtitle}>
              Use o scanner para adicionar produtos e registrar preços
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.listHeader}>
              <View style={styles.listHeaderTop}>
                <Text style={styles.listTitle}>
                  Produtos ({priceList.length})
                </Text>
                <Text style={styles.totalValue}>
                  Total: R$ {priceList.reduce((sum, item) => sum + (item.price || 0), 0).toFixed(2)}
                </Text>
              </View>
              
              {priceList.length > 0 && (
                <View style={styles.listActions}>
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={handleClearSession}
                  >
                    <Ionicons name="trash-outline" size={16} color="#f44336" />
                    <Text style={styles.clearButtonText}>Limpar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.finalizeButton}
                    onPress={handleFinalizeSession}
                  >
                    <Ionicons name="checkmark-circle-outline" size={16} color="#4CAF50" />
                    <Text style={styles.finalizeButtonText}>Finalizar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            
            <FlatList
              data={priceList}
              renderItem={renderPriceItem}
              keyExtractor={(item) => item.id}
              style={styles.list}
              showsVerticalScrollIndicator={false}
            />
          </>
        )}
      </View>

      {/* Scanner Modal */}
      <Modal
        visible={showScanner}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleCloseScanner}
      >
        <SimpleBarcodeScanner
          onBarcodeScanned={handleBarcodeScanned}
          onClose={handleCloseScanner}
          onManualEntry={handleCloseScanner}
        />
      </Modal>

      {/* Price Input Modal */}
      <PriceInputModal
        visible={showPriceModal}
        onClose={() => {
          setPriceModalVisible(false);
          setSelectedItem(null);
        }}
        onConfirm={handlePriceConfirm}
        productName={selectedItem?.product.name || ''}
        productBrand={selectedItem?.product.brand || undefined}
        productImage={selectedItem?.product.image_url || undefined}
        currentPrice={selectedItem?.price}
      />

      {/* Remove Item Confirmation Dialog */}
      <ConfirmDialog
        visible={showRemoveDialog}
        title="Remover Produto"
        message={`Deseja remover "${itemToRemove?.product.name}" da lista?`}
        confirmText="Remover"
        cancelText="Cancelar"
        confirmColor="#ef4444"
        icon="trash"
        iconColor="#ef4444"
        onConfirm={confirmRemoveItem}
        onCancel={cancelRemoveItem}
      />

      {/* Session Finalized Modal */}
      <Modal
        visible={showSessionFinalizedModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowSessionFinalizedModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sessionFinalizedModal}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
            </View>
            
            <Text style={styles.modalTitle}>Pesquisa Finalizada!</Text>
            <Text style={styles.modalMessage}>
              Sua pesquisa de preços foi salva com sucesso. Você pode consultar os detalhes a qualquer momento.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalSecondaryButton}
                onPress={() => setShowSessionFinalizedModal(false)}
              >
                <Text style={styles.modalSecondaryButtonText}>Continuar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalPrimaryButton}
                onPress={() => {
                  setShowSessionFinalizedModal(false);
                  if (finalizedSessionId) {
                    router.push(`/stores/session/${finalizedSessionId}`);
                  }
                }}
              >
                <Ionicons name="receipt-outline" size={20} color="#fff" />
                <Text style={styles.modalPrimaryButtonText}>Ver Resumo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  scannerSection: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  scannerButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  scannerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  listHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  listActions: {
    flexDirection: 'row',
    gap: 12,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  clearButtonText: {
    fontSize: 14,
    color: '#f44336',
    fontWeight: '500',
    marginLeft: 4,
  },
  finalizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8f1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  finalizeButtonText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 4,
  },
  list: {
    flex: 1,
  },
  priceItem: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 6,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  productImageContainer: {
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    flex: 1,
    marginRight: 8,
  },
  productBrand: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  productBarcode: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: 'monospace',
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8f1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    marginRight: 4,
  },
  addPriceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  addPriceText: {
    fontSize: 14,
    color: '#64748b',
    marginRight: 4,
  },
  removeButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fef2f2',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sessionFinalizedModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  modalSecondaryButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  modalSecondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748b',
  },
  modalPrimaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
  },
  modalPrimaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});