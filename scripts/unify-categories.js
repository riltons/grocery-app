/**
 * Script para unificar categorias duplicadas
 * Execute com: node scripts/unify-categories.js
 */

const readline = require('readline');
const { 
  CategoryUnificationService, 
  generateCategoryReport, 
  verifyCategoryIntegrity 
} = require('../lib/unify-categories');

// Interface para input do usuário
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  console.log('🚀 Script de Unificação de Categorias\n');
  
  try {
    // Menu de opções
    console.log('Escolha uma opção:');
    console.log('1. Gerar relatório detalhado');
    console.log('2. Executar simulação completa');
    console.log('3. Executar unificação real');
    console.log('4. Verificar integridade');
    console.log('5. Executar tudo (relatório + simulação + confirmação)');
    
    const choice = await askQuestion('\nDigite sua escolha (1-5): ');
    
    switch (choice.trim()) {
      case '1':
        console.log('\n=== RELATÓRIO DETALHADO ===');
        await generateCategoryReport();
        break;
        
      case '2':
        console.log('\n=== SIMULAÇÃO COMPLETA ===');
        await CategoryUnificationService.cleanupCategories(true);
        break;
        
      case '3':
        console.log('\n⚠️  ATENÇÃO: Esta operação irá modificar o banco de dados!');
        const confirmReal = await askQuestion('Tem certeza? Digite "CONFIRMO" para continuar: ');
        
        if (confirmReal.trim() === 'CONFIRMO') {
          console.log('\n=== EXECUÇÃO REAL ===');
          await CategoryUnificationService.cleanupCategories(false);
        } else {
          console.log('❌ Operação cancelada');
        }
        break;
        
      case '4':
        console.log('\n=== VERIFICAÇÃO DE INTEGRIDADE ===');
        await verifyCategoryIntegrity();
        break;
        
      case '5':
        // Fluxo completo
        console.log('\n=== 1/4: RELATÓRIO DETALHADO ===');
        await generateCategoryReport();
        
        console.log('\n=== 2/4: SIMULAÇÃO COMPLETA ===');
        await CategoryUnificationService.cleanupCategories(true);
        
        console.log('\n=== 3/4: CONFIRMAÇÃO ===');
        const confirmFull = await askQuestion('Deseja executar a unificação real? (y/N): ');
        
        if (confirmFull.toLowerCase() === 'y' || confirmFull.toLowerCase() === 'yes') {
          console.log('\n=== 4/4: EXECUÇÃO REAL ===');
          await CategoryUnificationService.cleanupCategories(false);
        } else {
          console.log('✅ Simulação concluída. Execução real cancelada.');
        }
        break;
        
      default:
        console.log('❌ Opção inválida');
        break;
    }
    
    console.log('\n✅ Script concluído!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  main();
}