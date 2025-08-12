import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import SafeContainer from '../../../components/SafeContainer';
import { useToast } from '../../../context/ToastContext';
import { ProductService } from '../../../lib/products';
import { CategoryService } from '../../../lib/categories';
import { supabase } from '../../../lib/supabase';
import type { Category } from '../../../lib/supabase';

export default function NewGenericProductScreen() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await CategoryService.getCategories();
      if (error) {
        showError('Erro', 'Não foi possível carregar as categorias');
      } else {
        setCategories(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      showError('Erro', 'Ocorreu um erro ao carregar as categorias');
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showError('Erro', 'O nome do produto é obrigatório');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        showError('Erro', 'Usuário não autenticado');
        return;
      }

      // Verificar se já existe um produto genérico com esse nome
      const { exists, error: checkError } = await ProductService.checkGenericProductExists(formData.name.trim());
      
      if (checkError) {
        console.error('Erro ao verificar produto:', checkError);
        showError('Erro', 'Não foi possível verificar se o produto já existe');
        return;
      }
      
      if (exists) {
        showError(
          'Produto já existe', 
          `Já existe um produto com o nome "${formData.name.trim()}". Por favor, escolha um nome diferente.`
        );
        return;
      }

      const productData = {
        name: formData.name.trim(),
        category_id: formData.category_id || null,
        user_id: user.id,
        is_default: false,
      };

      const { data, error } = await ProductService.createGenericProduct(productData);
      
      if (error) {
        showError('Erro', 'Não foi possível criar o produto genérico');
        return;
      }

      showSuccess('Sucesso', 'Produto genérico criado com sucesso!');
      router.replace('/(tabs)/products');
    } catch (error) {
      console.error('Erro ao criar produto genérico:', error);
      showError('Erro', 'Ocorreu um erro ao criar o produto genérico');
    } finally {
      setLoading(false);
    }
  };

  const renderCategoryOption = (category: Category) => (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryOption,
        formData.category_id === category.id && styles.selectedCategoryOption
      ]}
      onPress={() => setFormData({ ...formData, category_id: category.id })}
    >
      <Ionicons 
        name={category.icon as any || "cube-outline"} 
        size={20} 
        color={formData.category_id === category.id ? '#4CAF50' : category.color || '#64748b'} 
      />
      <Text style={[
        styles.categoryOptionText,
        formData.category_id === category.id && styles.selectedCategoryOptionText
      ]}>
        {category.name}
      </Text>
      {formData.category_id === category.id && (
        <Ionicons name="checkmark" size={20} color="#4CAF50" />
      )}
    </TouchableOpacity>
  );

  if (loadingCategories) {
    return (
      <SafeContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Carregando categorias...</Text>
        </View>
      </SafeContainer>
    );
  }

  return (
    <SafeContainer style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.title}>Novo Produto Genérico</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Básicas</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome do Produto *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Arroz, Feijão, Leite..."
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categoria</Text>
          <Text style={styles.sectionDescription}>
            Selecione uma categoria para organizar melhor seus produtos
          </Text>
          
          <View style={styles.categoriesContainer}>
            {categories.map(renderCategoryOption)}
            
            {formData.category_id && (
              <TouchableOpacity
                style={styles.clearCategoryButton}
                onPress={() => setFormData({ ...formData, category_id: '' })}
              >
                <Ionicons name="close-circle" size={20} color="#ef4444" />
                <Text style={styles.clearCategoryText}>Remover categoria</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="#ffffff" />
              <Text style={styles.saveButtonText}>Criar Produto</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1e293b',
  },
  categoriesContainer: {
    gap: 8,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  selectedCategoryOption: {
    borderColor: '#4CAF50',
    backgroundColor: '#f0f8f1',
  },
  categoryOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  selectedCategoryOptionText: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  clearCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  clearCategoryText: {
    fontSize: 14,
    color: '#ef4444',
  },
  footer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});