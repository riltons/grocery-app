import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ListsService } from '../../lib/lists';
import { ProductService, getCategoryNameById } from '../../lib/products';
import AddProductInterface from '../../components/AddProductInterface';
import PriceInputModal from '../../components/PriceInputModal';
import PriceEditModal from '../../components/PriceEditModal';
import ProductSubstitutionModal from '../../components/ProductSubstitutionModal';
import StoreSelectionModal from '../../components/StoreSelectionModal';
import ListFinishModal from '../../components/ListFinishModal';
import ShareListModal from '../../components/ShareListModal';
import QuantitySelector from '../../components/QuantitySelector';
import SafeContainer from '../../components/SafeContainer';
import AnimatedListItem from '../../components/AnimatedListItem';
import { supabase } from '../../lib/supabase';
import type { SpecificProduct, GenericProduct, Store } from '../../lib/supabase';

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
  generic_product_id?: string;
  generic_product_name?: string;
  category?: string;
  quantity: number;
  unit: string;
  checked: boolean;
  price?: number | null;
  created_at: string;
  is_generic?: boolean; // Indica se o item é um produto genérico
};

export default function ListDetail() {
  const params = useLocalSearchParams<{ 
    id: string;
    openGenericSelector?: string;
    newProductId?: string;
    newProductName?: string;
  }>();
  const { id } = params;
  const [list, setList] = useState<List | null>(null);
  const [items, setItems] = useState<ListItem[]>([]);
  const [pendingItems, setPendingItems] = useState<ListItem[]>([]);
  const [completedItems, setCompletedItems] = useState<ListItem[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [suggestions, setSuggestions] = useState<SpecificProduct[]>([]);
  const [priceModalVisible, setPriceModalVisible] = useState(false);
  const [priceEditModalVisible, setPriceEditModalVisible] = useState(false);
  const [substitutionModalVisible, setSubstitutionModalVisible] = useState(false);
  const [storeSelectionModalVisible, setStoreSelectionModalVisible] = useState(false);
  const [finishModalVisible, setFinishModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ListItem | null>(null);
  const [selectedGenericProduct, setSelectedGenericProduct] = useState<GenericProduct | null>(null);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [newlyAddedItems, setNewlyAddedItems] = useState<Set<string>>(new Set());
  const [scrollQueue, setScrollQueue] = useState<string[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  // Verificar se a lista está finalizada
  const isListFinished = list?.status === 'finished';

  // Funções para persistir a loja selecionada
  const saveSelectedStore = async (store: Store | null) => {
    try {
      const key = `selectedStore_${id}`;
      console.log('🏪 SALVANDO LOJA:', { key, store: store?.name });
      if (store) {
        await AsyncStorage.setItem(key, JSON.stringify(store));
        console.log('✅ Loja salva com sucesso');
      } else {
        await AsyncStorage.removeItem(key);
        console.log('🗑️ Loja removida com sucesso');
      }
    } catch (error) {
      console.error('❌ Erro ao salvar loja selecionada:', error);
    }
  };

  const loadSelectedStore = async () => {
    try {
      const key = `selectedStore_${id}`;
      console.log('🔍 CARREGANDO LOJA:', { key });
      const storedStore = await AsyncStorage.getItem(key);
      console.log('📦 Dados encontrados:', storedStore);
      if (storedStore) {
        const store = JSON.parse(storedStore) as Store;
        console.log('🏪 Loja carregada:', store.name);
        setSelectedStore(store);
      } else {
        console.log('❌ Nenhuma loja encontrada');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar loja selecionada:', error);
    }
  };

  // Função para navegar para um item específico na lista
  const scrollToItem = (itemId: string) => {
    if (!flatListRef.current) return;
    
    // Como estamos usando ListHeaderComponent com renderização manual,
    // vamos navegar para o topo onde ficam os itens pendentes
    flatListRef.current.scrollToOffset({ offset: 0, animated: true });
  };

  // Função para processar a fila de navegação sequencial
  const processScrollQueue = () => {
    if (scrollQueue.length > 0) {
      const nextItemId = scrollQueue[0];
      scrollToItem(nextItemId);
      
      // Remove o item da fila após 1.5 segundos e processa o próximo
      setTimeout(() => {
        setScrollQueue(prev => prev.slice(1));
      }, 1500);
    }
  };

  // Effect para processar a fila de navegação
  useEffect(() => {
    if (scrollQueue.length > 0) {
      processScrollQueue();
    }
  }, [scrollQueue]);

  // Função para adicionar item à fila de navegação
  const addToScrollQueue = (itemId: string) => {
    setScrollQueue(prev => [...prev, itemId]);
  };

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

  // Função para ordenar itens por categoria
  const sortItemsByCategory = (items: ListItem[]) => {
    return items.sort((a, b) => {
      // Primeiro, ordena por categoria (alfabeticamente)
      const categoryA = a.category || 'Sem categoria';
      const categoryB = b.category || 'Sem categoria';
      
      if (categoryA !== categoryB) {
        return categoryA.localeCompare(categoryB, 'pt-BR');
      }
      
      // Se as categorias são iguais, ordena por nome do produto
      return a.product_name.localeCompare(b.product_name, 'pt-BR');
    });
  };

  // Função para agrupar itens por categoria
  const groupItemsByCategory = (items: ListItem[]) => {
    const groups: { [key: string]: ListItem[] } = {};
    
    items.forEach(item => {
      const category = item.category || 'Sem categoria';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
    });
    
    // Retorna as categorias ordenadas alfabeticamente
    return Object.keys(groups)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
      .map(category => ({
        category,
        items: groups[category].sort((a, b) => 
          a.product_name.localeCompare(b.product_name, 'pt-BR')
        )
      }));
  };

  // Organizar itens por status e calcular total
  const organizeItems = (allItems: ListItem[]) => {
    // Primeiro ordena todos os itens por categoria
    const sortedItems = sortItemsByCategory([...allItems]);
    
    // Depois separa por status, mantendo a ordenação
    const pending = sortedItems.filter(item => !item.checked);
    const completed = sortedItems.filter(item => item.checked);
    
    console.log('📋 LISTA - Organizando itens:');
    console.log('  Total de itens:', allItems.length);
    console.log('  Itens pendentes:', pending.length);
    console.log('  Itens completos:', completed.length);
    console.log('  IDs dos produtos:', allItems.filter(item => item.product_id).map(item => item.product_id));
    console.log('  Nomes dos produtos:', allItems.map(item => item.product_name));
    
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
    console.log('🚀 COMPONENTE MONTADO - Lista ID:', id);
    fetchListDetails();
    loadSuggestions();
    loadSelectedStore();
  }, [id]);

  // Reorganizar itens quando a lista mudar
  useEffect(() => {
    organizeItems(items);
  }, [items]);

  // Monitorar mudanças na loja selecionada
  useEffect(() => {
    console.log('🏪 ESTADO DA LOJA MUDOU:', selectedStore?.name || 'null');
  }, [selectedStore]);

  // Detectar se deve abrir o GenericProductSelector automaticamente após criar produto
  useEffect(() => {
    if (params.openGenericSelector === 'true' && params.newProductId && params.newProductName) {
      console.log('🎯 ABRINDO MODAL AUTOMATICAMENTE PARA PRODUTO CRIADO:', params.newProductName);
      
      // Pequeno delay para garantir que a página carregou completamente
      setTimeout(async () => {
        try {
          // Buscar o produto genérico criado
          const { data: genericProduct, error } = await ProductService.getGenericProductById(params.newProductId!);
          
          if (error || !genericProduct) {
            console.error('Erro ao buscar produto genérico criado:', error);
            return;
          }
          
          // Adicionar automaticamente o produto à lista
          await handleSelectGenericProduct(genericProduct, 1, 'un');
          
          // Limpar os parâmetros da URL
          router.replace(`/list/${id}`);
        } catch (error) {
          console.error('Erro ao adicionar produto automaticamente:', error);
        }
      }, 500);
    }
  }, [params.openGenericSelector, params.newProductId, params.newProductName]);

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
    if (isListFinished) {
      Alert.alert('Lista Finalizada', 'Esta lista foi finalizada e não pode mais ser editada.');
      return;
    }

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
        // Marca o item como recém-adicionado para animação
        setNewlyAddedItems(prev => new Set(prev).add(data.id));
        // Adiciona à fila de navegação
        addToScrollQueue(data.id);
        // Remove a marcação após 2 segundos
        setTimeout(() => {
          setNewlyAddedItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.id);
            return newSet;
          });
        }, 2000);
      }
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      throw error;
    } finally {
      setAddingItem(false);
    }
  };

  // Função para selecionar um produto genérico
  const handleSelectGenericProduct = async (product: GenericProduct, quantity: number, unit: string) => {
    try {
      // Verificar se produto já existe
      if (checkDuplicateProduct(product.name)) {
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
        generic_product_id: product.id, // Passa o ID do produto genérico
      });

      if (error) {
        Alert.alert('Erro', 'Não foi possível adicionar o produto genérico à lista');
        throw error;
      } else if (data) {
        // Adiciona o novo item à lista local com informações genéricas
        const genericItem = {
          ...data,
          product_name: product.name,
          generic_product_id: product.id,
          generic_product_name: product.name,
          category: product.category,
          is_generic: true,
        };
        setItems(prevItems => [...prevItems, genericItem]);
        
        // Marca o item como recém-adicionado para animação
        setNewlyAddedItems(prev => new Set(prev).add(data.id));
        // Adiciona à fila de navegação
        addToScrollQueue(data.id);
        // Remove a marcação após 2 segundos
        setTimeout(() => {
          setNewlyAddedItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.id);
            return newSet;
          });
        }, 2000);
      }
    } catch (error) {
      console.error('Erro ao adicionar produto genérico:', error);
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
        
        // Marca o item como recém-adicionado para animação
        setNewlyAddedItems(prev => new Set(prev).add(data.id));
        // Adiciona à fila de navegação
        addToScrollQueue(data.id);
        // Remove a marcação após 2 segundos
        setTimeout(() => {
          setNewlyAddedItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.id);
            return newSet;
          });
        }, 2000);
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

      const { data: genericProduct, error: genericError } = await ProductService.getOrCreateDefaultGenericProduct();

      if (genericError || !genericProduct) {
        Alert.alert('Erro', 'Não foi possível obter o produto genérico padrão');
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
        
        // Marca o item como recém-adicionado para animação
        setNewlyAddedItems(prev => new Set(prev).add(data.id));
        // Adiciona à fila de navegação
        addToScrollQueue(data.id);
        // Remove a marcação após 2 segundos
        setTimeout(() => {
          setNewlyAddedItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.id);
            return newSet;
          });
        }, 2000);
        
        // Atualiza sugestões
        loadSuggestions();
      }
    } catch (error) {
      console.error('Erro ao criar e adicionar produto:', error);
      throw error;
    } finally {
      setAddingItem(false);
    }
  };

  // Função para criar um novo produto genérico com categoria e adicioná-lo à lista
  const handleCreateNewProductWithCategory = async (productName: string, categoryId: string | null, quantity: number, unit: string) => {
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
      
      // Criar apenas o produto genérico
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        Alert.alert('Erro', 'Usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }

      const { data: genericProduct, error: genericError } = await ProductService.createGenericProduct({
        name: productName,
        category_id: categoryId, // Usa a categoria selecionada pelo usuário
        user_id: user.user.id,
      });

      if (genericError || !genericProduct) {
        Alert.alert('Erro', 'Não foi possível criar o produto genérico');
        throw genericError;
      }

      // Adicionar o produto genérico diretamente à lista
      const { data, error } = await ListsService.addListItem(id, {
        product_name: productName,
        quantity: quantity,
        unit: unit,
        checked: false,
        generic_product_id: genericProduct.id, // Passa o ID do produto genérico
      });

      if (error) {
        Alert.alert('Erro', 'Não foi possível adicionar o produto à lista');
        throw error;
      } else if (data) {
        // Adiciona o novo item à lista local com informações genéricas
        const genericItem = {
          ...data,
          product_name: productName,
          generic_product_id: genericProduct.id,
          generic_product_name: productName,
          category: genericProduct.category,
          is_generic: true,
        };
        setItems(prevItems => [...prevItems, genericItem]);
        
        // Marca o item como recém-adicionado para animação
        setNewlyAddedItems(prev => new Set(prev).add(data.id));
        // Adiciona à fila de navegação
        addToScrollQueue(data.id);
        // Remove a marcação após 2 segundos
        setTimeout(() => {
          setNewlyAddedItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.id);
            return newSet;
          });
        }, 2000);
        
        // Atualiza sugestões
        loadSuggestions();
      }
    } catch (error) {
      console.error('Erro ao criar e adicionar produto genérico com categoria:', error);
      throw error;
    } finally {
      setAddingItem(false);
    }
  };

  // Função para marcar/desmarcar um item
  const handleToggleItem = async (item: ListItem) => {
    if (isListFinished) {
      Alert.alert('Lista Finalizada', 'Esta lista foi finalizada e não pode mais ser editada.');
      return;
    }

    try {
      // Se está marcando como comprado
      if (!item.checked) {
        // Verificar se é o primeiro produto sendo marcado como comprado
        const hasCompletedItems = completedItems.length > 0;
        
        if (!hasCompletedItems && !selectedStore) {
          // É o primeiro produto e não há loja selecionada - mostrar modal de seleção de loja
          setSelectedItem(item);
          setStoreSelectionModalVisible(true);
          return;
        }
        
        // Já há loja selecionada ou já há itens comprados - mostrar modal de preço
        setSelectedItem(item);
        setPriceModalVisible(true);
        return;
      }

      // Se está desmarcando, apenas atualizar
      const updates = { checked: false, price: null };
      const { error } = await ListsService.updateListItem(id, item.id, updates);
      
      if (error) {
        Alert.alert('Erro', 'Não foi possível atualizar o item');
      } else {
        // Atualiza o item na lista local
        setItems(prevItems =>
          prevItems.map(i => (i.id === item.id ? { ...i, ...updates } : i))
        );
      }
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao atualizar o item');
    }
  };

  // Função para lidar com a seleção de loja
  const handleStoreSelection = (store: Store) => {
    console.log('🎯 SELECIONANDO LOJA:', store.name);
    setSelectedStore(store);
    saveSelectedStore(store); // Salvar a loja selecionada
    setStoreSelectionModalVisible(false);
    
    // Após selecionar a loja, mostrar o modal de preço
    if (selectedItem) {
      setPriceModalVisible(true);
    }
  };

  // Função para limpar a loja selecionada
  const clearSelectedStore = () => {
    setSelectedStore(null);
    saveSelectedStore(null);
  };

  // Função para finalizar lista
  const handleFinishList = async (createNewListWithPending: boolean) => {
    try {
      setAddingItem(true);
      
      const { data, error } = await ListsService.finishList(id, createNewListWithPending);
      
      if (error) {
        Alert.alert('Erro', 'Não foi possível finalizar a lista');
        return;
      }

      if (data?.newListWithPending) {
        Alert.alert(
          'Lista Finalizada!',
          `Lista finalizada com sucesso!\n\nUma nova lista "${data.newListWithPending.name}" foi criada com os itens pendentes.`,
          [
            { text: 'Ver Nova Lista', onPress: () => router.replace(`/list/${data.newListWithPending!.id}`) },
            { text: 'Voltar ao Início', onPress: () => router.replace('/') }
          ]
        );
      } else {
        Alert.alert(
          'Lista Finalizada!',
          'Lista finalizada com sucesso!',
          [
            { text: 'OK', onPress: () => router.replace('/') }
          ]
        );
      }
    } catch (error) {
      console.error('Erro ao finalizar lista:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao finalizar a lista');
    } finally {
      setAddingItem(false);
    }
  };

  // Função para clonar lista
  const handleCloneList = async () => {
    try {
      setAddingItem(true);
      
      const { data: clonedList, error } = await ListsService.cloneList(id);
      
      if (error || !clonedList) {
        Alert.alert('Erro', 'Não foi possível clonar a lista');
        return;
      }

      Alert.alert(
        'Lista Clonada!',
        `A lista "${clonedList.name}" foi criada com todos os produtos desmarcados.`,
        [
          { text: 'Ver Lista Clonada', onPress: () => router.push(`/list/${clonedList.id}`) },
          { text: 'Continuar Aqui', style: 'cancel' }
        ]
      );
    } catch (error) {
      console.error('Erro ao clonar lista:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao clonar a lista');
    } finally {
      setAddingItem(false);
    }
  };

  // Função para confirmar item comprado com preço e quantidade
  const handleConfirmPurchase = async (price: number, quantity: number) => {
    if (!selectedItem) return;

    try {
      let finalPrice = price;
      
      // Se não informou preço (price = 0), tentar buscar o último preço registrado
      if (price === 0 && selectedItem.product_id) {
        const { data: lastPrice } = await ProductService.getLastProductPrice(selectedItem.product_id);
        if (lastPrice && lastPrice.price) {
          finalPrice = lastPrice.price;
        }
      }
      
      const updates = {
        checked: true,
        price: finalPrice > 0 ? finalPrice : null,
        quantity: quantity
      };
      
      const { error } = await ListsService.updateListItem(id, selectedItem.id, updates);
      
      if (error) {
        Alert.alert('Erro', 'Não foi possível atualizar o item');
        throw error;
      } else {
        // Se há preço e produto específico e loja selecionada, salvar no histórico
        if (finalPrice > 0 && selectedItem.product_id && selectedStore) {
          await ProductService.addProductPrice(selectedItem.product_id, {
            store_id: selectedStore.id,
            price: finalPrice,
            date: new Date().toISOString(),
          });
        }
        
        // Atualiza o item na lista local
        setItems(prevItems =>
          prevItems.map(i => (i.id === selectedItem.id ? { ...i, ...updates } : i))
        );
      }
    } catch (error) {
      console.error('Erro ao confirmar compra:', error);
      throw error;
    }
  };

  // Função para editar preço de item comprado
  const handleEditPrice = (item: ListItem) => {
    setSelectedItem(item);
    setPriceEditModalVisible(true);
  };

  // Função para abrir modal de substituição de produto
  const handleSubstituteProduct = async (item: ListItem) => {
    if (!item.generic_product_id) {
      Alert.alert('Erro', 'Este item não possui um produto genérico associado');
      return;
    }

    try {
      // Buscar o produto genérico
      const { data: genericProduct, error } = await ProductService.getGenericProductById(item.generic_product_id);
      
      if (error || !genericProduct) {
        Alert.alert('Erro', 'Não foi possível carregar o produto genérico');
        return;
      }

      setSelectedItem(item);
      setSelectedGenericProduct(genericProduct);
      setSubstitutionModalVisible(true);
    } catch (error) {
      console.error('Erro ao buscar produto genérico:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao carregar o produto genérico');
    }
  };

  // Função para confirmar substituição de produto
  const handleConfirmSubstitution = async (specificProduct: SpecificProduct) => {
    if (!selectedItem) return;

    try {
      setAddingItem(true);

      // Primeiro, remover a relação atual (se existir)
      if (selectedItem.product_id) {
        const { error: deleteError } = await supabase
          .from('list_item_products')
          .delete()
          .eq('list_item_id', selectedItem.id);

        if (deleteError) {
          console.error('Erro ao remover relação anterior:', deleteError);
        }
      }

      // Criar nova relação com o produto específico
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Erro', 'Usuário não autenticado');
        return;
      }

      const { error: insertError } = await supabase
        .from('list_item_products')
        .insert([
          {
            list_item_id: selectedItem.id,
            specific_product_id: specificProduct.id,
            user_id: user.id,
          }
        ]);

      if (insertError) {
        Alert.alert('Erro', 'Não foi possível substituir o produto');
        throw insertError;
      }

      // Atualizar o item na lista local
      setItems(prevItems =>
        prevItems.map(item =>
          item.id === selectedItem.id
            ? {
                ...item,
                product_name: specificProduct.name,
                product_brand: specificProduct.brand || '',
                product_id: specificProduct.id,
                is_generic: false,
              }
            : item
        )
      );

      // Fechar modal
      setSubstitutionModalVisible(false);
      setSelectedItem(null);
      setSelectedGenericProduct(null);

      Alert.alert('Sucesso', `Produto substituído por "${specificProduct.name}"`);
    } catch (error) {
      console.error('Erro ao substituir produto:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao substituir o produto');
    } finally {
      setAddingItem(false);
    }
  };

  // Função para aumentar quantidade de um item
  const handleIncreaseQuantity = async (item: ListItem) => {
    try {
      const newQuantity = item.quantity + 1;
      
      const { error } = await ListsService.updateListItem(id, item.id, {
        quantity: newQuantity
      });
      
      if (error) {
        Alert.alert('Erro', 'Não foi possível atualizar a quantidade');
        return;
      }
      
      // Atualizar localmente
      setItems(prevItems =>
        prevItems.map(i =>
          i.id === item.id ? { ...i, quantity: newQuantity } : i
        )
      );
    } catch (error) {
      console.error('Erro ao aumentar quantidade:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao atualizar a quantidade');
    }
  };

  // Função para diminuir quantidade de um item
  const handleDecreaseQuantity = async (item: ListItem) => {
    try {
      const newQuantity = Math.max(1, item.quantity - 1);
      
      const { error } = await ListsService.updateListItem(id, item.id, {
        quantity: newQuantity
      });
      
      if (error) {
        Alert.alert('Erro', 'Não foi possível atualizar a quantidade');
        return;
      }
      
      // Atualizar localmente
      setItems(prevItems =>
        prevItems.map(i =>
          i.id === item.id ? { ...i, quantity: newQuantity } : i
        )
      );
    } catch (error) {
      console.error('Erro ao diminuir quantidade:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao atualizar a quantidade');
    }
  };

  // Função para confirmar edição de preço e quantidade
  const handleConfirmPriceEdit = async (price: number | null, quantity: number) => {
    if (!selectedItem) return;

    try {
      const updates = { price, quantity };
      
      const { error } = await ListsService.updateListItem(id, selectedItem.id, updates);
      
      if (error) {
        Alert.alert('Erro', 'Não foi possível atualizar o item');
        throw error;
      } else {
        // Se há preço e produto específico e loja selecionada, salvar no histórico
        if (price && price > 0 && selectedItem.product_id && selectedStore) {
          await ProductService.addProductPrice(selectedItem.product_id, {
            store_id: selectedStore.id,
            price: price,
            date: new Date().toISOString(),
          });
        }
        
        // Atualiza o item na lista local
        setItems(prevItems =>
          prevItems.map(i => (i.id === selectedItem.id ? { ...i, ...updates } : i))
        );
      }
    } catch (error) {
      console.error('Erro ao editar item:', error);
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
    <AnimatedListItem 
      isNew={newlyAddedItems.has(item.id)}
      onAnimationComplete={() => {
        setNewlyAddedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(item.id);
          return newSet;
        });
      }}
    >
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
        <View style={styles.itemNameContainer}>
          <Text 
            style={[styles.itemName, item.checked && styles.itemNameChecked]}
          >
            {item.product_name}
          </Text>
          {item.is_generic && (
            <View style={styles.genericBadge}>
              <Text style={styles.genericBadgeText}>Genérico</Text>
            </View>
          )}
        </View>
        {item.product_brand && (
          <Text style={[styles.itemBrand, item.checked && styles.itemBrandChecked]}>
            {item.product_brand}
          </Text>
        )}
        <View style={styles.itemDetails}>
          <View style={styles.quantityContainer}>
            {item.checked ? (
              <TouchableOpacity 
                style={styles.editableQuantity}
                onPress={() => handleEditPrice(item)}
              >
                <Text style={styles.quantityText}>{item.quantity}</Text>
                <Text style={styles.unitText}>{item.unit}</Text>
                <Ionicons name="pencil" size={14} color="#4CAF50" />
              </TouchableOpacity>
            ) : (
              <>
                <QuantitySelector
                  quantity={item.quantity}
                  onIncrease={() => handleIncreaseQuantity(item)}
                  onDecrease={() => handleDecreaseQuantity(item)}
                  disabled={false}
                />
                <Text style={styles.unitText}>
                  {item.unit}
                </Text>
              </>
            )}
          </View>
          {(item.category || getCategoryNameById(item.category_id)) && (
            <Text style={[styles.itemCategory, item.checked && styles.itemCategoryChecked]}>
              <Text>• {String(item.category || getCategoryNameById(item.category_id) || '')}</Text>
            </Text>
          )}
          {item.checked && (
            <TouchableOpacity 
              style={styles.priceContainer}
              onPress={() => handleEditPrice(item)}
            >
              <Text style={styles.itemPrice}>
                • {item.price ? (item.price * item.quantity).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }) : 'Sem preço'}
              </Text>
              <Ionicons name="pencil" size={12} color="#4CAF50" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <View style={styles.itemActions}>
        {item.is_generic && item.generic_product_id && (
          <TouchableOpacity 
            style={styles.substituteButton}
            onPress={() => handleSubstituteProduct(item)}
          >
            <Ionicons name="swap-horizontal" size={20} color="#FF9800" />
          </TouchableOpacity>
        )}
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
    </AnimatedListItem>
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
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {list?.name || 'Detalhes da Lista'}
          </Text>
          {isListFinished && (
            <View style={styles.finishedIndicator}>
              <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
              <Text style={styles.finishedIndicatorText}>Finalizada</Text>
            </View>
          )}
          {selectedStore && !isListFinished && (
            <TouchableOpacity 
              style={styles.storeIndicator}
              onPress={() => setStoreSelectionModalVisible(true)}
            >
              <Ionicons name="storefront" size={14} color="#4CAF50" />
              <Text style={styles.storeIndicatorText} numberOfLines={1}>
                {selectedStore.name}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.shareButton}
            onPress={() => setShareModalVisible(true)}
            disabled={addingItem}
          >
            <Ionicons name="share-outline" size={20} color="#4CAF50" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.finishButton}
            onPress={() => setFinishModalVisible(true)}
            disabled={addingItem}
          >
            <Ionicons name="checkmark-done" size={20} color="#4CAF50" />
          </TouchableOpacity>
        </View>
      </View>



      {!isListFinished && (
        <AddProductInterface
          onAddProduct={handleAddProduct}
          onSelectProduct={handleSelectProduct}
          onSelectGenericProduct={handleSelectGenericProduct}
          onCreateNewProduct={handleCreateNewProduct}
          onCreateNewProductWithCategory={handleCreateNewProductWithCategory}
          suggestions={suggestions}
          loading={addingItem}
          currentListProductIds={items.filter(item => item.product_id).map(item => item.product_id!)}
          currentListProductNames={items.map(item => item.product_name)}
          listId={id}
        />
      )}

      {isListFinished && (
        <View style={styles.finishedMessage}>
          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          <Text style={styles.finishedMessageText}>Esta lista foi finalizada</Text>
          <Text style={styles.finishedMessageSubtext}>Não é possível fazer mais alterações</Text>
        </View>
      )}

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
        storeName={selectedStore?.name || ''}
      />

      <PriceEditModal
        visible={priceEditModalVisible}
        onClose={() => {
          setPriceEditModalVisible(false);
          setSelectedItem(null);
        }}
        onConfirm={handleConfirmPriceEdit}
        productName={selectedItem?.product_name || ''}
        currentPrice={selectedItem?.price || undefined}
        quantity={selectedItem?.quantity || 0}
        unit={selectedItem?.unit || ''}
        loading={addingItem}
      />

      <ProductSubstitutionModal
        visible={substitutionModalVisible}
        onClose={() => {
          setSubstitutionModalVisible(false);
          setSelectedItem(null);
          setSelectedGenericProduct(null);
        }}
        onSubstitute={handleConfirmSubstitution}
        genericProduct={selectedGenericProduct}
        currentProductName={selectedItem?.product_name || ''}
      />

      <StoreSelectionModal
        visible={storeSelectionModalVisible}
        onClose={() => {
          setStoreSelectionModalVisible(false);
          setSelectedItem(null);
        }}
        onSelectStore={handleStoreSelection}
        onClearStore={clearSelectedStore}
        title="Onde você está comprando?"
        hasSelectedStore={!!selectedStore}
      />

      <ListFinishModal
        visible={finishModalVisible}
        onClose={() => setFinishModalVisible(false)}
        onFinish={handleFinishList}
        listName={list?.name || 'Lista'}
        pendingItemsCount={pendingItems.length}
        completedItemsCount={completedItems.length}
        loading={addingItem}
      />

      <ShareListModal
        visible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        list={list}
        onSuccess={() => {
          // Opcional: recarregar dados da lista se necessário
        }}
      />



      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="basket-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Nenhum item na lista</Text>
          <Text style={styles.emptySubtext}>Adicione itens usando o campo acima</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
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
                  {groupItemsByCategory(pendingItems).map(group => (
                    <View key={group.category} style={styles.categoryGroup}>
                      <Text style={styles.categoryTitle}>{group.category}</Text>
                      {group.items.map(item => (
                        <View key={item.id}>
                          {renderItem({ item })}
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              )}

              {/* Itens Comprados */}
              {completedItems.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.completedHeader}>
                    <View style={styles.completedTitleContainer}>
                      <Text style={styles.sectionTitle}>
                        Comprados ({completedItems.length})
                      </Text>
                      <TouchableOpacity
                        style={styles.cloneButton}
                        onPress={handleCloneList}
                        disabled={addingItem}
                      >
                        <Ionicons name="copy" size={16} color="#4CAF50" />
                        <Text style={styles.cloneButtonText}>Clonar Lista</Text>
                      </TouchableOpacity>
                    </View>
                    {totalValue > 0 && (
                      <Text style={styles.totalValue}>
                        Total: {totalValue.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        })}
                      </Text>
                    )}
                  </View>
                  {groupItemsByCategory(completedItems).map(group => (
                    <View key={group.category} style={styles.categoryGroup}>
                      <Text style={styles.categoryTitle}>{group.category}</Text>
                      {group.items.map(item => (
                        <View key={item.id}>
                          {renderItem({ item })}
                        </View>
                      ))}
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
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  storeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8f1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    maxWidth: 200,
  },
  storeIndicatorText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 4,
  },
  finishedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8f1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  finishedIndicatorText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 4,
  },
  finishedMessage: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  finishedMessageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginTop: 8,
    marginBottom: 4,
  },
  finishedMessageSubtext: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shareButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f8f1',
  },
  finishButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f8f1',
  },


  listContainer: {
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  categoryGroup: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  completedTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cloneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8f1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  cloneButtonText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
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
  itemNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  genericBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  genericBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
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
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  editableQuantity: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8f1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 4,
  },
  unitText: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
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
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8f1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  itemPrice: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginRight: 4,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  substituteButton: {
    padding: 8,
    marginRight: 4,
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