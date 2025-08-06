import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CategoryService, Category } from '../lib/categories';

interface ProductCreationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (productName: string, categoryId: string | null, unit: string, quantity: number) => void;
  productName: string;
  loading?: boolean;
}

const COMMON_UNITS = ['un', 'kg', 'g', 'L', 'ml', 'pct', 'cx'];
const QUICK_QUANTITIES = [1, 2, 3, 5];

export default function ProductCreationModal({
  visible,
  onClose,
  onConfirm,
  productName,
  loading = false,
}: ProductCreationModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState('un');
  const [quantity, setQuantity] = useState('1');
  const [customQuantity, setCustomQuantity] = useState('');
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Carregar categorias quando o modal abrir
  useEffect(() => {
    if (visible) {
      loadCategories();
      // Reset form
      setSelectedCategoryId(null);
      setSelectedUnit('un');
      setQuantity('1');
      setCustomQuantity('');
    }
  }, [visible]);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const { data, error } = await CategoryService.getCategories();
      
      if (error) {
        console.error('Erro ao carregar categorias:', error);
        Alert.alert('Erro', 'Não foi possível carregar as categorias');
        return;
      }
      
      if (data) {
        setCategories(data);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao carregar as categorias');
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleQuantitySelect = (qty: number) => {
    setQuantity(qty.toString());
    setCustomQuantity('');
  };

  const handleCustomQuantityChange = (value: string) => {
    setCustomQuantity(value);
    if (value.trim()) {
      setQuantity(value);
    }
  };

  const handleConfirm = () => {
    const finalQuantity = parseFloat(quantity) || 1;
    onConfirm(productName, selectedCategoryId, selectedUnit, finalQuantity);
  };

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategoryId === item.id && styles.categoryItemSelected
      ]}
      onPress={() => setSelectedCategoryId(item.id)}
    >
      <Text style={[
        styles.categoryText,
        selectedCategoryId === item.id && styles.categoryTextSelected
      ]}>
        {item.name}
      </Text>
      {selectedCategoryId === item.id && (
        <Ionicons name="checkmark" size={20} color="#fff" />
      )}
    </TouchableOpacity>
  );

  const renderUnitItem = (unit: string) => (
    <TouchableOpacity
      key={unit}
      style={[
        styles.unitItem,
        selectedUnit === unit && styles.unitItemSelected
      ]}
      onPress={() => setSelectedUnit(unit)}
    >
      <Text style={[
        styles.unitText,
        selectedUnit === unit && styles.unitTextSelected
      ]}>
        {unit}
      </Text>
    </TouchableOpacity>
  );

  const renderQuantityItem = (qty: number) => (
    <TouchableOpacity
      key={qty}
      style={[
        styles.quantityItem,
        quantity === qty.toString() && styles.quantityItemSelected
      ]}
      onPress={() => handleQuantitySelect(qty)}
    >
      <Text style={[
        styles.quantityText,
        quantity === qty.toString() && styles.quantityTextSelected
      ]}>
        {qty}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={onClose} 
            disabled={loading}
            style={styles.headerButton}
          >
            <Text style={[styles.cancelButton, loading && styles.disabledButton]}>
              Cancelar
            </Text>
          </TouchableOpacity>
          <Text style={styles.title}>Novo Produto</Text>
          <TouchableOpacity 
            onPress={handleConfirm} 
            disabled={loading}
            style={styles.headerButton}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#4CAF50" />
            ) : (
              <Text style={[styles.confirmButton, loading && styles.disabledButton]}>
                Criar
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Nome do Produto */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Produto</Text>
            <View style={styles.productNameContainer}>
              <Ionicons name="cube-outline" size={20} color="#4CAF50" style={styles.productIcon} />
              <Text style={styles.productName}>{productName}</Text>
            </View>
          </View>

          {/* Quantidade */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quantidade</Text>
            <View style={styles.quantityContainer}>
              <View style={styles.quickQuantityRow}>
                {QUICK_QUANTITIES.map(renderQuantityItem)}
              </View>
              <View style={styles.customQuantityContainer}>
                <TextInput
                  style={[
                    styles.customQuantityInput,
                    customQuantity && styles.customQuantityInputActive
                  ]}
                  placeholder="Outra"
                  placeholderTextColor="#94a3b8"
                  value={customQuantity}
                  onChangeText={handleCustomQuantityChange}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
            </View>
          </View>

          {/* Unidade */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Unidade</Text>
            <View style={styles.unitsContainer}>
              <View style={styles.unitsRow}>
                {COMMON_UNITS.slice(0, 4).map(renderUnitItem)}
              </View>
              <View style={styles.unitsRow}>
                {COMMON_UNITS.slice(4).map(renderUnitItem)}
              </View>
            </View>
          </View>

          {/* Categoria */}
          <View style={[styles.section, styles.lastSection]}>
            <Text style={styles.sectionTitle}>Categoria (Opcional)</Text>
            {loadingCategories ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#4CAF50" />
                <Text style={styles.loadingText}>Carregando categorias...</Text>
              </View>
            ) : (
              <View style={styles.categoriesContainer}>
                <TouchableOpacity
                  style={[
                    styles.categoryItem,
                    selectedCategoryId === null && styles.categoryItemSelected
                  ]}
                  onPress={() => setSelectedCategoryId(null)}
                >
                  <View style={styles.categoryContent}>
                    <Ionicons 
                      name="help-circle-outline" 
                      size={20} 
                      color={selectedCategoryId === null ? "#fff" : "#64748b"} 
                    />
                    <Text style={[
                      styles.categoryText,
                      selectedCategoryId === null && styles.categoryTextSelected
                    ]}>
                      Sem categoria
                    </Text>
                  </View>
                  {selectedCategoryId === null && (
                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  )}
                </TouchableOpacity>
                
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryItem,
                      selectedCategoryId === category.id && styles.categoryItemSelected
                    ]}
                    onPress={() => setSelectedCategoryId(category.id)}
                  >
                    <View style={styles.categoryContent}>
                      <Ionicons 
                        name="pricetag-outline" 
                        size={20} 
                        color={selectedCategoryId === category.id ? "#fff" : "#64748b"} 
                      />
                      <Text style={[
                        styles.categoryText,
                        selectedCategoryId === category.id && styles.categoryTextSelected
                      ]}>
                        {category.name}
                      </Text>
                    </View>
                    {selectedCategoryId === category.id && (
                      <Ionicons name="checkmark-circle" size={24} color="#fff" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerButton: {
    minWidth: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  cancelButton: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  confirmButton: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  disabledButton: {
    color: '#94a3b8',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 28,
  },
  lastSection: {
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  productNameContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
  productIcon: {
    marginRight: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    flex: 1,
  },
  quantityContainer: {
    gap: 16,
  },
  quickQuantityRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  customQuantityContainer: {
    alignItems: 'flex-start',
  },
  quantityItem: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
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
  quantityItemSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
  },
  quantityTextSelected: {
    color: '#ffffff',
  },
  customQuantityInput: {
    width: 100,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  customQuantityInputActive: {
    borderColor: '#4CAF50',
    color: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOpacity: 0.2,
  },
  unitsContainer: {
    gap: 12,
  },
  unitsRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  unitItem: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
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
  unitItemSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  unitText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  unitTextSelected: {
    color: '#ffffff',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
  },
  categoriesContainer: {
    gap: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryItemSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    marginLeft: 12,
  },
  categoryTextSelected: {
    color: '#ffffff',
  },
});