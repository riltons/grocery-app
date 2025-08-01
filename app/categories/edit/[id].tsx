import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { CategoryService, Category, UpdateCategoryData } from '../../../lib/categories';

// Ícones disponíveis para categorias
const AVAILABLE_ICONS = [
  'nutrition', 'leaf', 'restaurant', 'water', 'pizza', 'basket',
  'beer', 'sparkles', 'medical', 'paw', 'home', 'medical-outline',
  'ellipsis-horizontal', 'fast-food', 'wine', 'cafe', 'ice-cream',
  'fish', 'flower', 'car', 'shirt', 'book', 'game-controller',
  'fitness', 'heart', 'star', 'gift', 'camera', 'musical-notes',
];

// Cores disponíveis para categorias
const AVAILABLE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#D7BDE2', '#A9DFBF', '#F1948A', '#BDC3C7',
  '#FF8E53', '#58D68D', '#5DADE2', '#F4D03F', '#AF7AC5',
];

export default function EditCategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('basket');
  const [selectedColor, setSelectedColor] = useState('#4CAF50');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      loadCategory();
    }
  }, [id]);

  const loadCategory = async () => {
    try {
      const { data, error } = await CategoryService.getCategoryById(id);

      if (error) {
        Alert.alert('Erro', 'Não foi possível carregar a categoria');
        router.back();
        return;
      }

      if (data) {
        setCategory(data);
        setName(data.name);
        setDescription(data.description || '');
        setSelectedIcon(data.icon);
        setSelectedColor(data.color || '#4CAF50');
      }
    } catch (error) {
      console.error('Erro ao carregar categoria:', error);
      Alert.alert('Erro', 'Ocorreu um erro inesperado');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'O nome da categoria é obrigatório');
      return;
    }

    setSaving(true);

    try {
      const updateData: UpdateCategoryData = {
        name: name.trim(),
        icon: selectedIcon,
        color: selectedColor,
        description: description.trim() || undefined,
      };

      const { data, error } = await CategoryService.updateCategory(id, updateData);

      if (error) {
        Alert.alert('Erro', error.message || 'Não foi possível atualizar a categoria');
        return;
      }

      Alert.alert('Sucesso', 'Categoria atualizada com sucesso', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      Alert.alert('Erro', 'Ocorreu um erro inesperado');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Confirmar exclusão',
      `Tem certeza que deseja excluir a categoria "${name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            const { error } = await CategoryService.deleteCategory(id);
            
            if (error) {
              Alert.alert('Erro', error.message || 'Não foi possível excluir a categoria');
              return;
            }

            Alert.alert('Sucesso', 'Categoria excluída com sucesso', [
              { text: 'OK', onPress: () => router.back() }
            ]);
          },
        },
      ]
    );
  };

  const renderIconItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.iconItem,
        selectedIcon === item && styles.selectedIconItem,
        { backgroundColor: selectedIcon === item ? selectedColor : '#f5f5f5' }
      ]}
      onPress={() => setSelectedIcon(item)}
    >
      <Ionicons
        name={item as any}
        size={24}
        color={selectedIcon === item ? '#fff' : '#666'}
      />
    </TouchableOpacity>
  );

  const renderColorItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.colorItem,
        { backgroundColor: item },
        selectedColor === item && styles.selectedColorItem,
      ]}
      onPress={() => setSelectedColor(item)}
    >
      {selectedColor === item && (
        <Ionicons name="checkmark" size={16} color="#fff" />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Carregando categoria...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Editar Categoria</Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={20} color="#ff4444" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Preview */}
        <View style={styles.previewContainer}>
          <View style={[styles.previewIcon, { backgroundColor: selectedColor }]}>
            <Ionicons name={selectedIcon as any} size={32} color="#fff" />
          </View>
          <Text style={styles.previewName}>{name || 'Nome da categoria'}</Text>
          {description && (
            <Text style={styles.previewDescription}>{description}</Text>
          )}
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Nome */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Nome *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Frutas, Bebidas, Limpeza..."
              value={name}
              onChangeText={setName}
              maxLength={50}
            />
          </View>

          {/* Descrição */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descrição opcional da categoria"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              maxLength={200}
            />
          </View>

          {/* Ícone */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Ícone</Text>
            <FlatList
              data={AVAILABLE_ICONS}
              renderItem={renderIconItem}
              keyExtractor={(item) => item}
              numColumns={6}
              scrollEnabled={false}
              contentContainerStyle={styles.iconsList}
            />
          </View>

          {/* Cor */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Cor</Text>
            <FlatList
              data={AVAILABLE_COLORS}
              renderItem={renderColorItem}
              keyExtractor={(item) => item}
              numColumns={10}
              scrollEnabled={false}
              contentContainerStyle={styles.colorsList}
            />
          </View>

          {/* Info */}
          {category && (
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                Criada em: {new Date(category.created_at).toLocaleDateString('pt-BR')}
              </Text>
              {category.updated_at && (
                <Text style={styles.infoText}>
                  Última atualização: {new Date(category.updated_at).toLocaleDateString('pt-BR')}
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 8,
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  previewContainer: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f9f9f9',
    margin: 16,
    borderRadius: 12,
  },
  previewIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  previewName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  previewDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  iconsList: {
    gap: 8,
  },
  iconItem: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedIconItem: {
    borderColor: '#333',
  },
  colorsList: {
    gap: 8,
  },
  colorItem: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColorItem: {
    borderColor: '#333',
  },
  infoContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});