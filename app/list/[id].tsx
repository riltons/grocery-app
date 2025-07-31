import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ListsService } from '../../lib/lists';
import { ProductService } from '../../lib/products';
import AddProductInterface from '../../components/AddProductInterface';
import PriceInputModal from '../../components/PriceInputModal';
import SafeContainer from '../../components/SafeContainer';
import { supabase } from '../../lib/supabase';
import type { SpecificProduct } from '../../lib/supabase';

// Tipos para a lista e seus itens
type List = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  user_id: string;
};

type ListItem = {
  id: string;
  list_id: string;
  product_name: string;
  product_brand?: string;
  product_id?: string;
  generic_product_name?: string;
  category?: string;
  quantity: number;
  unit: string;
  checked: boolean;
  price?: number;
  created_at: string;
};

export default function ListDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [list, setList] = useState<List | null>(null);
  const [items, setItems] = useState<ListItem[]>([]);
  const [pendingItems, setPendingItems] = useState<ListItem[]>([]);
  const [completedItems, setCompletedItems] = useState<ListItem[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [suggestions, setSuggestions] = useState<SpecificProduct[]>([]);
  const [frequentProducts, setFrequentProducts] = useState<SpecificProduct[]>([]);
  const [priceModalVisible, setPriceModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ListItem | null>(null);
  const router = useRouter();

  // Função para buscar detalhes da lista
  const fetchListDetails = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      // Busca detalhes da lista
      const { data: listData, error: listError } = await ListsService.getListById(id);
      
      if (listError) {
        Alert.alert('Erro', 'Não foi possível carregar os detalhes da lista');
        return;
      }
      
      if (listData) {
        setList(listData);
      }
      
      // Busca itens da lista
      const { data: itemsData, error: itemsError } = await ListsService.getListItems(id);
      
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

  // Organizar itens por status e calcular total
  const organizeItems = (allItems: ListItem[]) => {
    const pending = allItems.filter(item => !item.checked);
    const completed = allItems.filter(item => item.checked);
    
    setPendingItems(pending);
    setCompletedItems(completed);
    
    // Calcular total dos itens comprados
    const total = completed.reduce((sum, item) => {
      const itemTotal = (item.price || 0) * item.quantity;
      return sum + itemTotal;
    }, 0);
    
    setTotalValue(total);
  };

  // Carregar detalhes quando o componente montar
  useEffect(() => {
    fetchListDetails();
    loadSuggestions();
    loadFrequentProducts();
  }, [id]);

  // Reorganizar itens quando a lista mudar
  useEffect(() => {
    organizeItems(items);
  }, [items]);

  // Carregar sugestões de produtos
  const loadSuggestions = async () => {
    try {
      const { data } = await ProductService.getSpecificProducts();
      if (data) {
        setSuggestions(data);
      }
    } catch (error) {
      console.error('Erro ao carregar sugestões:', error);
    }
  };

  // Carregar produtos mais usados
  const loadFrequentProducts = async () => {
    try {
      const { data } = await ProductService.getMostUsedProducts(5);
      if (data) {
        setFrequentProducts(data);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos frequentes:', error);
    }
  };

  // Função para atualizar a lista (pull-to-refresh)
  const handleRefresh = () => {
    setRefreshing(true);
    fetchListDetails();
  };

  // Função para verificar se produto já existe na lista
  const checkDuplicateProduct = (productName: string, productId?: string): boolean => {
    return items.some(item => {
      // Se tem product_id, compara por ID
      if (productId && item.product_id) {
        return item.product_id === productId;
      }
      // Senão, compara por nome (case insensitive)
      return item.product_name.toLowerCase() === productName.toLowerCase();
    });
  };

  // Função para aumentar quantidade de produto existente
  const increaseProductQuantity = async (productName: string, additionalQuantity: number) => {
    try {
      setAddingItem(true);
      
      // Encontrar o item existente
      const existingItem = items.find(item => 
        item.product_name.toLowerCase() === productName.toLowerCase()
      );
      
      if (!existingItem) return;
      
      const newQuantity = existingItem.quantity + additionalQuantity;
      
      // Atualizar no banco
      const { error } = await ListsService.updateListItem(id, existingItem.id, {
        ...existingItem,
        quantity: newQuantity
      });
      
      if (error) {
        Alert.alert('Erro', 'Não foi possível atualizar a quantidade');
        return;
      }
      
      // Atualizar localmente
      setItems(prevItems =>
        prevItems.map(item =>
          item.id === existingItem.id
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
      
    } catch (error) {
      console.error('Erro ao aumentar quantidade:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao atualizar a quantidade');
    } finally {
      setAddingItem(false);
    }
  };

  // Função para adicionar um novo item à lista (produto manual)
  const handleAddProduct = async (productName: string, quantity: number, unit: string) => {
    try {
      // Verificar se produto já existe
      if (checkDuplicateProduct(productName)) {
        Alert.alert(
          'Produto já existe',
          `"${productName}" já está na sua lista. Deseja aumentar a quantidade?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { 
              text: 'Aumentar Quantidade', 
              onPress: () => increaseProductQuantity(productName, quantity)
            }
          ]
        );
        return;
      }

      setAddingItem(true);
      const { data, error } = await ListsService.addListItem(id, {
        product_name: productName,
        quantity: quantity,
        unit: unit,
        checked: false,
      });

      if (error) {
        Alert.alert('Erro', 'Não foi possível adicionar o item à lista');
        throw error;
      } else if (data) {
        // Adiciona o novo item à lista local
        setItems(prevItems => [...prevItems, data]);
        // Recarrega produtos frequentes
        loadFrequentProducts();
      }
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      throw error;
    } finally {
      setAddingItem(false);
    }
  };

  // Função para selecionar um produto existente
  const handleSelectProduct = async (product: SpecificProduct, quantity: number, unit: string) => {
    try {
      // Verificar se produto já existe
      if (checkDuplicateProduct(product.name, product.id)) {
        Alert.alert(
          'Produto já existe',
          `"${product.name}" já está na sua lista. Deseja aumentar a quantidade?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { 
              text: 'Aumentar Quantidade', 
              onPress: () => increaseProductQuantity(product.name, quantity)
            }
          ]
        );
        return;
      }

      setAddingItem(true);
      const { data, error } = await ListsService.addListItem(id, {
        product_name: product.name,
        quantity: quantity,
        unit: unit,
        checked: false,
        product_id: product.id, // Passa o ID do produto
      });

      if (error) {
        Alert.alert('Erro', 'Não foi possível adicionar o produto à lista');
        throw error;
      } else if (data) {
        // Adiciona o novo item à lista local
        setItems(prevItems => [...prevItems, data]);
        // Recarrega produtos frequentes
        loadFrequentProducts();
      }
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      throw error;
    } finally {
      setAddingItem(false);
    }
  };

  // Função para criar um novo produto e adicioná-lo à lista
  const handleCreateNewProduct = async (productName: string, quantity: number, unit: string) => {
    try {
      // Verificar se produto já existe
      if (checkDuplicateProduct(productName)) {
        Alert.alert(
          'Produto já existe',
          `"${productName}" já está na sua lista. Deseja aumentar a quantidade?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { 
              text: 'Aumentar Quantidade', 
              onPress: () => increaseProductQuantity(productName, quantity)
            }
          ]
        );
        return;
      }

      setAddingItem(true);
      
      // Primeiro, criar o produto genérico
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        Alert.alert('Erro', 'Usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }

      const { data: genericProduct, error: genericError } = await ProductService.createGenericProduct({
        name: productName,
        category: null,
        user_id: user.user.id,
      });

      if (genericError || !genericProduct) {
        Alert.alert('Erro', 'Não foi possível criar o produto genérico');
        throw genericError;
      }

      // Depois, criar o produto específico
      const { data: specificProduct, error: specificError } = await ProductService.createSpecificProduct({
        generic_product_id: genericProduct.id,
        name: productName,
        brand: '',
        default_unit: unit, // Usa a unidade selecionada pelo usuário
        user_id: user.user.id,
      });

      if (specificError || !specificProduct) {
        Alert.alert('Erro', 'Não foi possível criar o produto específico');
        throw specificError;
      }

      // Finalmente, adicionar à lista
      const { data, error } = await ListsService.addListItem(id, {
        product_name: productName,
        quantity: quantity,
        unit: unit,
        checked: false,
        product_id: specificProduct.id, // Passa o ID do produto criado
      });

      if (error) {
        Alert.alert('Erro', 'Não foi possível adicionar o produto à lista');
        throw error;
      } else if (data) {
        // Adiciona o novo item à lista local
        setItems(prevItems => [...prevItems, data]);
        // Atualiza sugestões e produtos frequentes
        loadSuggestions();
        loadFrequentProducts();
      }
    } catch (error) {
      console.error('Erro ao criar e adicionar produto:', error);
      throw error;
    } finally {
      setAddingItem(false);
    }
  };

  // Função para marcar/desmarcar um item
  const handleToggleItem = async (item: ListItem) => {
    try {
      // Se está marcando como comprado e não tem preço, mostrar modal
      if (!item.checked) {
        setSelectedItem(item);
        setPriceModalVisible(true);
        return;
      }

      // Se está desmarcando, apenas atualizar
      const updatedItem = { ...item, checked: false, price: undefined };
      const { error } = await ListsService.updateListItem(id, item.id, updatedItem);
      
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

  // Função para confirmar item comprado com preço
  const handleConfirmPurchase = async (price: number) => {
    if (!selectedItem) return;

    try {
      const updatedItem = { 
        ...selectedItem, 
        checked: true, 
        price: price > 0 ? price : undefined 
      };
      
      const { error } = await ListsService.updateListItem(id, selectedItem.id, updatedItem);
      
      if (error) {
        Alert.alert('Erro', 'Não foi possível atualizar o item');
        throw error;
      } else {
        // Atualiza o item na lista local
        setItems(prevItems =>
          prevItems.map(i => (i.id === selectedItem.id ? updatedItem : i))
        );
      }
    } catch (error) {
      console.error('Erro ao confirmar compra:', error);
      throw error;
    }
  };

  // Função para remover um item da lista
  const handleRemoveItem = async (itemId: string) => {
    try {
      const { error } = await ListsService.removeListItem(id, itemId);
      
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
    <View style={[styles.itemContainer, item.checked && styles.itemChecked]}>
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
          style={[styles.itemName, item.checked && styles.itemNameChecked]}
        >
          {item.product_name}
        </Text>
        {item.product_brand && (
          <Text style={[styles.itemBrand, item.checked && styles.itemBrandChecked]}>
            {item.product_brand}
          </Text>
        )}
        <View style={styles.itemDetails}>
          <Text style={[styles.itemQuantity, item.checked && styles.itemQuantityChecked]}>
            {item.quantity} {item.unit}
          </Text>
          {item.category && (
            <Text style={[styles.itemCategory, item.checked && styles.itemCategoryChecked]}>
              • {item.category}
            </Text>
          )}
          {item.price && item.checked && (
            <Text style={styles.itemPrice}>
              • {(item.price * item.quantity).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              })}
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.itemActions}>
        {item.product_id && (
          <TouchableOpacity 
            style={styles.productButton}
            onPress={() => router.push(`/product/${item.product_id}`)}
          >
            <Ionicons name="information-circle-outline" size={20} color="#4CAF50" />
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleRemoveItem(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#ff6b6b" />
        </TouchableOpacity>
      </View>
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
    <SafeContainer style={styles.container}>
      <StatusBar style="dark" />
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



      <AddProductInterface
        onAddProduct={handleAddProduct}
        onSelectProduct={handleSelectProduct}
        onCreateNewProduct={handleCreateNewProduct}
        suggestions={suggestions}
        frequentProducts={frequentProducts}
        loading={addingItem}
      />

      <PriceInputModal
        visible={priceModalVisible}
        onClose={() => {
          setPriceModalVisible(false);
          setSelectedItem(null);
        }}
        onConfirm={handleConfirmPurchase}
        productName={selectedItem?.product_name || ''}
        quantity={selectedItem?.quantity || 0}
        unit={selectedItem?.unit || ''}
        loading={addingItem}
      />

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="basket-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Nenhum item na lista</Text>
          <Text style={styles.emptySubtext}>Adicione itens usando o campo acima</Text>
        </View>
      ) : (
        <FlatList
          data={[]}
          renderItem={() => null}
          keyExtractor={() => ''}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListHeaderComponent={
            <View>
              {/* Itens Pendentes */}
              {pendingItems.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    A Comprar ({pendingItems.length})
                  </Text>
                  {pendingItems.map(item => (
                    <View key={item.id}>
                      {renderItem({ item })}
                    </View>
                  ))}
                </View>
              )}

              {/* Itens Comprados */}
              {completedItems.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.completedHeader}>
                    <Text style={styles.sectionTitle}>
                      Comprados ({completedItems.length})
                    </Text>
                    {totalValue > 0 && (
                      <Text style={styles.totalValue}>
                        Total: {totalValue.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        })}
                      </Text>
                    )}
                  </View>
                  {completedItems.map(item => (
                    <View key={item.id}>
                      {renderItem({ item })}
                    </View>
                  ))}
                </View>
              )}
            </View>
          }
        />
      )}


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
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },


  listContainer: {
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  completedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  itemChecked: {
    backgroundColor: '#f0f8f1',
    opacity: 0.8,
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
    marginBottom: 2,
    color: '#333',
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  itemBrand: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  itemBrandChecked: {
    textDecorationLine: 'line-through',
    color: '#aaa',
  },
  itemChecked: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  itemQuantityChecked: {
    textDecorationLine: 'line-through',
    color: '#aaa',
  },
  itemCategory: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  itemCategoryChecked: {
    textDecorationLine: 'line-through',
    color: '#bbb',
  },
  itemPrice: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 8,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productButton: {
    padding: 8,
    marginRight: 4,
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