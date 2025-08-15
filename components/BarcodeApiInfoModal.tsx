import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProductApiInfo } from '../lib/barcodeApiService';

interface BarcodeApiInfoModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (productInfo: ProductApiInfo) => void;
  productInfo: ProductApiInfo | null;
  loading: boolean;
}

export default function BarcodeApiInfoModal({
  visible,
  onClose,
  onApply,
  productInfo,
  loading,
}: BarcodeApiInfoModalProps) {
  const getSourceName = (source: string) => {
    const sourceNames = {
      cosmos: 'Cosmos API',
      openfoodfacts: 'Open Food Facts',
      upcitemdb: 'UPC Item DB',
      manual: 'Manual',
    };
    return sourceNames[source as keyof typeof sourceNames] || source;
  };

  const getSourceIcon = (source: string) => {
    const sourceIcons = {
      cosmos: 'globe-outline',
      openfoodfacts: 'restaurant-outline',
      upcitemdb: 'barcode-outline',
      manual: 'create-outline',
    };
    return sourceIcons[source as keyof typeof sourceIcons] || 'information-circle-outline';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#4CAF50';
    if (confidence >= 0.6) return '#FF9800';
    return '#F44336';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'Alta';
    if (confidence >= 0.6) return 'Média';
    return 'Baixa';
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Informações do Produto</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>Consultando APIs...</Text>
              </View>
            ) : productInfo ? (
              <>
                {/* Source Info */}
                <View style={styles.sourceContainer}>
                  <View style={styles.sourceHeader}>
                    <Ionicons 
                      name={getSourceIcon(productInfo.source) as any} 
                      size={20} 
                      color="#4CAF50" 
                    />
                    <Text style={styles.sourceName}>
                      {getSourceName(productInfo.source)}
                    </Text>
                  </View>
                  
                  <View style={styles.confidenceContainer}>
                    <Text style={styles.confidenceLabel}>Confiança:</Text>
                    <View style={[
                      styles.confidenceBadge, 
                      { backgroundColor: getConfidenceColor(productInfo.confidence) }
                    ]}>
                      <Text style={styles.confidenceText}>
                        {getConfidenceText(productInfo.confidence)} ({Math.round(productInfo.confidence * 100)}%)
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Product Image */}
                {productInfo.image && (
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: productInfo.image }} style={styles.productImage} />
                  </View>
                )}

                {/* Product Information */}
                <View style={styles.infoContainer}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Nome:</Text>
                    <Text style={styles.infoValue}>{productInfo.name}</Text>
                  </View>

                  {productInfo.brand && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Marca:</Text>
                      <Text style={styles.infoValue}>{productInfo.brand}</Text>
                    </View>
                  )}

                  {productInfo.category && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Categoria:</Text>
                      <Text style={styles.infoValue}>{productInfo.category}</Text>
                    </View>
                  )}

                  {productInfo.description && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Descrição:</Text>
                      <Text style={styles.infoValue}>{productInfo.description}</Text>
                    </View>
                  )}

                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Código de Barras:</Text>
                    <Text style={[styles.infoValue, styles.barcodeText]}>{productInfo.barcode}</Text>
                  </View>
                </View>

                {/* Metadata */}
                {productInfo.metadata && (
                  <View style={styles.metadataContainer}>
                    <Text style={styles.metadataTitle}>Informações Adicionais</Text>
                    
                    {productInfo.metadata.weight && (
                      <View style={styles.metadataItem}>
                        <Ionicons name="scale-outline" size={16} color="#666" />
                        <Text style={styles.metadataText}>Peso: {productInfo.metadata.weight}</Text>
                      </View>
                    )}

                    {productInfo.metadata.volume && (
                      <View style={styles.metadataItem}>
                        <Ionicons name="water-outline" size={16} color="#666" />
                        <Text style={styles.metadataText}>Volume: {productInfo.metadata.volume}</Text>
                      </View>
                    )}

                    {productInfo.metadata.ncm && (
                      <View style={styles.metadataItem}>
                        <Ionicons name="document-text-outline" size={16} color="#666" />
                        <Text style={styles.metadataText}>NCM: {productInfo.metadata.ncm}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Nutritional Info */}
                {productInfo.nutritionalInfo && (
                  <View style={styles.nutritionalContainer}>
                    <Text style={styles.nutritionalTitle}>Informações Nutricionais (por 100g)</Text>
                    
                    {productInfo.nutritionalInfo.energy && (
                      <View style={styles.nutritionalItem}>
                        <Text style={styles.nutritionalLabel}>Energia:</Text>
                        <Text style={styles.nutritionalValue}>{productInfo.nutritionalInfo.energy} kcal</Text>
                      </View>
                    )}

                    {productInfo.nutritionalInfo.proteins && (
                      <View style={styles.nutritionalItem}>
                        <Text style={styles.nutritionalLabel}>Proteínas:</Text>
                        <Text style={styles.nutritionalValue}>{productInfo.nutritionalInfo.proteins}g</Text>
                      </View>
                    )}

                    {productInfo.nutritionalInfo.carbohydrates && (
                      <View style={styles.nutritionalItem}>
                        <Text style={styles.nutritionalLabel}>Carboidratos:</Text>
                        <Text style={styles.nutritionalValue}>{productInfo.nutritionalInfo.carbohydrates}g</Text>
                      </View>
                    )}

                    {productInfo.nutritionalInfo.fat && (
                      <View style={styles.nutritionalItem}>
                        <Text style={styles.nutritionalLabel}>Gorduras:</Text>
                        <Text style={styles.nutritionalValue}>{productInfo.nutritionalInfo.fat}g</Text>
                      </View>
                    )}
                  </View>
                )}
              </>
            ) : (
              <View style={styles.noDataContainer}>
                <Ionicons name="search-outline" size={48} color="#ccc" />
                <Text style={styles.noDataText}>
                  Nenhuma informação encontrada nas APIs disponíveis
                </Text>
                <Text style={styles.noDataSubtext}>
                  Você pode adicionar as informações manualmente
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Actions */}
          {productInfo && !loading && (
            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.applyButton} 
                onPress={() => onApply(productInfo)}
              >
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles.applyButtonText}>Aplicar Informações</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    maxHeight: 400,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  sourceContainer: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    margin: 16,
    borderRadius: 12,
  },
  sourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sourceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  imageContainer: {
    alignItems: 'center',
    padding: 16,
  },
  productImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  infoContainer: {
    padding: 16,
  },
  infoItem: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  barcodeText: {
    fontFamily: 'monospace',
    fontSize: 18,
    color: '#333',
  },
  metadataContainer: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    margin: 16,
    borderRadius: 12,
  },
  metadataTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metadataText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  nutritionalContainer: {
    padding: 16,
    backgroundColor: '#e8f5e8',
    margin: 16,
    borderRadius: 12,
  },
  nutritionalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  nutritionalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nutritionalLabel: {
    fontSize: 14,
    color: '#666',
  },
  nutritionalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  noDataContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  applyButton: {
    flex: 2,
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginLeft: 8,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});