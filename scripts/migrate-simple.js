const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://bfgbfwkqfcmkdqvtcxvx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmZ2Jmd2txZmNta2RxdnRjeHZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTc2NzQ3NSwiZXhwIjoyMDUxMzQzNDc1fQ.wGWdEJXxJWqfkOFWXjOuOOyOHGxRJmzqMlPKdyqvLHU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  console.log('🔍 Testando conexão com Supabase...');
  
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro de conexão:', error);
      return false;
    }
    
    console.log('✅ Conexão com Supabase OK!');
    return true;
  } catch (error) {
    console.error('❌ Erro de rede:', error);
    return false;
  }
}

async function addCategoryColumn() {
  console.log('📝 Adicionando coluna category_id...');
  
  try {
    // Usar SQL direto via rpc
    const { data, error } = await supabase.rpc('sql', {
      query: 'ALTER TABLE public.generic_products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;'
    });
    
    if (error) {
      console.error('❌ Erro ao adicionar coluna:', error);
      return false;
    }
    
    console.log('✅ Coluna category_id adicionada!');
    return true;
  } catch (error) {
    console.error('❌ Erro:', error);
    return false;
  }
}

async function main() {
  const connected = await testConnection();
  if (!connected) {
    console.log('❌ Não foi possível conectar ao Supabase');
    return;
  }
  
  const columnAdded = await addCategoryColumn();
  if (columnAdded) {
    console.log('🎉 Migração básica concluída!');
    console.log('📋 Próximos passos:');
    console.log('   1. Verifique se a coluna foi criada');
    console.log('   2. Execute o resto da migração manualmente no Supabase Dashboard');
  }
}

main();
