import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { ProductService } from '../../lib/products';
import CategorySelector from '../../components/CategorySelector';

export default function NewProduct() {
  const router = useRouter();
  
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
      
      const { data, error } = await ProductService.createSpecificProduct({
        name: name.trim(),
        description: description.trim() || undefined,
        category_id: selectedCategory || undefined
      });
      
      if (error) {
        Alert.alert('Erro', 'Não foi possível cadastrar o produto');
        console.error('Erro ao cadastrar produto:', error);
        return;
      }
      
      if (data) {
        Alert.alert(
          'Sucesso', 
          'Produto cadastrado com sucesso!',
          [
            { 
              text: 'OK', 
              onPress: () => router.replace(`/product/${data.id}`)
            }
          ]
        );
      }
    } catch (error) {
      console.error('Erro ao cadastrar produto:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao cadastrar o produto');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
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
    </View>
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
    paddingTop: 50,
    paddingBottom: 16,
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