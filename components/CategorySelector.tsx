import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CategoryService, Category } from '../lib/categories';

type CategorySelectorProps = {
  selectedCategory: string | null;
  onSelectCategory: (category: string) => void;
};

export default function CategorySelector({ selectedCategory, onSelectCategory }: CategorySelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('basket');
  const [selectedColor, setSelectedColor] = useState('#4CAF50');
  const [creating, setCreating] = useState(false);

  // Carrega categorias quando o modal é aberto
  useEffect(() => {
    if (modalVisible) {
      loadCategories();
    }
  }, [modalVisible]);

  // Filtra categorias com base no texto de pesquisa
  useEffect(() => {
    if (searchText) {
      const filtered = categories.filter(category =>
        category.name.toLowerCase().includes(searchText.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(categories);
    }
  }, [searchText, categories]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await CategoryService.getCategories();
      if (data) {
        setCategories(data);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Erro', 'Nome da categoria é obrigatório');
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await CategoryService.createCategory({
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || undefined,
        icon: selectedIcon,
        color: selectedColor,
      });

      if (error) {
        Alert.alert('Erro', error.message);
        return;
      }

      if (data) {
        // Atualiza a lista de categorias
        await loadCategories();
        
        // Seleciona a nova categoria
        onSelectCategory(data.id);
        
        // Limpa o formulário
        setNewCategoryName('');
        setNewCategoryDescription('');
        setSelectedIcon('basket');
        setSelectedColor('#4CAF50');
        setShowCreateForm(false);
        setModalVisible(false);
        setSearchText('');
      }
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      Alert.alert('Erro', 'Não foi possível criar a categoria');
    } finally {
      setCreating(false);
    }
  };

  const resetCreateForm = () => {
    setNewCategoryName('');
    setNewCategoryDescription('');
    setSelectedIcon('basket');
    setSelectedColor('#4CAF50');
    setShowCreateForm(false);
  };

  // Encontra a categoria selecionada
  const selectedCategoryObj = categories.find(cat => cat.id === selectedCategory);

  // Opções de ícones disponíveis
  const iconOptions = [
    'basket', 'restaurant', 'wine', 'fish', 'leaf', 'pizza', 'ice-cream',
    'cafe', 'beer', 'nutrition', 'fast-food', 'egg', 'water', 'medical',
    'home', 'car', 'shirt', 'flower', 'gift', 'heart'
  ];

  // Opções de cores disponíveis
  const colorOptions = [
    '#4CAF50', '#2196F3', '#FF9800', '#F44336', '#9C27B0', '#607D8B',
    '#795548', '#FF5722', '#3F51B5', '#009688', '#CDDC39', '#FFC107'
  ];

  // Renderiza cada item da lista de categorias
  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem, 
        selectedCategory === item.id && styles.selectedCategoryItem,
        { backgroundColor: selectedCategory === item.id ? (item.color || '#4CAF50') : '#f9f9f9' }
      ]}
      onPress={() => {
        onSelectCategory(item.id);
        setModalVisible(false);
        setSearchText('');
      }}
    >
      <Ionicons 
        name={item.icon as any} 
        size={24} 
        color={selectedCategory === item.id ? '#fff' : (item.color || '#4CAF50')} 
      />
      <View style={styles.categoryInfo}>
        <Text style={[styles.categoryName, selectedCategory === item.id && styles.selectedCategoryName]}>
          {item.name}
        </Text>
        {item.description && (
          <Text style={[styles.categoryDescription, selectedCategory === item.id && styles.selectedCategoryDescription]}>
            {item.description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
      >
        {selectedCategoryObj ? (
          <View style={styles.selectedCategory}>
            <View style={[styles.selectedCategoryIcon, { backgroundColor: selectedCategoryObj.color || '#4CAF50' }]}>
              <Ionicons name={selectedCategoryObj.icon as any} size={16} color="#fff" />
            </View>
            <Text style={styles.selectedCategoryText}>{selectedCategoryObj.name}</Text>
          </View>
        ) : (
          <Text style={styles.placeholderText}>Selecionar categoria</Text>
        )}
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          resetCreateForm();
          setSearchText('');
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione uma categoria</Text>
              <TouchableOpacity onPress={() => {
                setModalVisible(false);
                resetCreateForm();
                setSearchText('');
              }}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar categoria..."
                value={searchText}
                onChangeText={setSearchText}
              />

              {/* Botão para criar nova categoria */}
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => setShowCreateForm(!showCreateForm)}
              >
                <Ionicons name="add-circle" size={20} color="#4CAF50" />
                <Text style={styles.createButtonText}>
                  {showCreateForm ? 'Cancelar' : 'Criar nova categoria'}
                </Text>
              </TouchableOpacity>

              {/* Formulário de criação */}
              {showCreateForm && (
                <View style={styles.createForm}>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Nome da categoria"
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                  />
                  
                  <TextInput
                    style={styles.formInput}
                    placeholder="Descrição (opcional)"
                    value={newCategoryDescription}
                    onChangeText={setNewCategoryDescription}
                    multiline
                    numberOfLines={2}
                  />

                  {/* Seletor de ícone */}
                  <Text style={styles.formLabel}>Ícone:</Text>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.iconScrollView}
                  >
                    <View style={styles.iconGrid}>
                      {iconOptions.map((icon) => (
                        <TouchableOpacity
                          key={icon}
                          style={[
                            styles.iconOption,
                            selectedIcon === icon && styles.selectedIconOption
                          ]}
                          onPress={() => setSelectedIcon(icon)}
                        >
                          <Ionicons name={icon as any} size={20} color={selectedIcon === icon ? '#fff' : '#666'} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>

                  {/* Seletor de cor */}
                  <Text style={styles.formLabel}>Cor:</Text>
                  <View style={styles.colorGrid}>
                    {colorOptions.map((color) => (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.colorOption,
                          { backgroundColor: color },
                          selectedColor === color && styles.selectedColorOption
                        ]}
                        onPress={() => setSelectedColor(color)}
                      >
                        {selectedColor === color && (
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Botões de ação */}
                  <View style={styles.formActions}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={resetCreateForm}
                    >
                      <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.saveButton, creating && styles.disabledButton]}
                      onPress={handleCreateCategory}
                      disabled={creating}
                    >
                      {creating ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.saveButtonText}>Criar</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Lista de categorias */}
              {!showCreateForm && (
                <View style={styles.categoriesContainer}>
                  {loading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#4CAF50" />
                      <Text style={styles.loadingText}>Carregando categorias...</Text>
                    </View>
                  ) : (
                    <View>
                      {filteredCategories.map((item) => (
                        <View key={item.id}>
                          {renderCategoryItem({ item })}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedCategory: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedCategoryIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  selectedCategoryText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
    maxHeight: '85%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalScrollView: {
    flex: 1,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
  },
  categoriesContainer: {
    marginTop: 8,
    paddingBottom: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 4,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedCategoryItem: {
    borderColor: '#333',
    borderWidth: 2,
  },
  categoryInfo: {
    marginLeft: 12,
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  selectedCategoryName: {
    color: '#fff',
    fontWeight: '600',
  },
  categoryDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  selectedCategoryDescription: {
    color: '#fff',
    opacity: 0.9,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f8f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
  },
  createButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
  },
  createForm: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  formInput: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 4,
  },
  iconScrollView: {
    marginBottom: 16,
  },
  iconGrid: {
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  iconOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  selectedIconOption: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    margin: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColorOption: {
    borderColor: '#333',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
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
    color: '#666',
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});