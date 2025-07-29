import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  TextInput
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { StoreService } from '../../lib/stores';
import SafeContainer from '../../components/SafeContainer';
import type { Store, PriceHistory } from '../../lib/supabase';

export default function StoreDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  // Estados para gerenciar os dados
  const [store, setStore] = useState<Store | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  
  // Carregar dados da loja
  useEffect(() => {
    if (!id) return;
    
    const fetchStoreData = async () => {
      try {
        setLoading(true);
        
        // Buscar dados da loja
        const { data: storeData, error: storeError } = await StoreService.getStoreById(id);
        
        if (storeError) {
          Alert.alert('Erro', 'Não foi possível carregar os detalhes da loja');
          return;
        }
        
        if (storeData) {
          setStore(storeData);
          setName(storeData.name);
          setAddress(storeData.address || '');
        }
        
        // Buscar histórico de preços da loja
        const { data: pricesData, error: pricesError } = await StoreService.getPriceHistoryByStore(id);
        
        if (pricesError) {
          console.error('Erro ao buscar histórico de preços:', pricesError);
        } else if (pricesData) {
          setPriceHistory(pricesData);
        }
      } catch (error) {
        console.error('Erro ao buscar detalhes da loja:', error);
        Alert.alert('Erro', 'Ocorreu um erro ao carregar a loja');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStoreData();
  }, [id]);
  
  // Salvar alterações
  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'Por favor, informe o nome da loja');
      return;
    }
    
    try {
      setSaving(true);
      
      const { error } = await StoreService.updateStore(id, {
        name: name.trim(),
        address: address.trim() || undefined,
      });
      
      if (error) {
        Alert.alert('Erro', 'Não foi possível atualizar a loja');
      } else {
        Alert.alert('Sucesso', 'Loja atualizada com sucesso!');
        setStore(prev => prev ? { ...prev, name: name.trim(), address: address.trim() || undefined } : null);
        setEditing(false);
      }
    } catch (error) {
      console.error('Erro ao atualizar loja:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao atualizar a loja');
    } finally {
      setSaving(false);
    }
  };
  
  // Cancelar edição
  const handleCancel = () => {
    if (store) {
      setName(store.name);
      setAddress(store.address || '');
    }
    setEditing(false);
  };
  
  // Excluir loja
  const handleDelete = () => {
    Alert.alert(
      'Excluir Loja',
      'Tem certeza que deseja excluir esta loja? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await StoreService.deleteStore(id);
              
              if (error) {
                Alert.alert('Erro', 'Não foi possível excluir a loja');
              } else {
                Alert.alert('Sucesso', 'Loja excluída com sucesso!');
                router.replace('/stores');
              }
            } catch (error) {
              console.error('Erro ao excluir loja:', error);
              Alert.alert('Erro', 'Ocorreu um erro ao excluir a loja');
            }
          },
        },
      ]
    );
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Carregando loja...</Text>
      </View>
    );
  }
  
  if (!store) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
        <Text style={styles.errorText}>Loja não encontrada</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <SafeContainer style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Detalhes da Loja</Text>
        
        <TouchableOpacity 
          style={styles.editButton} 
          onPress={() => setEditing(!editing)}
        >
          <Ionicons 
            name={editing ? "close" : "create-outline"} 
            size={24} 
            color="#333" 
          />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Básicas</Text>
          
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Nome da Loja</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Nome da loja"
                maxLength={100}
              />
            ) : (
              <Text style={styles.fieldValue}>{store.name}</Text>
            )}
          </View>
          
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Endereço</Text>
            {editing ? (
              <TextInput
                style={[styles.input, styles.textArea]}
                value={address}
                onChangeText={setAddress}
                placeholder="Endereço da loja"
                multiline
                numberOfLines={3}
                maxLength={300}
              />
            ) : (
              <Text style={styles.fieldValue}>
                {store.address || 'Não informado'}
              </Text>
            )}
          </View>
          
          {editing && (
            <View style={styles.editActions}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={handleCancel}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.saveButton, saving && styles.buttonDisabled]} 
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estatísticas</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{priceHistory.length}</Text>
              <Text style={styles.statLabel}>Preços registrados</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {new Date(store.created_at).toLocaleDateString('pt-BR')}
              </Text>
              <Text style={styles.statLabel}>Cadastrada em</Text>
            </View>
          </View>
        </View>
        
        {!editing && (
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.deleteButton} 
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={20} color="#fff" />
              <Text style={styles.deleteButtonText}>Excluir Loja</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
    backgroundColor: '#fff',
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
    backgroundColor: '#fff',
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
  editButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
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
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  buttonDisabled: {
    backgroundColor: '#a5d6a7',
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  deleteButton: {
    backgroundColor: '#ff6b6b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});