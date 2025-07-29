import { supabase } from './supabase';
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

      const { data, error } = await supabase
        .from('lists')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
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

      // Busca itens com produtos associados
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
                name,
                category
              )
            )
          )
        `)
        .eq('list_id', listId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error1) throw error1;

      // Processar os dados para incluir informações do produto
      const processedData = itemsWithProducts?.map(item => {
        const productInfo = item.list_item_products?.[0]?.specific_products;
        return {
          ...item,
          product_name: productInfo?.name || 'Produto desconhecido',
          product_brand: productInfo?.brand || '',
          product_id: productInfo?.id || null,
          generic_product_name: productInfo?.generic_products?.name || '',
          category: productInfo?.generic_products?.category || '',
        };
      });

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
      const { data: listItemData, error: listItemError } = await supabase
        .from('list_items')
        .insert([
          {
            list_id: listId,
            quantity: item.quantity,
            unit: item.unit,
            checked: item.checked,
            user_id: user.id,
          }
        ])
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

      return { 
        data: { 
          ...listItemData, 
          product_name: item.product_name,
          product_id: productId || null
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      return { data: null, error };
    }
  },

  /**
   * Atualiza um item da lista
   */
  updateListItem: async (listId: string, itemId: string, updates: any) => {
    try {
      // Busca o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('list_items')
        .update({
          quantity: updates.quantity,
          unit: updates.unit,
          checked: updates.checked,
          updated_at: new Date().toISOString(),
        })
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
};