import { supabase } from './supabase';
import { getCategoryNameById } from './products';
import type { List } from './supabase';

/**
 * Serviço para gerenciar listas de compras
 */
export const ListsService = {
  /**
   * Busca todas as listas do usuário atual
   */
  getUserLists: async () => {
    try {
      // Busca o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('lists')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao buscar listas:', error);
      return { data: null, error };
    }
  },

  /**
   * Cria uma nova lista de compras
   */
  createList: async (name: string) => {
    try {
      // Busca o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('lists')
        .insert([
          {
            name,
            user_id: user.id,
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao criar lista:', error);
      return { data: null, error };
    }
  },

  /**
   * Atualiza uma lista existente
   */
  updateList: async (id: string, name: string) => {
    try {
      // Busca o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('lists')
        .update({
          name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao atualizar lista:', error);
      return { data: null, error };
    }
  },

  /**
   * Deleta uma lista
   */
  deleteList: async (id: string) => {
    try {
      // Busca o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await supabase
        .from('lists')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Erro ao deletar lista:', error);
      return { error };
    }
  },

  /**
   * Busca uma lista específica por ID
   */
  getListById: async (id: string) => {
    try {
      // Busca o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar lista (própria ou compartilhada)
      const { data, error } = await supabase
        .from('lists')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Verificar se o usuário tem acesso à lista (é proprietário ou tem compartilhamento)
      if (data.user_id !== user.id) {
        // Verificar se a lista foi compartilhada com o usuário
        const { data: shareData, error: shareError } = await supabase
          .from('list_shares')
          .select('id')
          .eq('list_id', id)
          .eq('user_id', user.id)
          .single();

        if (shareError || !shareData) {
          throw new Error('Você não tem acesso a esta lista');
        }
      }

      return { data, error: null };
    } catch (error) {
      console.error('Erro ao buscar lista:', error);
      return { data: null, error };
    }
  },

  /**
   * Busca todos os itens de uma lista
   */
  getListItems: async (listId: string) => {
    try {
      // Busca o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Primeiro verificar se o usuário tem acesso à lista
      const { data: listAccess } = await ListsService.getListById(listId);
      if (!listAccess) {
        throw new Error('Você não tem acesso a esta lista');
      }

      // Busca itens com produtos associados e produtos genéricos
      // Remove o filtro por user_id para permitir ver itens de listas compartilhadas
      const { data: itemsWithProducts, error: error1 } = await supabase
        .from('list_items')
        .select(`
          *,
          list_item_products (
            specific_products (
              id,
              name,
              brand,
              generic_product_id,
              generic_products (
                id,
                name,
                categories (
                  id,
                  name
                )
              )
            )
          ),
          generic_products (
            id,
            name,
            categories (
              id,
              name
            )
          )
        `)
        .eq('list_id', listId)
        .order('created_at', { ascending: false });

      if (error1) throw error1;

      // Processar os dados para incluir informações do produto
      const processedData = itemsWithProducts?.map((item) => {
        const productInfo = item.list_item_products?.[0]?.specific_products;
        const genericInfo = item.generic_products;
        const hasSpecificProduct = !!productInfo;
        const hasGenericProduct = !!genericInfo || !!item.generic_product_id;
        
        // Se tem produto específico, usar suas informações
        if (hasSpecificProduct) {
          return {
            ...item,
            product_name: productInfo.name,
            product_brand: productInfo.brand || '',
            product_id: productInfo.id,
            generic_product_id: productInfo.generic_product_id,
            generic_product_name: productInfo.generic_products?.name || '',
            category: productInfo.generic_products?.categories?.name || "",
            is_generic: false,
          };
        }
        
        // Se tem produto genérico (direto ou por referência)
        if (hasGenericProduct) {
          const genericProduct = genericInfo || { name: item.product_name, categories: null };
          return {
            ...item,
            product_name: item.product_name || genericProduct.name,
            product_brand: '',
            product_id: null,
            generic_product_id: item.generic_product_id || genericInfo?.id,
            generic_product_name: genericProduct.name,
            category: genericProduct.categories?.name || "",
            is_generic: true,
          };
        }
        
        // Fallback: item sem produto associado (produto manual)
        return {
          ...item,
          product_name: item.product_name || 'Produto desconhecido',
          product_brand: '',
          product_id: null,
          generic_product_id: null,
          generic_product_name: '',
          category: '',
          is_generic: false,
        };
      }) || [];

      return { data: processedData, error: null };
    } catch (error) {
      console.error('Erro ao buscar itens da lista:', error);
      return { data: null, error };
    }
  },

  /**
   * Busca um produto específico por nome
   */
  findProductByName: async (productName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('specific_products')
        .select('*')
        .eq('user_id', user.id)
        .ilike('name', `%${productName}%`)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Adiciona um item à lista
   */
  addListItem: async (listId: string, item: {
    product_name: string;
    quantity: number;
    unit: string;
    checked: boolean;
    product_id?: string;
    generic_product_id?: string;
  }) => {
    try {
      // Busca o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      let productId = item.product_id;

      // Se não foi fornecido um product_id, tenta encontrar um produto existente pelo nome
      if (!productId) {
        const { data: existingProduct } = await ListsService.findProductByName(item.product_name);
        if (existingProduct) {
          productId = existingProduct.id;
        }
      }

      // Primeiro, cria o item da lista
      const listItemInsert: any = {
        list_id: listId,
        quantity: item.quantity,
        unit: item.unit,
        checked: item.checked,
        user_id: user.id,
        product_name: item.product_name, // Armazenar o nome do produto diretamente
      };

      // Se tem product_id, adicionar ao insert
      if (productId) {
        listItemInsert.product_id = productId;
      }

      // Se tem generic_product_id, adicionar ao insert (assumindo que a coluna existe)
      if (item.generic_product_id) {
        listItemInsert.generic_product_id = item.generic_product_id;
      }

      const { data: listItemData, error: listItemError } = await supabase
        .from('list_items')
        .insert([listItemInsert])
        .select()
        .single();

      if (listItemError) throw listItemError;

      // Se um product_id foi encontrado ou fornecido, cria a relação na tabela list_item_products
      if (productId && listItemData) {
        const { error: relationError } = await supabase
          .from('list_item_products')
          .insert([
            {
              list_item_id: listItemData.id,
              specific_product_id: productId,
              user_id: user.id,
            }
          ]);

        if (relationError) {
          console.error('Erro ao criar relação produto-item:', relationError);
          // Não falha a operação, apenas loga o erro
        }
      }

      // Buscar informações completas do item recém-criado para incluir categoria
      let categoryInfo = '';
      let categoryId = null;
      
      if (productId) {
        // Se tem produto específico, buscar categoria através do produto genérico
        const { data: specificProduct } = await supabase
          .from('specific_products')
          .select(`
            generic_product_id,
            generic_products (
              categories (
                id,
                name
              )
            )
          `)
          .eq('id', productId)
          .single();
          
        if (specificProduct?.generic_products?.categories) {
          categoryInfo = specificProduct.generic_products.categories.name;
          categoryId = specificProduct.generic_products.categories.id;
        }
      } else if (item.generic_product_id) {
        // Se tem produto genérico, buscar categoria diretamente
        const { data: genericProduct } = await supabase
          .from('generic_products')
          .select(`
            categories (
              id,
              name
            )
          `)
          .eq('id', item.generic_product_id)
          .single();
          
        if (genericProduct?.categories) {
          categoryInfo = genericProduct.categories.name;
          categoryId = genericProduct.categories.id;
        }
      }

      return { 
        data: { 
          ...listItemData, 
          product_name: item.product_name,
          product_id: productId || null,
          generic_product_id: item.generic_product_id || null,
          is_generic: !!item.generic_product_id && !productId,
          category: categoryInfo || '',
          category_id: categoryId,
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      return { data: null, error };
    }
  },

  /**
   * Valida o preço do item
   */
  validatePrice: (price: number | null | undefined): boolean => {
    if (price === null || price === undefined) return true;
    return typeof price === 'number' && price >= 0 && price <= 999999.99;
  },

  /**
   * Atualiza um item da lista
   */
  updateListItem: async (listId: string, itemId: string, updates: {
    quantity?: number;
    unit?: string;
    checked?: boolean;
    price?: number | null;
  }) => {
    try {
      // Busca o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Valida o preço se fornecido
      if (updates.price !== undefined && !ListsService.validatePrice(updates.price)) {
        throw new Error('Preço inválido. Deve ser um número entre 0 e 999999.99');
      }

      // Prepara os dados para atualização
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.quantity !== undefined) updateData.quantity = updates.quantity;
      if (updates.unit !== undefined) updateData.unit = updates.unit;
      if (updates.checked !== undefined) updateData.checked = updates.checked;
      if (updates.price !== undefined) updateData.price = updates.price;

      const { data, error } = await supabase
        .from('list_items')
        .update(updateData)
        .eq('id', itemId)
        .eq('list_id', listId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      return { data: null, error };
    }
  },

  /**
   * Remove um item da lista
   */
  removeListItem: async (listId: string, itemId: string) => {
    try {
      // Busca o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await supabase
        .from('list_items')
        .delete()
        .eq('id', itemId)
        .eq('list_id', listId)
        .eq('user_id', user.id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Erro ao remover item:', error);
      return { error };
    }
  },

  /**
   * Clona uma lista criando uma nova com os mesmos produtos desmarcados
   */
  cloneList: async (originalListId: string, newListName?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar a lista original
      const { data: originalList, error: listError } = await ListsService.getListById(originalListId);
      if (listError || !originalList) {
        throw new Error('Lista original não encontrada');
      }

      // Buscar itens da lista original
      const { data: originalItems, error: itemsError } = await ListsService.getListItems(originalListId);
      if (itemsError) {
        throw new Error('Erro ao buscar itens da lista original');
      }

      // Criar nova lista
      const cloneName = newListName || `${originalList.name} (Cópia)`;
      const { data: newList, error: createError } = await ListsService.createList(cloneName);
      if (createError || !newList) {
        throw new Error('Erro ao criar nova lista');
      }

      // Adicionar itens à nova lista (desmarcados)
      if (originalItems && originalItems.length > 0) {
        const itemPromises = originalItems.map(item => 
          ListsService.addListItem(newList.id, {
            product_name: item.product_name,
            quantity: item.quantity,
            unit: item.unit,
            checked: false, // Sempre desmarcado
            product_id: item.product_id || undefined,
            generic_product_id: item.generic_product_id || undefined,
          })
        );

        await Promise.all(itemPromises);
      }

      return { data: newList, error: null };
    } catch (error) {
      console.error('Erro ao clonar lista:', error);
      return { data: null, error };
    }
  },

  /**
   * Finaliza uma lista, opcionalmente criando nova lista com itens não comprados
   */
  finishList: async (listId: string, createNewListWithPending: boolean = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar lista e itens
      const { data: list, error: listError } = await ListsService.getListById(listId);
      if (listError || !list) {
        throw new Error('Lista não encontrada');
      }

      const { data: items, error: itemsError } = await ListsService.getListItems(listId);
      if (itemsError) {
        throw new Error('Erro ao buscar itens da lista');
      }

      let newList = null;

      // Se solicitado, criar nova lista com itens não comprados
      if (createNewListWithPending && items) {
        const pendingItems = items.filter(item => !item.checked);
        
        if (pendingItems.length > 0) {
          const newListName = `${list.name} (Pendentes)`;
          const { data: createdList, error: createError } = await ListsService.createList(newListName);
          
          if (createError || !createdList) {
            throw new Error('Erro ao criar lista com itens pendentes');
          }

          newList = createdList;

          // Adicionar itens pendentes à nova lista
          const itemPromises = pendingItems.map(item => 
            ListsService.addListItem(createdList.id, {
              product_name: item.product_name,
              quantity: item.quantity,
              unit: item.unit,
              checked: false,
              product_id: item.product_id || undefined,
              generic_product_id: item.generic_product_id || undefined,
            })
          );

          await Promise.all(itemPromises);
        }
      }

      // Marcar lista original como finalizada
      await ListsService.markListAsFinished(listId);

      return { 
        data: { 
          finishedList: list, 
          newListWithPending: newList 
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Erro ao finalizar lista:', error);
      return { data: null, error };
    }
  },

  /**
   * Marca uma lista como finalizada
   */
  markListAsFinished: async (listId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('lists')
        .update({ 
          status: 'finished',
          updated_at: new Date().toISOString()
        })
        .eq('id', listId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao finalizar lista:', error);
      return { data: null, error };
    }
  },

  /**
   * Busca listas pendentes do usuário
   * Fallback para getUserLists se a coluna status não existir
   */
  getPendingLists: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Tentar buscar com filtro de status
      const { data, error } = await supabase
        .from('lists')
        .select('*')
        .eq('user_id', user.id)
        .or('status.is.null,status.eq.pending')
        .order('updated_at', { ascending: false });

      // Se der erro de coluna não existir, usar getUserLists e filtrar localmente
      if (error && error.code === '42703') {
        const { data: allLists, error: fallbackError } = await ListsService.getUserLists();
        if (fallbackError) throw fallbackError;
        
        const pendingLists = (allLists || []).filter(list => !list.status || list.status === 'pending');
        return { data: pendingLists, error: null };
      }

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao buscar listas pendentes:', error);
      return { data: null, error };
    }
  },

  /**
   * Busca listas finalizadas do usuário
   * Fallback para getUserLists se a coluna status não existir
   */
  getFinishedLists: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Tentar buscar com filtro de status
      const { data, error } = await supabase
        .from('lists')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'finished')
        .order('updated_at', { ascending: false });

      // Se der erro de coluna não existir, usar getUserLists e filtrar localmente
      if (error && error.code === '42703') {
        const { data: allLists, error: fallbackError } = await ListsService.getUserLists();
        if (fallbackError) throw fallbackError;
        
        const finishedLists = (allLists || []).filter(list => list.status === 'finished');
        return { data: finishedLists, error: null };
      }

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao buscar listas finalizadas:', error);
      return { data: null, error };
    }
  },

  /**
   * Verifica se uma lista está finalizada
   */
  isListFinished: (list: List) => {
    return list.status === 'finished';
  },

  /**
   * Adiciona um produto específico à lista
   */
  addSpecificProductToList: async (listId: string, productId: string, quantity: number = 1, unit: string = 'un') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar informações do produto específico
      const { data: product, error: productError } = await supabase
        .from('specific_products')
        .select('name')
        .eq('id', productId)
        .eq('user_id', user.id)
        .single();

      if (productError || !product) {
        throw new Error('Produto não encontrado');
      }

      // Adicionar item à lista
      return await ListsService.addListItem(listId, {
        product_name: product.name,
        quantity,
        unit,
        checked: false,
        product_id: productId,
      });
    } catch (error) {
      console.error('Erro ao adicionar produto específico à lista:', error);
      return { data: null, error };
    }
  },

  /**
   * Adiciona um produto genérico à lista
   */
  addGenericProductToList: async (listId: string, genericProductId: string, quantity: number = 1, unit: string = 'un') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar informações do produto genérico
      const { data: product, error: productError } = await supabase
        .from('generic_products')
        .select('name')
        .eq('id', genericProductId)
        .single();

      if (productError || !product) {
        throw new Error('Produto genérico não encontrado');
      }

      // Adicionar item à lista
      return await ListsService.addListItem(listId, {
        product_name: product.name,
        quantity,
        unit,
        checked: false,
        generic_product_id: genericProductId,
      });
    } catch (error) {
      console.error('Erro ao adicionar produto genérico à lista:', error);
      return { data: null, error };
    }
  },
};