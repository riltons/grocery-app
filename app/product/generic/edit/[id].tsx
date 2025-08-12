import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import SafeContainer from '../../../../components/SafeContainer';
import { useToast } from '../../../../context/ToastContext';
import { ProductService } from '../../../../lib/products';
import { CategoryService } from '../../../../lib/categories';
import type { GenericProduct, Category } from '../../../../lib/supabase';

export default function EditGenericProductScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [product, setProduct] = useState<GenericProduct | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
  });

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      // Carregar produto e categorias em paralelo
      const [productResult, categoriesResult] = await Promise.all([
        ProductService.getGenericProductById(id),
        CategoryService.getCategories()
      ]);

      if (productResult.error) {
        showError('Erro', 'Não foi possível carregar o produto');
        router.back();
        return;
      }

      if (categoriesResult.error) {
        showError('Erro', 'Não foi possível carregar as categorias');
      } else {
        setCategories(categoriesResult.data || []);
      }

      const productData = productResult.data;
      setProduct(productData);
      setFormData({
        name: productData?.name || '',
        category_id: productData?.category_id || '',
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showError('Erro', 'Ocorreu um erro ao carregar os dados');
      router.back();
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showError('Erro', 'O nome do produto é obrigatório');
      return;
    }

    setLoading(true);
    try {
      // Verificar se o nome foi alterado e se já existe outro produto com esse nome
      const newName = formData.name.trim();
      const oldName = product?.name || '';
      
      if (newName.toLowerCase() !== oldName.toLowerCase()) {
        const { exists, error: checkError } = await ProductService.checkGenericProductExists(newName, id);
        
        if (checkError) {
          console.error('Erro ao verificar produto:', checkError);
          showError('Erro', 'Não foi possível verificar se o produto já existe');
          return;
        }
        
        if (exists) {
          showError(
            'Produto já existe', 
            `Já existe um produto com o nome "${newName}". Por favor, escolha um nome diferente.`
          );
          return;
        }
      }

      const updates = {
        name: newName,
        category_id: formData.category_id || null,
      };

      const { data, error } = await ProductService.updateGenericProduct(id, updates);
      
      if (error) {
        showError('Erro', 'Não foi possível atualizar o produto genérico');
        return;
      }

      showSuccess('Sucesso', 'Produto genérico atualizado com sucesso!');
      router.replace('/(tabs)/products');
    } catch (error) {
      console.error('Erro ao atualizar produto genérico:', error);
      showError('Erro', 'Ocorreu um erro ao atualizar o produto genérico');
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

  if (initialLoading) {
    return (
      <SafeContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Carregando produto...</Text>
        </View>
      </SafeContainer>
    );
  }

  if (!product) {
    return (
      <SafeContainer>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          <Text style={styles.errorTitle}>Produto não encontrado</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
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
        <Text style={styles.title}>Editar Produto Genérico</Text>
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
              <Text style={styles.saveButtonText}>Salvar Alterações</Text>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 32,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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