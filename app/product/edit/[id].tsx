import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { ProductService } from '../../../lib/products';
import SafeContainer from '../../../components/SafeContainer';
import Toast from '../../../components/Toast';
import { useToast } from '../../../lib/useToast';

type Product = {
  id: string;
  name: string;
  description?: string;
  default_unit?: string;
  created_at: string;
  generic_product_id: string;
  generic_products?: {
    name: string;
    category: string | null;
  };
};

export default function EditProduct() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { toast, showSuccess, showError, hideToast } = useToast();
  
  // Estados para gerenciar os dados
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estados do formulário
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [defaultUnit, setDefaultUnit] = useState('');
  
  // Carregar dados do produto
  useEffect(() => {
    if (!id) return;
    
    const fetchProduct = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await ProductService.getSpecificProductById(id);
        
        if (error) {
          console.error('Erro ao buscar produto:', error);
          Alert.alert('Erro', 'Não foi possível carregar o produto');
          router.back();
          return;
        }
        
        if (data) {
          setProduct(data);
          setName(data.name);
          setDescription(data.description || '');
          setDefaultUnit(data.default_unit || '');
        }
      } catch (error) {
        console.error('Erro ao buscar produto:', error);
        Alert.alert('Erro', 'Não foi possível carregar o produto');
        router.back();
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [id]);
  
  // Validar formulário
  const isFormValid = name.trim().length > 0;
  
  // Salvar alterações
  const handleSave = async () => {
    if (!isFormValid || !product) {
      Alert.alert('Erro', 'Nome do produto é obrigatório');
      return;
    }
    
    try {
      setSaving(true);
      
      // Verificar se o nome mudou e se já existe outro produto com o novo nome
      const newName = name.trim();
      const oldName = product.name.trim();
      
      if (newName.toLowerCase() !== oldName.toLowerCase()) {
        const { exists, error: checkError } = await ProductService.checkProductExists(newName);
        
        if (checkError) {
          console.error('Erro ao verificar produto:', checkError);
          Alert.alert('Erro', 'Não foi possível verificar se o produto já existe');
          return;
        }
        
        if (exists) {
          Alert.alert(
            'Produto já existe', 
            `Já existe um produto com o nome "${newName}". Por favor, escolha um nome diferente.`
          );
          return;
        }
      }
      
      const updates = {
        name: newName,
        description: description.trim() || undefined,
        default_unit: defaultUnit.trim() || undefined,
      };
      
      const { error } = await ProductService.updateSpecificProduct(product.id, updates);
      
      if (error) {
        console.error('Erro ao atualizar produto:', error);
        Alert.alert('Erro', 'Não foi possível atualizar o produto');
        return;
      }
      
      showSuccess('Produto atualizado com sucesso!');
      // Aguardar um pouco para o usuário ver o toast, depois voltar
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o produto');
    } finally {
      setSaving(false);
    }
  };
  
  // Excluir produto
  const handleDelete = () => {
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir o produto "${product?.name}"?\n\nEsta ação não pode ser desfeita e removerá também todo o histórico de preços.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };
  
  // Confirmar exclusão
  const confirmDelete = async () => {
    if (!product) return;
    
    try {
      setSaving(true);
      
      const { error } = await ProductService.deleteSpecificProduct(product.id);
      
      if (error) {
        console.error('Erro ao excluir produto:', error);
        Alert.alert('Erro', 'Não foi possível excluir o produto');
        return;
      }
      
      showSuccess('Produto excluído com sucesso!');
      // Aguardar um pouco para o usuário ver o toast, depois navegar
      setTimeout(() => {
        router.replace('/product');
      }, 1500);
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      Alert.alert('Erro', 'Não foi possível excluir o produto');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <SafeContainer style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Carregando produto...</Text>
        </View>
      </SafeContainer>
    );
  }
  
  if (!product) {
    return (
      <SafeContainer style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
          <Text style={styles.errorText}>Produto não encontrado</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={hideToast}
        />
      </SafeContainer>
    );
  }
  
  return (
    <SafeContainer style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Editar Produto</Text>
        
        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={handleDelete}
          disabled={saving}
        >
          <Ionicons name="trash-outline" size={24} color="#ff6b6b" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nome do Produto *</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Digite o nome do produto"
              autoFocus
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Descrição</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Digite uma descrição (opcional)"
              multiline
              numberOfLines={3}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Unidade Padrão</Text>
            <TextInput
              style={styles.textInput}
              value={defaultUnit}
              onChangeText={setDefaultUnit}
              placeholder="Ex: un, kg, L, etc."
            />
          </View>
          
          <TouchableOpacity 
            style={[styles.saveButton, (!isFormValid || saving) && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={!isFormValid || saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Salvar Alterações</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#a5d6a7',
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
