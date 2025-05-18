import { supabase } from './supabase';
import { GenericProduct, SpecificProduct } from './supabase';

/**
 * Serviço para gerenciar operações com produtos genéricos e específicos
 */
export const ProductService = {
  /**
   * Busca todos os produtos genéricos do usuário
   */
  getGenericProducts: async () => {
    try {
      const { data, error } = await supabase
        .from('generic_products')
        .select('*')
        .order('name');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao buscar produtos genéricos:', error);
      return { data: null, error };
    }
  },

  /**
   * Busca um produto genérico pelo ID
   */
  getGenericProductById: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('generic_products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao buscar produto genérico:', error);
      return { data: null, error };
    }
  },

  /**
   * Cria um novo produto genérico
   */
  createGenericProduct: async (product: Omit<GenericProduct, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('generic_products')
        .insert(product)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao criar produto genérico:', error);
      return { data: null, error };
    }
  },

  /**
   * Atualiza um produto genérico
   */
  updateGenericProduct: async (id: string, updates: Partial<GenericProduct>) => {
    try {
      const { data, error } = await supabase
        .from('generic_products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao atualizar produto genérico:', error);
      return { data: null, error };
    }
  },

  /**
   * Remove um produto genérico
   */
  deleteGenericProduct: async (id: string) => {
    try {
      const { error } = await supabase
        .from('generic_products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Erro ao remover produto genérico:', error);
      return { error };
    }
  },

  /**
   * Busca todos os produtos específicos
   */
  getSpecificProducts: async () => {
    try {
      const { data, error } = await supabase
        .from('specific_products')
        .select('*, generic_products(*)')
        .order('name');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao buscar produtos específicos:', error);
      return { data: null, error };
    }
  },

  /**
   * Busca um produto específico pelo ID
   */
  getSpecificProductById: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('specific_products')
        .select('*, generic_products(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao buscar produto específico:', error);
      return { data: null, error };
    }
  },

  /**
   * Busca produtos específicos por produto genérico
   */
  getSpecificProductsByGenericId: async (genericProductId: string) => {
    try {
      const { data, error } = await supabase
        .from('specific_products')
        .select('*')
        .eq('generic_product_id', genericProductId)
        .order('name');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao buscar produtos específicos:', error);
      return { data: null, error };
    }
  },

  /**
   * Cria um novo produto específico
   */
  createSpecificProduct: async (product: Omit<SpecificProduct, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('specific_products')
        .insert(product)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao criar produto específico:', error);
      return { data: null, error };
    }
  },

  /**
   * Atualiza um produto específico
   */
  updateSpecificProduct: async (id: string, updates: Partial<SpecificProduct>) => {
    try {
      const { data, error } = await supabase
        .from('specific_products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao atualizar produto específico:', error);
      return { data: null, error };
    }
  },

  /**
   * Remove um produto específico
   */
  deleteSpecificProduct: async (id: string) => {
    try {
      const { error } = await supabase
        .from('specific_products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Erro ao remover produto específico:', error);
      return { error };
    }
  },

  /**
   * Busca o histórico de preços de um produto específico
   */
  getProductPrices: async (specificProductId: string) => {
    try {
      const { data, error } = await supabase
        .from('price_history')
        .select('*, stores(*)')
        .eq('specific_product_id', specificProductId)
        .order('date', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao buscar histórico de preços do produto:', error);
      return { data: null, error };
    }
  },

  /**
   * Adiciona um novo preço ao histórico de um produto específico
   */
  addProductPrice: async (specificProductId: string, priceData: Omit<any, 'id' | 'created_at' | 'specific_product_id'>) => {
    try {
      const priceRecord = {
        ...priceData,
        specific_product_id: specificProductId
      };

      const { data, error } = await supabase
        .from('price_history')
        .insert(priceRecord)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao adicionar preço ao produto:', error);
      return { data: null, error };
    }
  },
};