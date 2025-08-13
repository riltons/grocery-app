import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { StoreService } from '../../lib/stores';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';
import SafeContainer from '../../components/SafeContainer';
import NearbySupermarketsModal from '../../components/NearbySupermarketsModal';

export default function NewStore() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  
  // Estados para gerenciar os dados do formulário
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [showNearbyModal, setShowNearbyModal] = useState(false);
  
  // Validar formulário
  const isFormValid = name.trim().length > 0;
  
  // Manipular seleção de supermercado próximo
  const handleSelectSupermarket = (supermarketName: string, supermarketAddress: string) => {
    setName(supermarketName);
    setAddress(supermarketAddress);
  };

  // Salvar nova loja
  const handleSaveStore = async () => {
    if (!isFormValid) {
      showError('Erro', 'Por favor, informe pelo menos o nome da loja');
      return;
    }
    
    try {
      setSaving(true);
      
      // Buscar o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        showError('Erro', 'Usuário não autenticado');
        return;
      }
      
      const { data, error } = await StoreService.createStore({
        name: name.trim(),
        address: address.trim() || undefined,
        user_id: user.id,
      });
      
      if (error) {
        showError('Erro', 'Não foi possível cadastrar a loja');
        console.error('Erro ao cadastrar loja:', error);
        return;
      }
      
      if (data) {
        showSuccess('Sucesso', 'Loja cadastrada com sucesso!');
        router.replace(`/stores/${data.id}`);
      }
    } catch (error) {
      console.error('Erro ao cadastrar loja:', error);
      showError('Erro', 'Ocorreu um erro ao cadastrar a loja');
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
        {/* Botão para buscar supermercados próximos */}
        <TouchableOpacity 
          style={styles.nearbyButton}
          onPress={() => setShowNearbyModal(true)}
        >
          <Ionicons name="location" size={20} color="#4CAF50" />
          <Text style={styles.nearbyButtonText}>
            Buscar supermercados próximos
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#4CAF50" />
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou adicione manualmente</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Nome da Loja *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Supermercado ABC"
            value={name}
            onChangeText={setName}
            maxLength={100}
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

      {/* Modal de supermercados próximos */}
      <NearbySupermarketsModal
        visible={showNearbyModal}
        onClose={() => setShowNearbyModal(false)}
        onSelectSupermarket={handleSelectSupermarket}
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
  nearbyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  nearbyButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
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