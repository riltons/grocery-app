const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase (usando as credenciais do arquivo de anotações)
const supabaseUrl = 'https://eajhacfvnifqfovifjyw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhamhhY2Z2bmlmcWZvdmlmanl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2OTc1MTAsImV4cCI6MjA2MjI3MzUxMH0.Ig6ZQo6G-UTSPHpSqUxDIcBY_hD9TpuR8uVZVZgkOAY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixCategoryMigration() {
  console.log('🔧 Iniciando correção da migração de categorias...');
  
  try {
    // Verificar se a coluna category_id existe
    console.log('🔍 Verificando estrutura da tabela generic_products...');
    
    // Tentar buscar produtos com category_id
    const { data: products, error } = await supabase
      .from('generic_products')
      .select('id, name, category_id, categories(name)')
      .limit(5);
    
    if (error && error.message.includes('column "category_id" does not exist')) {
      console.log('❌ Coluna category_id não encontrada, adicionando...');
      
      // Adicionar a coluna category_id
      const { error: alterError } = await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE public.generic_products 
          ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;
        `
      });
      
      if (alterError) {
        console.error('❌ Erro ao adicionar coluna category_id:', alterError);
        return;
      }
      
      console.log('✅ Coluna category_id adicionada com sucesso!');
    } else if (error) {
      console.error('❌ Erro ao verificar produtos:', error);
      return;
    } else {
      console.log('✅ Coluna category_id já existe na tabela');
      
      // Verificar se há produtos sem categoria
      const { data: productsWithoutCategory, error: countError } = await supabase
        .from('generic_products')
        .select('count()', { count: 'exact' })
        .not('category_id', 'is', null);
      
      if (!countError && productsWithoutCategory && productsWithoutCategory.length > 0) {
        console.log(`📊 Produtos com categoria: ${productsWithoutCategory[0].count}`);
      }
    }
    
    // Criar índice se não existir
    console.log('📝 Criando índice para category_id...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_generic_products_category_id 
        ON public.generic_products(category_id);
      `
    });
    
    if (indexError) {
      console.log('⚠️ Aviso ao criar índice:', indexError.message);
    } else {
      console.log('✅ Índice criado com sucesso!');
    }
    
    console.log('🎉 Correção concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro geral na correção:', error);
  }
}

// Executar correção
fixCategoryMigration();
