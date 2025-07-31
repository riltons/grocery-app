import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
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
  const { toast, showSuccess, showError, hideToast } = useToast();
  
  // Estados para gerenciar os dados do formulário
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Validar formulário
  const isFormValid = name.trim().length > 0;
  
  // Salvar novo produto
  const handleSaveProduct = async () => {
    if (!isFormValid) {
      Alert.alert('Erro', 'Por favor, informe pelo menos o nome do produto');
      return;
    }
    
    try {
      setSaving(true);
      
      // Primeiro, verificar se o produto já existe
      const { exists, error: checkError } = await ProductService.checkProductExists(name.trim());
      
      if (checkError) {
        console.error('Erro ao verificar produto:', checkError);
        Alert.alert('Erro', 'Não foi possível verificar se o produto já existe');
        return;
      }
      
      if (exists) {
        Alert.alert(
          'Produto já existe', 
          `Já existe um produto com o nome "${name.trim()}". Por favor, escolha um nome diferente.`
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
        name: name.trim(),
        category: selectedCategory || null,
        user_id: user.id,
      });

      if (genericError || !genericProduct) {
        Alert.alert('Erro', 'Não foi possível criar o produto genérico');
        return;
      }

      // Depois, criar o produto específico
      const { data, error } = await ProductService.createSpecificProduct({
        generic_product_id: genericProduct.id,
        name: name.trim(),
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
        showSuccess('Produto cadastrado com sucesso!');
        // Aguardar um pouco para o usuário ver o toast, depois voltar
        setTimeout(() => {
          router.back();
        }, 1500);
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
      
      <ScrollView style={styles.content}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Nome do Produto *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Arroz Integral"
            value={name}
            onChangeText={setName}
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
        
        <TouchableOpacity 
          style={[styles.saveButton, (!isFormValid || saving) && styles.buttonDisabled]}
          onPress={handleSaveProduct}
          disabled={!isFormValid || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Salvar Produto</Text>
            </>
          )}
        </TouchableOpacity>
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
    padding: 16,
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
  saveButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 40,
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
});