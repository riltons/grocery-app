import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Lista de categorias disponíveis
const CATEGORIES = [
  { id: 'frutas', name: 'Frutas', icon: 'nutrition' },
  { id: 'vegetais', name: 'Vegetais', icon: 'leaf' },
  { id: 'carnes', name: 'Carnes', icon: 'restaurant' },
  { id: 'laticinios', name: 'Laticínios', icon: 'water' },
  { id: 'padaria', name: 'Padaria', icon: 'pizza' },
  { id: 'mercearia', name: 'Mercearia', icon: 'basket' },
  { id: 'bebidas', name: 'Bebidas', icon: 'beer' },
  { id: 'limpeza', name: 'Limpeza', icon: 'sparkles' },
  { id: 'higiene', name: 'Higiene', icon: 'medical' },
  { id: 'outros', name: 'Outros', icon: 'ellipsis-horizontal' },
];

type Category = {
  id: string;
  name: string;
  icon: string;
};

type CategorySelectorProps = {
  selectedCategory: string | null;
  onSelectCategory: (category: string) => void;
};

export default function CategorySelector({ selectedCategory, onSelectCategory }: CategorySelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filteredCategories, setFilteredCategories] = useState(CATEGORIES);

  // Filtra categorias com base no texto de pesquisa
  useEffect(() => {
    if (searchText) {
      const filtered = CATEGORIES.filter(category =>
        category.name.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(CATEGORIES);
    }
  }, [searchText]);

  // Encontra a categoria selecionada
  const selectedCategoryObj = CATEGORIES.find(cat => cat.id === selectedCategory);

  // Renderiza cada item da lista de categorias
  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[styles.categoryItem, selectedCategory === item.id && styles.selectedCategoryItem]}
      onPress={() => {
        onSelectCategory(item.id);
        setModalVisible(false);
      }}
    >
      <Ionicons name={item.icon as any} size={24} color={selectedCategory === item.id ? '#fff' : '#4CAF50'} />
      <Text style={[styles.categoryName, selectedCategory === item.id && styles.selectedCategoryName]}>
        {item.name}
      </Text>
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
            <Ionicons name={selectedCategoryObj.icon as any} size={20} color="#4CAF50" />
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
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione uma categoria</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Buscar categoria..."
              value={searchText}
              onChangeText={setSearchText}
            />

            <FlatList
              data={filteredCategories}
              renderItem={renderCategoryItem}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={styles.categoriesList}
            />
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
  selectedCategoryText: {
    marginLeft: 8,
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
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  categoriesList: {
    paddingBottom: 20,
  },
  categoryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    margin: 4,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedCategoryItem: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  categoryName: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  selectedCategoryName: {
    color: '#fff',
  },
});