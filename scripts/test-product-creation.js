const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://eajhacfvnifqfovifjyw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhamhhY2Z2bmlmcWZvdmlmanl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2OTc1MTAsImV4cCI6MjA2MjI3MzUxMH0.Ig6ZQo6G-UTSPHpSqUxDIcBY_hD9TpuR8uVZVZgkOAY';

// Crie um cliente Supabase com a chave anônima
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testProductCreation() {
  console.log('🧪 Testando criação de produto genérico...');
  
  try {
    // Simular dados de um produto genérico
    const testProduct = {
      name: 'Produto Teste',
      category_id: '96a0a394-673e-4a6c-b0d5-3deab6e97748', // ID da categoria Mercearia
      user_id: '0f1f22bd-406f-4719-810b-7d6d245b5559' // ID do usuário de teste
    };
    
    console.log('📝 Dados do produto de teste:', testProduct);
    
    // Tentar criar o produto genérico
    const { data, error } = await supabase
      .from('generic_products')
      .insert(testProduct)
      .select(`
        *,
        categories (
          id,
          name
        )
      `)
      .single();
    
    if (error) {
      console.error('❌ Erro ao criar produto genérico:', error);
      console.error('Detalhes do erro:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return;
    }
    
    if (data) {
      console.log('✅ Produto genérico criado com sucesso!');
      console.log('📊 Dados do produto criado:', {
        id: data.id,
        name: data.name,
        category_id: data.category_id,
        category_name: data.categories?.name || 'Categoria não encontrada',
        user_id: data.user_id
      });
      
      // Limpar o produto de teste
      console.log('🧹 Removendo produto de teste...');
      const { error: deleteError } = await supabase
        .from('generic_products')
        .delete()
        .eq('id', data.id);
      
      if (deleteError) {
        console.error('⚠️ Erro ao remover produto de teste:', deleteError);
      } else {
        console.log('✅ Produto de teste removido com sucesso');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

// Executar teste
testProductCreation();
