import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ListService } from '../../lib/lists';

// Tipos para a lista e seus itens
type List = {
  id: string;
  name: string;
  description: string;
  created_at: string;
};

type ListItem = {
  id: string;
  list_id: string;
  product_name: string;
  quantity: number;
  unit: string;
  checked: boolean;
  created_at: string;
};

export default function ListDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [list, setList] = useState<List | null>(null);
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [newItemUnit, setNewItemUnit] = useState('un');
  const [addingItem, setAddingItem] = useState(false);
  const router = useRouter();

  // Função para buscar detalhes da lista
  const fetchListDetails = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      // Busca detalhes da lista
      const { data: listData, error: listError } = await ListService.getListById(id);
      
      if (listError) {
        Alert.alert('Erro', 'Não foi possível carregar os detalhes da lista');
        return;
      }
      
      if (listData) {
        setList(listData);
      }
      
      // Busca itens da lista
      const { data: itemsData, error: itemsError } = await ListService.getListItems(id);
      
      if (itemsError) {
        Alert.alert('Erro', 'Não foi possível carregar os itens da lista');
      } else if (itemsData) {
        setItems(itemsData);
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes da lista:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao carregar a lista');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Carregar detalhes quando o componente montar
  useEffect(() => {
    fetchListDetails();
  }, [id]);

  // Função para atualizar a lista (pull-to-refresh)
  const handleRefresh = () => {
    setRefreshing(true);
    fetchListDetails();
  };

  // Função para adicionar um novo item à lista
  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      Alert.alert('Erro', 'Por favor, informe o nome do produto');
      return;
    }

    try {
      setAddingItem(true);
      const { data, error } = await ListService.addListItem(id, {
        product_name: newItemName.trim(),
        quantity: parseFloat(newItemQuantity) || 1,
        unit: newItemUnit.trim() || 'un',
        checked: false,
      });

      if (error) {
        Alert.alert('Erro', 'Não foi possível adicionar o item à lista');
      } else if (data) {
        // Adiciona o novo item à lista local
        setItems(prevItems => [...prevItems, data]);
        // Limpa o campo de novo item
        setNewItemName('');
        setNewItemQuantity('1');
        setNewItemUnit('un');
      }
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao adicionar o item');
    } finally {
      setAddingItem(false);
    }
  };

  // Função para marcar/desmarcar um item
  const handleToggleItem = async (item: ListItem) => {
    try {
      const updatedItem = { ...item, checked: !item.checked };
      const { error } = await ListService.updateListItem(id, item.id, updatedItem);
      
      if (error) {
        Alert.alert('Erro', 'Não foi possível atualizar o item');
      } else {
        // Atualiza o item na lista local
        setItems(prevItems =>
          prevItems.map(i => (i.id === item.id ? updatedItem : i))
        );
      }
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao atualizar o item');
    }
  };

  // Função para remover um item da lista
  const handleRemoveItem = async (itemId: string) => {
    try {
      const { error } = await ListService.removeListItem(id, itemId);
      
      if (error) {
        Alert.alert('Erro', 'Não foi possível remover o item');
      } else {
        // Remove o item da lista local
        setItems(prevItems => prevItems.filter(item => item.id !== itemId));
      }
    } catch (error) {
      console.error('Erro ao remover item:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao remover o item');
    }
  };

  // Renderizar cada item da lista
  const renderItem = ({ item }: { item: ListItem }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity 
        style={styles.checkBox} 
        onPress={() => handleToggleItem(item)}
      >
        <Ionicons 
          name={item.checked ? 'checkbox' : 'square-outline'} 
          size={24} 
          color={item.checked ? '#4CAF50' : '#666'} 
        />
      </TouchableOpacity>
      
      <View style={styles.itemInfo}>
        <Text 
          style={[styles.itemName, item.checked && styles.itemChecked]}
        >
          {item.product_name}
        </Text>
        <Text style={styles.itemQuantity}>
          {item.quantity} {item.unit}
        </Text>
      </View>
      
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => handleRemoveItem(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color="#ff6b6b" />
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Carregando lista...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {list?.name || 'Detalhes da Lista'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {list?.description ? (
        <Text style={styles.description}>{list.description}</Text>
      ) : null}

      <View style={styles.addItemContainer}>
        <TextInput
          style={styles.addItemInput}
          placeholder="Adicionar item..."
          value={newItemName}
          onChangeText={setNewItemName}
          editable={!addingItem}
        />
        
        <View style={styles.quantityContainer}>
          <TextInput
            style={styles.quantityInput}
            placeholder="Qtd"
            value={newItemQuantity}
            onChangeText={setNewItemQuantity}
            keyboardType="numeric"
            editable={!addingItem}
          />
          
          <TextInput
            style={styles.unitInput}
            placeholder="Un"
            value={newItemUnit}
            onChangeText={setNewItemUnit}
            editable={!addingItem}
          />
        </View>
        
        <TouchableOpacity 
          style={[styles.addButton, addingItem && styles.buttonDisabled]} 
          onPress={handleAddItem}
          disabled={addingItem}
        >
          {addingItem ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="add" size={24} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="basket-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Nenhum item na lista</Text>
          <Text style={styles.emptySubtext}>Adicione itens usando o campo acima</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  addItemContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  addItemInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  quantityContainer: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  quantityInput: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    width: 50,
    fontSize: 16,
    textAlign: 'center',
  },
  unitInput: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    width: 50,
    fontSize: 16,
    textAlign: 'center',
    marginLeft: 8,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  buttonDisabled: {
    backgroundColor: '#a5d6a7',
    opacity: 0.7,
  },
  listContainer: {
    paddingBottom: 20,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  checkBox: {
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemChecked: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 16,
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});