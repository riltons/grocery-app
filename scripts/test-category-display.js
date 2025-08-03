const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://eajhacfvnifqfovifjyw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhamhhY2Z2bmlmcWZvdmlmanl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2OTc1MTAsImV4cCI6MjA2MjI3MzUxMH0.Ig6ZQo6G-UTSPHpSqUxDIcBY_hD9TpuR8uVZVZgkOAY';

// Crie um cliente Supabase com a chave anônima
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Mapeamento de IDs específicos para categorias
const categoryMapping = {
  '96a0a394-673e-4a6c-b0d5-3deab6e97748': 'Mercearia',  // Arroz, Feijão, etc.
  '586594f6-24f5-43ec-a600-2bbce4e7ef06': 'Vegetais',   // Cenoura, Alface, etc.
  'c038197e-5638-4247-b73e-c409e8681f65': 'Frutas',     // Uva, Mamão, etc.
  '476bb13f-5459-4908-ba39-875eca6eb4ce': 'Carnes',     // Presunto, Linguiça, etc.
  'cc6de4bd-139c-4322-bbcf-357d1f1c477e': 'Laticínios', // Manteiga, Iogurte, etc.
  '72da7af3-8ef1-4060-b20c-d3ff22cd53f1': 'Bebidas',    // Chá, Café, etc.
  '5d3ffa94-b92d-49c7-ba52-4a997837b122': 'Limpeza',    // Papel Toalha, Desinfetante, etc.
  '7a3f34d5-0e1c-4112-8619-42870a62876b': 'Higiene',    // Desodorante, Papel Higiênico, etc.
  '1a81f94e-89aa-4aaf-997d-0ec54c705943': 'Casa',       // Vela, Fósforo, etc.
};

// Função de fallback para nomes de categorias
function getCategoryNameById(categoryId) {
  if (!categoryId) return 'Sem categoria';
  return categoryMapping[categoryId] || 'Outros';
}

async function testCategoryDisplay() {
  console.log('🔍 Testando exibição de categorias...');
  
  try {
    // Buscar produtos genéricos
    console.log('📊 Buscando produtos genéricos...');
    const { data: genericProducts, error: genericError } = await supabase
      .from('generic_products')
      .select('id, name, category_id, categories(id, name)')
      .limit(10);
    
    if (genericError) {
      console.error('❌ Erro ao buscar produtos genéricos:', genericError);
      return;
    }
    
    console.log(`📊 Encontrados ${genericProducts.length} produtos genéricos`);
    
    // Exibir produtos com categorias
    console.log('\n📋 Produtos com categorias (usando fallback se necessário):');
    genericProducts.forEach(product => {
      const categoryName = product.categories?.name || getCategoryNameById(product.category_id);
      console.log(`- ${product.name}: ${categoryName} (${product.category_id})`);
    });
    
    // Verificar distribuição de categorias
    console.log('\n📊 Distribuição de categorias:');
    const categoryDistribution = {};
    
    genericProducts.forEach(product => {
      const categoryName = product.categories?.name || getCategoryNameById(product.category_id);
      categoryDistribution[categoryName] = (categoryDistribution[categoryName] || 0) + 1;
    });
    
    Object.entries(categoryDistribution)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        console.log(`- ${category}: ${count} produtos`);
      });
    
    console.log('\n🎉 Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

// Executar teste
testCategoryDisplay();
