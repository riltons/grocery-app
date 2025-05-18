import { supabase } from './supabase';
import { List, ListItem, ListItemProduct } from './supabase';

/**
 * Serviço para gerenciar operações com listas de compras e seus itens
 */
export const ListService = {
  /**
   * Busca todas as listas do usuário
   */
  getLists: async () => {
    try {
      const { data, error } = await supabase
        .from('lists')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao buscar listas:', error);
      return { data: null, error };
    }
  },

  /**
   * Busca uma lista pelo ID
   */
  getListById: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('lists')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao buscar lista:', error);
      return { data: null, error };
    }
  },

  /**
   * Cria uma nova lista
   */
  createList: async (list: Omit<List, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    try {
      // Obtém o usuário atual
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      
      if (!userId) {
        throw new Error('Usuário não autenticado');
      }
      
      // Adiciona o ID do usuário ao objeto da lista
      const listWithUserId = {
        ...list,
        user_id: userId
      };

      const { data, error } = await supabase
        .from('lists')
        .insert(listWithUserId)
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
   * Atualiza uma lista
   */
  updateList: async (id: string, updates: Partial<List>) => {
    try {
      // Atualiza também o campo updated_at
      const updatesWithTimestamp = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('lists')
        .update(updatesWithTimestamp)
        .eq('id', id)
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
   * Remove uma lista
   */
  deleteList: async (id: string) => {
    try {
      const { error } = await supabase
        .from('lists')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Erro ao remover lista:', error);
      return { error };
    }
  },

  /**
   * Busca todos os itens de uma lista
   */
  getListItems: async (listId: string) => {
    try {
      const { data, error } = await supabase
        .from('list_items')
        .select(`
          *,
          list_item_products(*, specific_products(*, generic_products(*)))
        `)
        .eq('list_id', listId)
        .order('created_at');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao buscar itens da lista:', error);
      return { data: null, error };
    }
  },

  /**
   * Cria um novo item na lista
   */
  createListItem: async (item: Omit<ListItem, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('list_items')
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao criar item na lista:', error);
      return { data: null, error };
    }
  },

  /**
   * Atualiza um item da lista
   * @param listId ID da lista (opcional, usado apenas para verificação)
   * @param itemId ID do item a ser atualizado
   * @param updates Dados a serem atualizados
   */
  updateListItem: async (listId: string, itemId: string, updates: Partial<ListItem>) => {
    try {
      // Atualiza também o campo updated_at
      const updatesWithTimestamp = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('list_items')
        .update(updatesWithTimestamp)
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao atualizar item da lista:', error);
      return { data: null, error };
    }
  },

  /**
   * Remove um item da lista
   */
  deleteListItem: async (id: string) => {
    try {
      const { error } = await supabase
        .from('list_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Erro ao remover item da lista:', error);
      return { error };
    }
  },

  /**
   * Associa um produto específico a um item da lista
   */
  addProductToListItem: async (itemProduct: Omit<ListItemProduct, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('list_item_products')
        .insert(itemProduct)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao adicionar produto ao item da lista:', error);
      return { data: null, error };
    }
  },

  /**
   * Remove a associação de um produto específico a um item da lista
   */
  removeProductFromListItem: async (id: string) => {
    try {
      const { error } = await supabase
        .from('list_item_products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Erro ao remover produto do item da lista:', error);
      return { error };
    }
  },

  /**
   * Adiciona um novo item à lista
   * @param listId ID da lista onde o item será adicionado
   * @param item Dados do item a ser adicionado
   */
  addListItem: async (listId: string, item: Omit<ListItem, 'id' | 'list_id' | 'created_at' | 'updated_at' | 'user_id'> & { product_name?: string }) => {
    try {
      // Obtém o usuário atual
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      
      if (!userId) {
        throw new Error('Usuário não autenticado');
      }
      
      // Prepara o item com o ID da lista e o ID do usuário
      const itemWithListId = {
        ...item,
        list_id: listId,
        user_id: userId
      };

      const { data, error } = await supabase
        .from('list_items')
        .insert(itemWithListId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao adicionar item à lista:', error);
      return { data: null, error };
    }
  },

  /**
   * Remove um item de uma lista específica
   * @param listId ID da lista de onde o item será removido
   * @param itemId ID do item a ser removido
   */
  removeListItem: async (listId: string, itemId: string) => {
    try {
      const { error } = await supabase
        .from('list_items')
        .delete()
        .eq('id', itemId)
        .eq('list_id', listId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Erro ao remover item da lista:', error);
      return { error };
    }
  },
};