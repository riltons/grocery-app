import { supabase } from './supabase';

/**
 * Script para unificar categorias duplicadas no banco de dados
 * Este script identifica e unifica categorias similares de forma segura
 */

interface CategoryMapping {
  keepName: string;
  variations: string[];
  icon?: string;
  color?: string;
}

// Mapeamentos de categorias para unificar
const CATEGORY_MAPPINGS: CategoryMapping[] = [
  {
    keepName: 'Bebidas',
    variations: ['bebida', 'bebidas'],
    icon: 'wine-outline',
    color: '#2196F3'
  },
  {
    keepName: 'Limpeza',
    variations: ['limpeza', 'produtos de limpeza', 'limpeza domestica', 'limpeza doméstica'],
    icon: 'sparkles-outline',
    color: '#00BCD4'
  },
  {
    keepName: 'Higiene',
    variations: ['higiene', 'higiene pessoal', 'produtos de higiene'],
    icon: 'medical-outline',
    color: '#4CAF50'
  },
  {
    keepName: 'Carnes',
    variations: ['carne', 'carnes', 'proteinas', 'proteína'],
    icon: 'restaurant-outline',
    color: '#F44336'
  },
  {
    keepName: 'Frutas',
    variations: ['fruta', 'frutas'],
    icon: 'leaf-outline',
    color: '#FF9800'
  },
  {
    keepName: 'Verduras',
    variations: ['verdura', 'verduras', 'legumes', 'vegetais'],
    icon: 'nutrition-outline',
    color: '#4CAF50'
  },
  {
    keepName: 'Doces',
    variations: ['doce', 'doces', 'sobremesa', 'sobremesas'],
    icon: 'ice-cream-outline',
    color: '#E91E63'
  },
  {
    keepName: 'Temperos',
    variations: ['tempero', 'temperos', 'condimento', 'condimentos'],
    icon: 'flower-outline',
    color: '#795548'
  },
  {
    keepName: 'Grãos',
    variations: ['graos', 'grãos', 'cereais', 'cereal'],
    icon: 'ellipse-outline',
    color: '#FF9800'
  },
  {
    keepName: 'Laticínios',
    variations: ['laticinios', 'laticínios', 'derivados do leite'],
    icon: 'water-outline',
    color: '#2196F3'
  },
  {
    keepName: 'Padaria',
    variations: ['padaria', 'paes', 'pães', 'panificados'],
    icon: 'cafe-outline',
    color: '#FF9800'
  },
  {
    keepName: 'Congelados',
    variations: ['congelado', 'congelados', 'frozen'],
    icon: 'snow-outline',
    color: '#00BCD4'
  },
  {
    keepName: 'Pet',
    variations: ['pet', 'animais', 'animal de estimação'],
    icon: 'paw-outline',
    color: '#9C27B0'
  },
  {
    keepName: 'Bebê',
    variations: ['bebe', 'bebê', 'infantil', 'criança'],
    icon: 'happy-outline',
    color: '#E91E63'
  }
];

export class CategoryUnificationService {
  
  /**
   * Analisa categorias duplicadas no banco de dados
   */
  static async analyzeDuplicateCategories() {
    try {
      console.log('🔍 Analisando categorias duplicadas...');
      
      const { data: categories, error } = await supabase
        .from('categories')
        .select('id, name, icon, color, created_at')
        .order('name');
      
      if (error) {
        throw error;
      }
      
      const duplicates: { [key: string]: any[] } = {};
      
      // Agrupar categorias similares
      for (const mapping of CATEGORY_MAPPINGS) {
        const similarCategories = categories?.filter(cat => 
          mapping.variations.some(variation => 
            cat.name.toLowerCase().trim() === variation.toLowerCase()
          )
        ) || [];
        
        if (similarCategories.length > 1) {
          duplicates[mapping.keepName] = similarCategories;
        }
      }
      
      console.log('📊 Categorias duplicadas encontradas:');
      for (const [keepName, cats] of Object.entries(duplicates)) {
        console.log(`  ${keepName}: ${cats.map(c => c.name).join(', ')}`);
      }
      
      return duplicates;
      
    } catch (error) {
      console.error('❌ Erro ao analisar categorias:', error);
      throw error;
    }
  }
  
  /**
   * Unifica categorias duplicadas
   */
  static async unifyDuplicateCategories(dryRun: boolean = true) {
    try {
      console.log(`${dryRun ? '🧪 SIMULAÇÃO' : '🔧 EXECUTANDO'} unificação de categorias...`);
      
      const duplicates = await this.analyzeDuplicateCategories();
      const results: any[] = [];
      
      for (const mapping of CATEGORY_MAPPINGS) {
        const similarCategories = await this.findSimilarCategories(mapping.variations);
        
        if (similarCategories.length <= 1) {
          continue; // Não há duplicatas para esta categoria
        }
        
        // Encontrar categoria principal (mais antiga ou com mais produtos)
        const keepCategory = await this.selectPrimaryCategory(similarCategories, mapping.keepName);
        const removeCategories = similarCategories.filter(cat => cat.id !== keepCategory.id);
        
        if (removeCategories.length === 0) {
          continue;
        }
        
        console.log(`📝 ${mapping.keepName}:`);
        console.log(`  Manter: ${keepCategory.name} (${keepCategory.id})`);
        console.log(`  Remover: ${removeCategories.map(c => c.name).join(', ')}`);
        
        if (!dryRun) {
          // Atualizar produtos genéricos
          const removeIds = removeCategories.map(c => c.id);
          
          const { error: updateError } = await supabase
            .from('generic_products')
            .update({ category_id: keepCategory.id })
            .in('category_id', removeIds);
          
          if (updateError) {
            console.error(`❌ Erro ao atualizar produtos da categoria ${mapping.keepName}:`, updateError);
            continue;
          }
          
          // Atualizar categoria principal com ícone e cor padrão se necessário
          if (mapping.icon && mapping.color) {
            await supabase
              .from('categories')
              .update({ 
                icon: mapping.icon, 
                color: mapping.color,
                name: mapping.keepName // Padronizar nome
              })
              .eq('id', keepCategory.id);
          }
          
          // Remover categorias duplicadas
          const { error: deleteError } = await supabase
            .from('categories')
            .delete()
            .in('id', removeIds);
          
          if (deleteError) {
            console.error(`❌ Erro ao remover categorias duplicadas de ${mapping.keepName}:`, deleteError);
            continue;
          }
          
          console.log(`✅ ${mapping.keepName}: ${removeCategories.length} categorias unificadas`);
        }
        
        results.push({
          category: mapping.keepName,
          kept: keepCategory,
          removed: removeCategories,
          success: !dryRun
        });
      }
      
      if (dryRun) {
        console.log('\n🧪 Esta foi uma simulação. Para executar de verdade, use unifyDuplicateCategories(false)');
      } else {
        console.log('\n✅ Unificação de categorias concluída!');
      }
      
      return results;
      
    } catch (error) {
      console.error('❌ Erro na unificação de categorias:', error);
      throw error;
    }
  }
  
  /**
   * Encontra categorias similares baseado nas variações
   */
  private static async findSimilarCategories(variations: string[]) {
    const { data: categories, error } = await supabase
      .from('categories')
      .select(`
        id, 
        name, 
        icon, 
        color, 
        created_at,
        generic_products!inner(id)
      `)
      .order('created_at');
    
    if (error) {
      throw error;
    }
    
    return categories?.filter(cat => 
      variations.some(variation => 
        cat.name.toLowerCase().trim() === variation.toLowerCase()
      )
    ) || [];
  }
  
  /**
   * Seleciona a categoria principal para manter
   */
  private static async selectPrimaryCategory(categories: any[], preferredName: string) {
    // Prioridade: nome preferido > mais produtos > mais antiga
    
    // 1. Tentar encontrar categoria com nome preferido
    const preferred = categories.find(cat => 
      cat.name.toLowerCase() === preferredName.toLowerCase()
    );
    
    if (preferred) {
      return preferred;
    }
    
    // 2. Contar produtos para cada categoria
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const { count } = await supabase
          .from('generic_products')
          .select('id', { count: 'exact' })
          .eq('category_id', cat.id);
        
        return { ...cat, productCount: count || 0 };
      })
    );
    
    // 3. Ordenar por: mais produtos > mais antiga
    categoriesWithCount.sort((a, b) => {
      if (a.productCount !== b.productCount) {
        return b.productCount - a.productCount; // Mais produtos primeiro
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); // Mais antiga primeiro
    });
    
    return categoriesWithCount[0];
  }
  
  /**
   * Remove categorias órfãs (sem produtos)
   */
  static async removeOrphanCategories(dryRun: boolean = true) {
    try {
      console.log(`${dryRun ? '🧪 SIMULAÇÃO' : '🔧 EXECUTANDO'} remoção de categorias órfãs...`);
      
      const { data: orphanCategories, error } = await supabase
        .from('categories')
        .select(`
          id, 
          name,
          generic_products!left(id)
        `)
        .is('generic_products.id', null);
      
      if (error) {
        throw error;
      }
      
      if (!orphanCategories || orphanCategories.length === 0) {
        console.log('✅ Nenhuma categoria órfã encontrada');
        return [];
      }
      
      console.log(`📋 Categorias órfãs encontradas: ${orphanCategories.map(c => c.name).join(', ')}`);
      
      if (!dryRun) {
        const orphanIds = orphanCategories.map(c => c.id);
        
        const { error: deleteError } = await supabase
          .from('categories')
          .delete()
          .in('id', orphanIds);
        
        if (deleteError) {
          throw deleteError;
        }
        
        console.log(`✅ ${orphanCategories.length} categorias órfãs removidas`);
      }
      
      return orphanCategories;
      
    } catch (error) {
      console.error('❌ Erro ao remover categorias órfãs:', error);
      throw error;
    }
  }
  
  /**
   * Executa limpeza completa das categorias
   */
  static async cleanupCategories(dryRun: boolean = true) {
    console.log('🧹 Iniciando limpeza completa de categorias...\n');
    
    try {
      // 1. Unificar duplicatas
      const unificationResults = await this.unifyDuplicateCategories(dryRun);
      
      // 2. Remover órfãs
      const orphanResults = await this.removeOrphanCategories(dryRun);
      
      console.log('\n📊 Resumo da limpeza:');
      console.log(`  Categorias unificadas: ${unificationResults.length}`);
      console.log(`  Categorias órfãs: ${orphanResults.length}`);
      
      if (dryRun) {
        console.log('\n🧪 Para executar de verdade, use cleanupCategories(false)');
      }
      
      return {
        unified: unificationResults,
        orphans: orphanResults
      };
      
    } catch (error) {
      console.error('❌ Erro na limpeza de categorias:', error);
      throw error;
    }
  }
}

// Função de conveniência para executar no console
export const unifyCategories = (dryRun: boolean = true) => {
  return CategoryUnificationService.cleanupCategories(dryRun);
};