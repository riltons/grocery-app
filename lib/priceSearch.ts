import { supabase } from './supabase';
import type { PriceSearchSession, PriceSearchItem, SpecificProduct } from './supabase';

/**
 * Serviço para gerenciar sessões de pesquisa de preços
 */
export const PriceSearchService = {
  /**
   * Cria uma nova sessão de pesquisa de preços
   */
  createSession: async (storeId: string, name?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Desativar sessões anteriores da mesma loja
      await supabase
        .from('price_search_sessions')
        .update({ is_active: false })
        .eq('store_id', storeId)
        .eq('user_id', user.id);

      // Criar nova sessão
      const sessionName = name || `Pesquisa ${new Date().toLocaleDateString('pt-BR')}`;
      
      const { data, error } = await supabase
        .from('price_search_sessions')
        .insert({
          store_id: storeId,
          name: sessionName,
          user_id: user.id,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao criar sessão de pesquisa:', error);
      return { data: null, error };
    }
  },

  /**
   * Busca a sessão ativa de uma loja
   */
  getActiveSession: async (storeId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('price_search_sessions')
        .select('*')
        .eq('store_id', storeId)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return { data: data || null, error: null };
    } catch (error) {
      console.error('Erro ao buscar sessão ativa:', error);
      return { data: null, error };
    }
  },

  /**
   * Busca todas as sessões de uma loja
   */
  getStoreSessions: async (storeId: string, limit: number = 10) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('price_search_sessions')
        .select('*')
        .eq('store_id', storeId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao buscar sessões da loja:', error);
      return { data: null, error };
    }
  },

  /**
   * Adiciona um item à sessão de pesquisa
   */
  addItemToSession: async (sessionId: string, productId: string, scanned: boolean = true) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Verificar se o produto já existe na sessão
      const { data: existingItem } = await supabase
        .from('price_search_items')
        .select('id')
        .eq('session_id', sessionId)
        .eq('specific_product_id', productId)
        .single();

      if (existingItem) {
        return { data: existingItem, error: null, alreadyExists: true };
      }

      const { data, error } = await supabase
        .from('price_search_items')
        .insert({
          session_id: sessionId,
          specific_product_id: productId,
          scanned,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Atualizar timestamp da sessão
      await supabase
        .from('price_search_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId);

      return { data, error: null, alreadyExists: false };
    } catch (error) {
      console.error('Erro ao adicionar item à sessão:', error);
      return { data: null, error, alreadyExists: false };
    }
  },

  /**
   * Atualiza o preço de um item na sessão
   */
  updateItemPrice: async (itemId: string, price: number) => {
    try {
      const { data, error } = await supabase
        .from('price_search_items')
        .update({ price })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;

      // Atualizar timestamp da sessão
      const { data: item } = await supabase
        .from('price_search_items')
        .select('session_id')
        .eq('id', itemId)
        .single();

      if (item) {
        await supabase
          .from('price_search_sessions')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', item.session_id);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Erro ao atualizar preço do item:', error);
      return { data: null, error };
    }
  },

  /**
   * Remove um item da sessão
   */
  removeItemFromSession: async (itemId: string) => {
    try {
      // Buscar session_id antes de deletar
      const { data: item } = await supabase
        .from('price_search_items')
        .select('session_id')
        .eq('id', itemId)
        .single();

      const { error } = await supabase
        .from('price_search_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      // Atualizar timestamp da sessão
      if (item) {
        await supabase
          .from('price_search_sessions')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', item.session_id);
      }

      return { error: null };
    } catch (error) {
      console.error('Erro ao remover item da sessão:', error);
      return { error };
    }
  },

  /**
   * Busca todos os itens de uma sessão com dados dos produtos
   */
  getSessionItems: async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('price_search_items')
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
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao buscar itens da sessão:', error);
      return { data: null, error };
    }
  },

  /**
   * Finaliza uma sessão (salva preços no histórico)
   */
  finalizeSession: async (sessionId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar sessão e itens
      const { data: session } = await supabase
        .from('price_search_sessions')
        .select('store_id')
        .eq('id', sessionId)
        .single();

      if (!session) {
        throw new Error('Sessão não encontrada');
      }

      const { data: items } = await supabase
        .from('price_search_items')
        .select('specific_product_id, price')
        .eq('session_id', sessionId)
        .not('price', 'is', null);

      if (!items || items.length === 0) {
        throw new Error('Nenhum item com preço para salvar');
      }

      // Salvar preços no histórico
      const priceHistoryData = items.map(item => ({
        specific_product_id: item.specific_product_id,
        store_id: session.store_id,
        price: item.price!,
        date: new Date().toISOString(),
        user_id: user.id,
      }));

      const { error: historyError } = await supabase
        .from('price_history')
        .insert(priceHistoryData);

      if (historyError) throw historyError;

      // Marcar sessão como inativa
      const { error: sessionError } = await supabase
        .from('price_search_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);

      if (sessionError) throw sessionError;

      return { error: null, itemsCount: items.length };
    } catch (error) {
      console.error('Erro ao finalizar sessão:', error);
      return { error, itemsCount: 0 };
    }
  },

  /**
   * Limpa uma sessão (remove todos os itens)
   */
  clearSession: async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('price_search_items')
        .delete()
        .eq('session_id', sessionId);

      if (error) throw error;

      // Atualizar timestamp da sessão
      await supabase
        .from('price_search_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId);

      return { error: null };
    } catch (error) {
      console.error('Erro ao limpar sessão:', error);
      return { error };
    }
  },

  /**
   * Exclui uma sessão completamente
   */
  deleteSession: async (sessionId: string) => {
    try {
      // Primeiro, deletar todos os itens
      await supabase
        .from('price_search_items')
        .delete()
        .eq('session_id', sessionId);

      // Depois, deletar a sessão
      const { error } = await supabase
        .from('price_search_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Erro ao excluir sessão:', error);
      return { error };
    }
  },
};