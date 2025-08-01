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
              <Text style={styles.loadingText}>Carregando produtos específicos...</Text>
            </View>
          ) : specificProducts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>
                Nenhum produto específico encontrado
              </Text>
              <Text style={styles.emptyDescription}>
                Não há produtos específicos vinculados a "{genericProduct?.name}".
                Você pode criar um novo produto específico.
              </Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateNewSpecific}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.createButtonText}>
                  Criar Produto Específico
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.listContainer}>
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
});