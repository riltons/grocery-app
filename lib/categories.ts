import { supabase } from './supabase';

// Tipo para categoria
export interface Category {
  id: string;
  name: string;
  icon: string;
  color?: string;
  description?: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
}

// Tipo para criação de categoria
export interface CreateCategoryData {
  name: string;
  icon: string;
  color?: string;
  description?: string;
}

// Tipo para atualização de categoria
export interface UpdateCategoryData {
  name?: string;
  icon?: string;
  color?: string;
  description?: string;
}

// Categorias padrão do sistema
export const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'user_id' | 'created_at'>[] = [
  { name: 'Frutas', icon: 'nutrition', color: '#FF6B6B', description: 'Frutas frescas e secas' },
  { name: 'Vegetais', icon: 'leaf', color: '#4ECDC4', description: 'Verduras e legumes' },
  { name: 'Carnes', icon: 'restaurant', color: '#FF8E53', description: 'Carnes vermelhas, aves e peixes' },
  { name: 'Laticínios', icon: 'water', color: '#45B7D1', description: 'Leite, queijos e derivados' },
  { name: 'Padaria', icon: 'pizza', color: '#F7DC6F', description: 'Pães, bolos e massas' },
  { name: 'Mercearia', icon: 'basket', color: '#BB8FCE', description: 'Produtos secos e enlatados' },
  { name: 'Bebidas', icon: 'beer', color: '#58D68D', description: 'Bebidas alcoólicas e não alcoólicas' },
  { name: 'Limpeza', icon: 'sparkles', color: '#85C1E9', description: 'Produtos de limpeza doméstica' },
  { name: 'Higiene', icon: 'medical', color: '#F8C471', description: 'Produtos de higiene pessoal' },
  { name: 'Pet', icon: 'paw', color: '#D7BDE2', description: 'Produtos para animais de estimação' },
  { name: 'Casa', icon: 'home', color: '#A9DFBF', description: 'Utensílios e decoração' },
  { name: 'Farmácia', icon: 'medical-outline', color: '#F1948A', description: 'Medicamentos e suplementos' },
  { name: 'Outros', icon: 'ellipsis-horizontal', color: '#BDC3C7', description: 'Outros produtos' },
];

/**
 * Serviço para gerenciar categorias de produtos
 */
export const CategoryService = {
  /**
   * Lista todas as categorias do usuário
   */
  async getCategories(): Promise<{ data: Category[] | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { data: null, error: 'Usuário não autenticado' };
      }

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) {
        console.error('Erro ao buscar categorias:', error);
        return { data: null, error };
      }

      // Se não há categorias, criar as padrão
      if (!data || data.length === 0) {
        const defaultCategories = await this.createDefaultCategories();
        return { data: defaultCategories, error: null };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      return { data: null, error };
    }
  },

  /**
   * Busca uma categoria por ID
   */
  async getCategoryById(id: string): Promise<{ data: Category | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { data: null, error: 'Usuário não autenticado' };
      }

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Erro ao buscar categoria:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Erro ao buscar categoria:', error);
      return { data: null, error };
    }
  },

  /**
   * Cria uma nova categoria
   */
  async createCategory(categoryData: CreateCategoryData): Promise<{ data: Category | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { data: null, error: 'Usuário não autenticado' };
      }

      // Verificar se já existe uma categoria com o mesmo nome
      const { data: existingCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', categoryData.name.trim())
        .single();

      if (existingCategory) {
        return { data: null, error: 'Já existe uma categoria com este nome' };
      }

      const { data, error } = await supabase
        .from('categories')
        .insert({
          ...categoryData,
          name: categoryData.name.trim(),
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar categoria:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      return { data: null, error };
    }
  },

  /**
   * Atualiza uma categoria existente
   */
  async updateCategory(id: string, categoryData: UpdateCategoryData): Promise<{ data: Category | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { data: null, error: 'Usuário não autenticado' };
      }

      // Se está atualizando o nome, verificar duplicatas
      if (categoryData.name) {
        const { data: existingCategory } = await supabase
          .from('categories')
          .select('id')
          .eq('user_id', user.id)
          .eq('name', categoryData.name.trim())
          .neq('id', id)
          .single();

        if (existingCategory) {
          return { data: null, error: 'Já existe uma categoria com este nome' };
        }
      }

      const updateData = {
        ...categoryData,
        ...(categoryData.name && { name: categoryData.name.trim() }),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('categories')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar categoria:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      return { data: null, error };
    }
  },

  /**
   * Remove uma categoria
   */
  async deleteCategory(id: string): Promise<{ error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { error: 'Usuário não autenticado' };
      }

      // Verificar se a categoria está sendo usada por produtos
      const { data: productsUsingCategory, error: checkError } = await supabase
        .from('generic_products')
        .select('id')
        .eq('user_id', user.id)
        .eq('category_id', id)
        .limit(1);

      if (checkError) {
        console.error('Erro ao verificar uso da categoria:', checkError);
        return { error: checkError };
      }

      if (productsUsingCategory && productsUsingCategory.length > 0) {
        return { error: 'Não é possível excluir uma categoria que está sendo usada por produtos' };
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao deletar categoria:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Erro ao deletar categoria:', error);
      return { error };
    }
  },

  /**
   * Cria as categorias padrão para um novo usuário
   */
  async createDefaultCategories(): Promise<Category[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const categoriesToCreate = DEFAULT_CATEGORIES.map(category => ({
        ...category,
        user_id: user.id,
      }));

      const { data, error } = await supabase
        .from('categories')
        .insert(categoriesToCreate)
        .select();

      if (error) {
        console.error('Erro ao criar categorias padrão:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao criar categorias padrão:', error);
      return [];
    }
  },

  /**
   * Busca categorias por nome (para autocomplete)
   */
  async searchCategories(query: string): Promise<{ data: Category[] | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { data: null, error: 'Usuário não autenticado' };
      }

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .ilike('name', `%${query}%`)
        .order('name', { ascending: true })
        .limit(10);

      if (error) {
        console.error('Erro ao buscar categorias:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      return { data: null, error };
    }
  },

  /**
   * Obtém estatísticas de uso das categorias
   */
  async getCategoryStats(): Promise<{ data: any[] | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { data: null, error: 'Usuário não autenticado' };
      }

      // Buscar contagem de produtos por categoria
      const { data, error } = await supabase
        .from('generic_products')
        .select('category_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao buscar estatísticas:', error);
        return { data: null, error };
      }

      // Contar produtos por categoria
      const categoryCount: { [key: string]: number } = {};
      data?.forEach(product => {
        if (product.category_id) {
          categoryCount[product.category_id] = (categoryCount[product.category_id] || 0) + 1;
        }
      });

      // Buscar informações das categorias
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id);

      if (categoriesError) {
        console.error('Erro ao buscar categorias:', categoriesError);
        return { data: null, error: categoriesError };
      }

      // Combinar dados
      const stats = categories?.map(category => ({
        ...category,
        productCount: categoryCount[category.id] || 0,
      })) || [];

      return { data: stats, error: null };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return { data: null, error };
    }
  },
};