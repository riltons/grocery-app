/**
 * Script para unificar categorias duplicadas
 * Execute com: node scripts/unify-categories.js
 */

const { CategoryUnificationService } = require('../lib/unify-categories');

async function main() {
  console.log('🚀 Iniciando unificação de categorias...\n');
  
  try {
    // Primeiro executar em modo simulação
    console.log('=== MODO SIMULAÇÃO ===');
    await CategoryUnificationService.cleanupCategories(true);
    
    console.log('\n' + '='.repeat(50));
    console.log('Deseja executar a unificação real? (y/N)');
    
    // Em um ambiente real, você poderia usar readline para confirmação
    // Por enquanto, descomente a linha abaixo para executar
    // await CategoryUnificationService.cleanupCategories(false);
    
    console.log('\n✅ Script concluído!');
    console.log('💡 Para executar de verdade, descomente a linha no script');
    
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}