import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { StoreService } from '../../lib/stores';
import { supabase } from '../../lib/supabase';
import SafeContainer from '../../components/SafeContainer';

export default function NewStore() {
  const router = useRouter();
  
  // Estados para gerenciar os dados do formulário
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Validar formulário
  const isFormValid = name.trim().length > 0;
  
  // Salvar nova loja
  const handleSaveStore = async () => {
    if (!isFormValid) {
      Alert.alert('Erro', 'Por favor, informe pelo menos o nome da loja');
      return;
    }
    
    try {
      setSaving(true);
      
      // Buscar o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Erro', 'Usuário não autenticado');
        return;
      }
      
      const { data, error } = await StoreService.createStore({
        name: name.trim(),
        address: address.trim() || undefined,
        user_id: user.id,
      });
      
      if (error) {
        Alert.alert('Erro', 'Não foi possível cadastrar a loja');
        console.error('Erro ao cadastrar loja:', error);
        return;
      }
      
      if (data) {
        Alert.alert(
          'Sucesso', 
          'Loja cadastrada com sucesso!',
          [
            { 
              text: 'OK', 
              onPress: () => router.replace(`/stores/${data.id}`)
            }
          ]
        );
      }
    } catch (error) {
      console.error('Erro ao cadastrar loja:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao cadastrar a loja');
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
        
        <Text style={styles.headerTitle}>Nova Loja</Text>
        
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Nome da Loja *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Supermercado ABC"
            value={name}
            onChangeText={setName}
            maxLength={100}
            autoFocus
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Endereço</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Endereço da loja (opcional)"
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={3}
            maxLength={300}
          />
        </View>
        
        <TouchableOpacity 
          style={[styles.saveButton, (!isFormValid || saving) && styles.buttonDisabled]}
          onPress={handleSaveStore}
          disabled={!isFormValid || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Salvar Loja</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
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
    minHeight: 80,
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