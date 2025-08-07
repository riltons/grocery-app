import { supabase } from './supabase';
import type { Store } from './supabase';

/**
 * Serviço para gerenciar operações com lojas
 */
export const StoreService = {
  /**
   * Busca todas as lojas do usuário
   */
  getStores: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) {
        console.error('Erro ao buscar lojas:', error);
        throw error;
      }

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
  createStore: async (store: Omit<Store, 'id' | 'created_at' | 'user_id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('stores')
        .insert({
          ...store,
          user_id: user.id,
        })
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
  updateStore: async (id: string, updates: Partial<Omit<Store, 'id' | 'created_at' | 'user_id'>>) => {
    try {
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
   * Busca histórico de preços de uma loja específica
   */
  getStorePriceHistory: async (storeId: string, limit: number = 50) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('price_history')
        .select(`
          *,
          specific_products (
            id,
            name,
            brand,
            barcode,
            generic_products (
              id,
              name,
              categories (
                id,
                name
              )
            )
          )
        `)
        .eq('store_id', storeId)
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao buscar histórico de preços da loja:', error);
      return { data: null, error };
    }
  },

  /**
   * Busca produtos únicos com preços em uma loja
   */
  getStoreProducts: async (storeId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('price_history')
        .select(`
          specific_product_id,
          price,
          date,
          specific_products (
            id,
            name,
            brand,
            barcode,
            image_url,
            generic_products (
              id,
              name,
              categories (
                id,
                name
              )
            )
          )
        `)
        .eq('store_id', storeId)
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;

      // Agrupar por produto específico e pegar o preço mais recente
      const productMap = new Map();
      
      data?.forEach(item => {
        if (!productMap.has(item.specific_product_id)) {
          productMap.set(item.specific_product_id, {
            ...item.specific_products,
            latest_price: item.price,
            latest_date: item.date,
          });
        }
      });

      const uniqueProducts = Array.from(productMap.values());
      
      return { data: uniqueProducts, error: null };
    } catch (error) {
      console.error('Erro ao buscar produtos da loja:', error);
      return { data: null, error };
    }
  },

  /**
   * Calcula estatísticas de uma loja
   */
  getStoreStats: async (storeId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar todos os preços da loja
      const { data: priceHistory, error } = await supabase
        .from('price_history')
        .select('price, date')
        .eq('store_id', storeId)
        .eq('user_id', user.id);

      if (error) throw error;

      if (!priceHistory || priceHistory.length === 0) {
        return {
          data: {
            totalProducts: 0,
            totalSpent: 0,
            averagePrice: 0,
            lastVisit: null,
            priceEntries: 0,
          },
          error: null
        };
      }

      // Calcular estatísticas
      const totalProducts = new Set(priceHistory.map(p => p.specific_product_id)).size;
      const totalSpent = priceHistory.reduce((sum, p) => sum + p.price, 0);
      const averagePrice = totalSpent / priceHistory.length;
      const lastVisit = priceHistory.reduce((latest, p) => 
        new Date(p.date) > new Date(latest) ? p.date : latest, 
        priceHistory[0].date
      );

      return {
        data: {
          totalProducts,
          totalSpent,
          averagePrice,
          lastVisit,
          priceEntries: priceHistory.length,
        },
        error: null
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas da loja:', error);
      return { data: null, error };
    }
  },

  /**
   * Busca lojas mais utilizadas (com mais registros de preços)
   */
  getMostUsedStores: async (limit: number = 5) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar contagem de preços por loja
      const { data: priceCount, error: priceError } = await supabase
        .from('price_history')
        .select('store_id')
        .eq('user_id', user.id);

      if (priceError) throw priceError;

      // Contar ocorrências por loja
      const storeCount = new Map();
      priceCount?.forEach(item => {
        const count = storeCount.get(item.store_id) || 0;
        storeCount.set(item.store_id, count + 1);
      });

      // Buscar dados das lojas mais utilizadas
      const topStoreIds = Array.from(storeCount.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, limit)
        .map(([storeId]) => storeId);

      if (topStoreIds.length === 0) {
        return { data: [], error: null };
      }

      const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('*')
        .in('id', topStoreIds)
        .eq('user_id', user.id);

      if (storesError) throw storesError;

      // Adicionar contagem de uso às lojas
      const storesWithCount = stores?.map(store => ({
        ...store,
        usage_count: storeCount.get(store.id) || 0,
      })).sort((a, b) => b.usage_count - a.usage_count);

      return { data: storesWithCount || [], error: null };
    } catch (error) {
      console.error('Erro ao buscar lojas mais utilizadas:', error);
      return { data: null, error };
    }
  },
};