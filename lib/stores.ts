import { supabase } from './supabase';
import { Store, PriceHistory } from './supabase';

/**
 * Serviço para gerenciar operações com lojas e histórico de preços
 */
export const StoreService = {
  /**
   * Busca todas as lojas do usuário
   */
  getStores: async () => {
    try {
      // Busca o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao buscar lojas:', error);
      return { data: null, error };
    }
  },

  /**
   * Busca uma loja pelo ID
   */
  getStoreById: async (id: string) => {
    try {
      // Busca o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao buscar loja:', error);
      return { data: null, error };
    }
  },

  /**
   * Cria uma nova loja
   */
  createStore: async (store: Omit<Store, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .insert(store)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao criar loja:', error);
      return { data: null, error };
    }
  },

  /**
   * Atualiza uma loja
   */
  updateStore: async (id: string, updates: Partial<Store>) => {
    try {
      // Busca o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('stores')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao atualizar loja:', error);
      return { data: null, error };
    }
  },

  /**
   * Remove uma loja
   */
  deleteStore: async (id: string) => {
    try {
      // Busca o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Erro ao remover loja:', error);
      return { error };
    }
  },

  /**
   * Busca o histórico de preços de um produto específico
   */
  getPriceHistory: async (specificProductId: string) => {
    try {
      const { data, error } = await supabase
        .from('price_history')
        .select('*, stores(*)')
        .eq('specific_product_id', specificProductId)
        .order('date', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao buscar histórico de preços:', error);
      return { data: null, error };
    }
  },

  /**
   * Registra um novo preço no histórico
   */
  addPriceRecord: async (priceRecord: Omit<PriceHistory, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('price_history')
        .insert(priceRecord)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao registrar preço:', error);
      return { data: null, error };
    }
  },

  /**
   * Atualiza um registro de preço
   */
  updatePriceRecord: async (id: string, updates: Partial<PriceHistory>) => {
    try {
      const { data, error } = await supabase
        .from('price_history')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao atualizar registro de preço:', error);
      return { data: null, error };
    }
  },

  /**
   * Remove um registro de preço
   */
  deletePriceRecord: async (id: string) => {
    try {
      const { error } = await supabase
        .from('price_history')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Erro ao remover registro de preço:', error);
      return { error };
    }
  },

  /**
   * Busca o histórico de preços de uma loja específica
   */
  getPriceHistoryByStore: async (storeId: string) => {
    try {
      const { data, error } = await supabase
        .from('price_history')
        .select('*, specific_products(*)')
        .eq('store_id', storeId)
        .order('date', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao buscar histórico de preços da loja:', error);
      return { data: null, error };
    }
  },
};