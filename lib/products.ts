import { supabase } from './supabase';
import { GenericProduct, SpecificProduct } from './supabase';
import { generateBarcode } from './barcodeGenerator';

/**
 * Serviço para gerenciar operações com produtos genéricos e específicos
 */
export const ProductsService = {
  /**
   * Busca todos os produtos específicos do usuário
   */
  getUserProducts: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('specific_products')
        .select(`
          *,
          generic_products (
            *,
            categories (
              id,
              name,
              icon,
              color
            )
          )
        `)
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao buscar produtos do usuário:', error);
      return { data: null, error };
    }
  },
};

export const ProductService = {
  /**
   * Busca todos os produtos genéricos do usuário (incluindo produtos padrão)
   */
  getGenericProducts: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('generic_products')
        .select(`
          *,
          categories (
            id,
            name
          )
        `)
        .or(`user_id.eq.${user.id},is_default.eq.true`)
        .order('is_default', { ascending: false })
        .order('name', { ascending: true }); // Produtos padrão primeiro, depois alfabético

      if (error) {
        console.error('Erro ao buscar produtos genéricos:', error);
        throw error;
      }

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
        .select(`
          *,
          categories (
            id,
            name
          )
        `)
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
   * Busca ou cria o produto genérico padrão "Outros"
   */
  getOrCreateDefaultGenericProduct: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar produto genérico "Outros" existente
      const { data: existingProduct } = await supabase
        .from('generic_products')
        .select('*')
        .eq('name', 'Outros')
        .eq('user_id', user.id)
        .single();

      if (existingProduct) {
        return { data: existingProduct, error: null };
      }

      // Buscar ou criar categoria padrão "Outros"
      const { CategoryService } = await import('./categories');
      const { data: defaultCategory } = await CategoryService.getOrCreateDefaultCategory();

      // Se não existe, criar o produto genérico "Outros"
      const { data: newProduct, error } = await supabase
        .from('generic_products')
        .insert({
          name: 'Outros',
          category_id: defaultCategory?.id || null,
          user_id: user.id,
        })
        .select('*')
        .single();

      if (error) {
        console.error('Erro ao criar produto genérico padrão:', error);
        throw error;
      }

      return { data: newProduct, error: null };
    } catch (error) {
      console.error('Erro ao buscar/criar produto genérico padrão:', error);
      return { data: null, error };
    }
  },

  /**
   * Cria um novo produto genérico
   */
  createGenericProduct: async (product: Omit<GenericProduct, 'id' | 'created_at'>) => {
    try {
      console.log('ProductService.createGenericProduct - Dados recebidos:', product);
      console.log('ProductService.createGenericProduct - Validação:', {
        name: product.name,
        name_length: product.name?.length,
        category_id: product.category_id,
        user_id: product.user_id,
        user_id_type: typeof product.user_id,
        user_id_valid: product.user_id && product.user_id.length > 0
      });

      const { data, error } = await supabase
        .from('generic_products')
        .insert(product)
        .select(`
          *,
          categories (
            id,
            name
          )
        `)
        .single();

      if (error) {
        console.error('Erro detalhado ao criar produto genérico:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      
      console.log('Produto genérico criado com sucesso:', data);
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
        .select(`
          *,
          categories (
            id,
            name
          )
        `)
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
   * Verifica se já existe um produto genérico com o nome especificado
   */
  checkGenericProductExists: async (name: string, excludeId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Normalizar o nome para comparação (remover espaços e converter para minúsculo)
      const normalizedName = name.trim().toLowerCase();

      let query = supabase
        .from('generic_products')
        .select('id, name')
        .eq('user_id', user.id);

      // Se há um ID para excluir (caso de edição), não incluir esse produto na verificação
      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data: genericProducts, error } = await query;

      if (error) throw error;

      // Verificar se algum produto genérico tem nome similar
      const exists = genericProducts?.some(product => 
        product.name.trim().toLowerCase() === normalizedName
      );

      return { exists: exists || false, error: null };
    } catch (error) {
      console.error('Erro ao verificar se produto genérico existe:', error);
      return { exists: false, error };
    }
  },

  /**
   * Busca todos os produtos específicos
   */
  getSpecificProducts: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('specific_products')
        .select(`
          *,
          generic_products (
            *,
            categories (
              id,
              name,
              icon,
              color
            )
          )
        `)
        .eq('user_id', user.id)
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
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('specific_products')
        .select(`
          *,
          generic_products (
            *,
            categories (
              id,
              name,
              icon,
              color
            )
          )
        `)
        .eq('id', id)
        .eq('user_id', user.id)
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
      // Gerar código de barras se não foi fornecido
      let productData = { ...product };
      if (!productData.barcode) {
        const barcodeData = generateBarcode('EAN13');
        productData.barcode = barcodeData.code;
        productData.barcode_type = barcodeData.type;
      }

      const { data, error } = await supabase
        .from('specific_products')
        .insert(productData)
        .select(`
          *,
          generic_products (
            *,
            categories (
              id,
              name,
              icon,
              color
            )
          )
        `)
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
      console.log('🔄 ProductService.updateSpecificProduct - Iniciando atualização');
      console.log('🔄 ID do produto:', id);
      console.log('🔄 Dados para atualização:', updates);

      const { data, error } = await supabase
        .from('specific_products')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          generic_products (
            *,
            categories (
              id,
              name
            )
          )
        `)
        .single();

      console.log('🔄 Resultado da query Supabase:', { data, error });

      if (error) {
        console.error('❌ Erro na query Supabase:', error);
        throw error;
      }
      
      console.log('✅ Produto atualizado com sucesso:', data);
      return { data, error: null };
    } catch (error) {
      console.error('❌ Erro ao atualizar produto específico:', error);
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
      // Busca o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('price_history')
        .select(`
          *,
          stores (
            id,
            name,
            address
          )
        `)
        .eq('specific_product_id', specificProductId)
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      
      // Processar os dados para garantir que a estrutura esteja correta
      const processedData = data?.map(item => ({
        ...item,
        store: item.stores || item.store // Normaliza a estrutura
      }));

      return { data: processedData, error: null };
    } catch (error) {
      console.error('Erro ao buscar histórico de preços do produto:', error);
      return { data: null, error };
    }
  },

  /**
   * Adiciona um novo preço ao histórico de um produto específico
   */
  addProductPrice: async (specificProductId: string, priceData: Omit<any, 'id' | 'created_at' | 'specific_product_id' | 'user_id'>) => {
    try {
      // Busca o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const priceRecord = {
        ...priceData,
        specific_product_id: specificProductId,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('price_history')
        .insert(priceRecord)
        .select(`
          *,
          stores (
            id,
            name,
            address
          )
        `)
        .single();

      if (error) throw error;
      
      // Processar os dados para garantir que a estrutura esteja correta
      const processedData = data ? {
        ...data,
        store: data.stores || data.store // Normaliza a estrutura
      } : null;

      return { data: processedData, error: null };
    } catch (error) {
      console.error('Erro ao adicionar preço ao produto:', error);
      return { data: null, error };
    }
  },

  /**
   * Busca produtos mais utilizados nas listas do usuário
   */
  getMostUsedProducts: async (limit: number = 10) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Query para buscar produtos mais utilizados baseado nos itens das listas
      const { data, error } = await supabase
        .from('list_items')
        .select(`
          id,
          list_id,
          quantity,
          unit,
          checked,
          created_at,
          list_item_products (
            specific_products (
              id,
              name,
              brand,
              generic_product_id
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit * 3); // Busca mais para filtrar depois

      if (error) throw error;

      // Processar os dados para contar a frequência dos produtos
      const productCount: { [key: string]: { product: any, count: number } } = {};
      
      data?.forEach(item => {
        if (item.list_item_products && item.list_item_products.length > 0) {
          const product = item.list_item_products[0].specific_products;
          if (product) {
            if (productCount[product.id]) {
              productCount[product.id].count++;
            } else {
              productCount[product.id] = {
                product,
                count: 1
              };
            }
          }
        }
      });

      // Ordenar por frequência e retornar os mais usados
      const sortedProducts = Object.values(productCount)
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)
        .map(item => item.product);

      return { data: sortedProducts, error: null };
    } catch (error) {
      console.error('Erro ao buscar produtos mais usados:', error);
      return { data: null, error };
    }
  },

  /**
   * Verifica se já existe um produto com o nome especificado
   */
  checkProductExists: async (name: string) => {
    try {
      // Busca o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Normalizar o nome para comparação (remover espaços e converter para minúsculo)
      const normalizedName = name.trim().toLowerCase();

      // Buscar produtos genéricos com nome similar
      const { data: genericProducts, error: genericError } = await supabase
        .from('generic_products')
        .select('id, name')
        .eq('user_id', user.id);

      if (genericError) throw genericError;

      // Verificar se algum produto genérico tem nome similar
      const genericExists = genericProducts?.some(product => 
        product.name.trim().toLowerCase() === normalizedName
      );

      if (genericExists) {
        return { exists: true, error: null };
      }

      // Buscar produtos específicos com nome similar
      const { data: specificProducts, error: specificError } = await supabase
        .from('specific_products')
        .select('id, name')
        .eq('user_id', user.id);

      if (specificError) throw specificError;

      // Verificar se algum produto específico tem nome similar
      const specificExists = specificProducts?.some(product => 
        product.name.trim().toLowerCase() === normalizedName
      );

      return { exists: specificExists || false, error: null };
    } catch (error) {
      console.error('Erro ao verificar se produto existe:', error);
      return { exists: false, error };
    }
  },

  /**
   * Busca produto específico por código de barras
   */
  getSpecificProductByBarcode: async (barcode: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('specific_products')
        .select(`
          *,
          generic_products (
            *,
            categories (
              id,
              name
            )
          )
        `)
        .eq('barcode', barcode)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return { data: data || null, error: null };
    } catch (error) {
      console.error('Erro ao buscar produto por código de barras:', error);
      return { data: null, error };
    }
  },

  /**
   * Busca produtos específicos que possuem código de barras
   */
  getScannedProducts: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('specific_products')
        .select(`
          *,
          generic_products (
            *,
            categories (
              id,
              name
            )
          )
        `)
        .not('barcode', 'is', null)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao buscar produtos escaneados:', error);
      return { data: null, error };
    }
  },

  /**
   * Busca produtos específicos criados manualmente (sem código de barras)
   */
  getManualProducts: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('specific_products')
        .select(`
          *,
          generic_products (
            *,
            categories (
              id,
              name
            )
          )
        `)
        .is('barcode', null)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao buscar produtos manuais:', error);
      return { data: null, error };
    }
  },

  /**
   * Busca o último preço registrado de um produto específico
   */
  getLastProductPrice: async (specificProductId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('price_history')
        .select(`
          *,
          stores (
            id,
            name,
            address
          )
        `)
        .eq('specific_product_id', specificProductId)
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return { data: data || null, error: null };
    } catch (error) {
      console.error('Erro ao buscar último preço do produto:', error);
      return { data: null, error };
    }
  },
};

// Função de fallback para nomes de categorias quando o relacionamento falha
export function getCategoryNameById(categoryId: string | null): string {
  if (!categoryId) return 'Sem categoria';
  
  // Mapeamento de IDs para nomes de categorias
  const categoryMapping: Record<string, string> = {
    '96a0a394-673e-4a6c-b0d5-3deab6e97748': 'Mercearia',
    '586594f6-24f5-43ec-a600-2bbce4e7ef06': 'Vegetais',
    'c038197e-5638-4247-b73e-c409e8681f65': 'Frutas',
    '476bb13f-5459-4908-ba39-875eca6eb4ce': 'Carnes',
    'cc6de4bd-139c-4322-bbcf-357d1f1c477e': 'Laticínios',
    '72da7af3-8ef1-4060-b20c-d3ff22cd53f1': 'Bebidas',
    '5d3ffa94-b92d-49c7-ba52-4a997837b122': 'Limpeza',
    '7a3f34d5-0e1c-4112-8619-42870a62876b': 'Higiene',
    '1a81f94e-89aa-4aaf-997d-0ec54c705943': 'Casa',
  };
  
  return categoryMapping[categoryId] || 'Outros';
}