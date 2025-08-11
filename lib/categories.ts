import { supabase } from './supabase';
import type { Category } from './supabase';

/**
 * Serviço para gerenciar operações com categorias
 */
export const CategoryService = {
  /**
   * Busca uma categoria pelo ID
   */
  getCategoryById: async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao buscar categoria:', error);
      return { data: null, error };
    }
  },

  /**
   * Busca todas as categorias do usuário
   */
  getCategories: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) {
        console.error('Erro ao buscar categorias:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      return { data: null, error };
    }
  },

  /**
   * Busca ou cria a categoria padrão "Outros"
   */
  getOrCreateDefaultCategory: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar categoria "Outros" existente
      const { data: existingCategory } = await supabase
        .from('categories')
        .select('*')
        .eq('name', 'Outros')
        .eq('user_id', user.id)
        .single();

      if (existingCategory) {
        return { data: existingCategory, error: null };
      }

      // Criar categoria padrão se não existir
      const { data: newCategory, error } = await supabase
        .from('categories')
        .insert({
          name: 'Outros',
          icon: 'help-circle-outline',
          color: '#94a3b8',
          description: 'Categoria padrão para produtos sem categoria específica',
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar categoria padrão:', error);
        throw error;
      }

      return { data: newCategory, error: null };
    } catch (error) {
      console.error('Erro ao buscar/criar categoria padrão:', error);
      return { data: null, error };
    }
  },

  /**
   * Cria uma nova categoria
   */
  createCategory: async (category: Omit<Category, 'id' | 'created_at' | 'user_id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('categories')
        .insert({
          ...category,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      return { data: null, error };
    }
  },

  /**
   * Atualiza uma categoria
   */
  updateCategory: async (id: string, updates: Partial<Omit<Category, 'id' | 'created_at' | 'user_id'>>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      return { data: null, error };
    }
  },

  /**
   * Remove uma categoria
   */
  deleteCategory: async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Erro ao remover categoria:', error);
      return { error };
    }
  },
};

export { Category };