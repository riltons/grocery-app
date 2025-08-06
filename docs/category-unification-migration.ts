/**
 * Migração para unificar categorias duplicadas via Supabase MCP
 * Este arquivo pode ser usado para executar a unificação diretamente no Supabase
 */

import { executeCategoryMigration } from '../lib/unify-categories';

/**
 * Executa a migração de unificação de categorias
 * @param projectId - ID do projeto Supabase
 * @param dryRun - Se true, apenas simula a operação
 */
export async function runCategoryUnificationMigration(
  projectId: string, 
  dryRun: boolean = true
) {
  console.log('🚀 Iniciando migração de unificação de categorias...');
  console.log(`📡 Projeto: ${projectId}`);
  console.log(`🧪 Modo: ${dryRun ? 'SIMULAÇÃO' : 'EXECUÇÃO REAL'}`);
  
  try {
    const results = await executeCategoryMigration(projectId, dryRun);
    
    console.log('\n✅ Migração concluída com sucesso!');
    console.log('📊 Resultados:');
    console.log(`  - Categorias unificadas: ${results.unified.length}`);
    console.log(`  - Categorias órfãs removidas: ${results.orphans.length}`);
    
    if (dryRun) {
      console.log('\n💡 Para executar de verdade, chame com dryRun: false');
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    throw error;
  }
}

/**
 * Script de exemplo para executar via Supabase MCP
 */
export const MIGRATION_EXAMPLE = `
// Exemplo de uso via Supabase MCP:

import { runCategoryUnificationMigration } from './docs/category-unification-migration';

// 1. Primeiro executar simulação
await runCategoryUnificationMigration('seu-project-id', true);

// 2. Depois executar de verdade (se estiver satisfeito com a simulação)
await runCategoryUnificationMigration('seu-project-id', false);
`;

/**
 * SQL equivalente para execução direta no Supabase
 * (caso prefira executar SQL diretamente)
 */
export const EQUIVALENT_SQL = `
-- Este SQL é equivalente à migração TypeScript
-- Execute apenas se não puder usar o script TypeScript

-- 1. Primeiro, veja as duplicatas:
SELECT 
  LOWER(TRIM(name)) as normalized_name,
  COUNT(*) as category_count,
  STRING_AGG(name, ', ') as variations,
  STRING_AGG(id::text, ', ') as category_ids
FROM categories 
GROUP BY LOWER(TRIM(name))
HAVING COUNT(*) > 1
ORDER BY category_count DESC;

-- 2. Para executar a unificação, use o script completo em:
-- docs/unify-duplicate-categories.sql
`;

// Exportar função principal para uso direto
export default runCategoryUnificationMigration;