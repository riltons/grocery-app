import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { ProductService } from '../../lib/products';
import { supabase } from '../../lib/supabase';
import CategorySelector from '../../components/CategorySelector';
import SafeContainer from '../../components/SafeContainer';
import Toast from '../../components/Toast';
import { useToast } from '../../lib/useToast';

export default function NewProduct() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { toast, showSuccess, showError, hideToast } = useToast();
  
  // Verificar se veio de uma lista específica
  const listId = params.listId as string;
  const returnTo = params.returnTo as string;
  const prefilledName = params.name as string; // Nome pré-preenchido
  const createGenericOnly = params.createGenericOnly === 'true'; // Criar apenas genérico
  
  console.log('📝 NOVO PRODUTO - Parâmetros recebidos:');
  console.log('  listId:', listId);
  console.log('  returnTo:', returnTo);
  console.log('  prefilledName:', prefilledName);
  console.log('  createGenericOnly:', createGenericOnly);
  
  // Estados para gerenciar os dados do formulário
  const [productName, setProductName] = useState(prefilledName || '');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Validar formulário
  const isFormValid = productName.trim().length > 0;
  
  // Salvar novo produto
  const handleSaveProduct = async () => {
    if (!isFormValid) {
      Alert.alert('Erro', 'Por favor, informe pelo menos o nome do produto');
      return;
    }
    
    try {
      setSaving(true);
      
      // Primeiro, verificar se o produto já existe
      const { exists, error: checkError } = await ProductService.checkProductExists(productName.trim());
      
      if (checkError) {
        console.error('Erro ao verificar produto:', checkError);
        Alert.alert('Erro', 'Não foi possível verificar se o produto já existe');
        return;
      }
      
      if (exists) {
        Alert.alert(
          'Produto já existe', 
          `Já existe um produto com o nome "${productName.trim()}". Por favor, escolha um nome diferente.`
        );
        return;
      }
      
      // Buscar usuário autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Erro', 'Usuário não autenticado');
        return;
      }

      const { data: genericProduct, error: genericError } = await ProductService.createGenericProduct({
        name: productName.trim(),
        category_id: selectedCategory || null,
        user_id: user.id,
      });

      if (genericError || !genericProduct) {
        Alert.alert('Erro', 'Não foi possível criar o produto genérico');
        return;
      }

      // Se createGenericOnly for true, criar apenas o produto genérico
      if (createGenericOnly) {
        // Navegar baseado no contexto de onde veio, passando o ID do produto criado
        if (listId) {
          // Se veio de uma lista específica, voltar para ela com o produto criado
          router.replace(`/list/${listId}?openGenericSelector=true&newProductId=${genericProduct.id}&newProductName=${encodeURIComponent(genericProduct.name)}`);
        } else if (returnTo) {
          // Se há um destino específico, ir para lá
          router.replace(returnTo);
        } else {
          // Caso padrão: voltar para a tela anterior
          router.back();
        }
        return;
      }

      // Caso contrário, criar também o produto específico
      const { data, error } = await ProductService.createSpecificProduct({
        generic_product_id: genericProduct.id,
        name: productName.trim(),
        brand: '',
        description: description.trim() || undefined,
        default_unit: 'un', // Unidade padrão inicial
        user_id: user.id,
      });
      
      if (error) {
        console.error('Erro ao cadastrar produto:', error);
        Alert.alert('Erro', 'Ocorreu um erro ao cadastrar o produto');
        return;
      }
      
      if (data) {
        // Navegar imediatamente após sucesso
        if (listId) {
          // Se veio de uma lista específica, voltar para ela
          router.replace(`/list/${listId}`);
        } else if (returnTo) {
          // Se há um destino específico, ir para lá
          router.replace(returnTo);
        } else {
          // Caso padrão: voltar para a tela anterior
          router.back();
        }
      }
    } catch (error) {
      console.error('Erro ao cadastrar produto:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao cadastrar o produto');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <SafeContainer style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Novo Produto</Text>
        
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.formSection}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Nome do Produto *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Arroz Integral"
              value={productName}
              onChangeText={setProductName}
              maxLength={100}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descrição do produto (opcional)"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Categoria</Text>
            <CategorySelector 
              selectedCategory={selectedCategory} 
              onSelectCategory={setSelectedCategory} 
            />
          </View>
        </View>

        {/* Botões na parte inferior */}
        <View style={styles.buttonSection}>
          <TouchableOpacity 
            style={[styles.saveButton, (!isFormValid || saving) && styles.buttonDisabled]}
            onPress={handleSaveProduct}
            disabled={!isFormValid || saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Criar Produto</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    padding: 16,
  },
  formSection: {
    flex: 1,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonSection: {
    paddingTop: 20,
    paddingBottom: 40,
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: '#a5d6a7',
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500',
    fontSize: 16,
  },
});