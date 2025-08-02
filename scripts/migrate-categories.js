const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://bfgbfwkqfcmkdqvtcxvx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmZ2Jmd2txZmNta2RxdnRjeHZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTc2NzQ3NSwiZXhwIjoyMDUxMzQzNDc1fQ.wGWdEJXxJWqfkOFWXjOuOOyOHGxRJmzqMlPKdyqvLHU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateCategoriestoForeignKeys() {
  console.log('🚀 Iniciando migração de categorias...');
  
  try {
    // Passo 1: Adicionar coluna category_id
    console.log('📝 Passo 1: Adicionando coluna category_id...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.generic_products 
        ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;
      `
    });
    
    if (alterError && !alterError.message.includes('already exists')) {
      console.error('❌ Erro ao adicionar coluna:', alterError);
      return;
    }
    
    console.log('✅ Coluna category_id adicionada com sucesso!');
    
    // Passo 2: Buscar produtos genéricos com categoria
    console.log('📝 Passo 2: Buscando produtos genéricos com categoria...');
    const { data: products, error: selectError } = await supabase
      .from('generic_products')
      .select('id, category, user_id')
      .not('category', 'is', null)
      .neq('category', '');
    
    if (selectError) {
      console.error('❌ Erro ao buscar produtos:', selectError);
      return;
    }
    
    console.log(`📊 Encontrados ${products?.length || 0} produtos com categoria`);
    
    // Passo 3: Migrar cada produto
    for (const product of products || []) {
      console.log(`🔄 Migrando produto ${product.id} com categoria "${product.category}"`);
      
      // Verificar se categoria já existe
      let { data: existingCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('name', product.category)
        .eq('user_id', product.user_id)
        .single();
      
      let categoryId;
      
      if (!existingCategory) {
        // Criar nova categoria
        const { data: newCategory, error: createError } = await supabase
          .from('categories')
          .insert({
            name: product.category,
            user_id: product.user_id,
            icon: 'basket',
            color: '#4CAF50'
          })
          .select('id')
          .single();
        
        if (createError) {
          console.error(`❌ Erro ao criar categoria "${product.category}":`, createError);
          continue;
        }
        
        categoryId = newCategory.id;
        console.log(`✅ Categoria "${product.category}" criada com ID: ${categoryId}`);
      } else {
        categoryId = existingCategory.id;
        console.log(`✅ Categoria "${product.category}" já existe com ID: ${categoryId}`);
      }
      
      // Atualizar produto com category_id
      const { error: updateError } = await supabase
        .from('generic_products')
        .update({ category_id: categoryId })
        .eq('id', product.id);
      
      if (updateError) {
        console.error(`❌ Erro ao atualizar produto ${product.id}:`, updateError);
      } else {
        console.log(`✅ Produto ${product.id} vinculado à categoria ${categoryId}`);
      }
    }
    
    // Passo 4: Criar índice
    console.log('📝 Passo 4: Criando índice...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_generic_products_category_id 
        ON public.generic_products(category_id);
      `
    });
    
    if (indexError) {
      console.log('⚠️ Aviso ao criar índice (pode já existir):', indexError.message);
    } else {
      console.log('✅ Índice criado com sucesso!');
    }
    
    console.log('🎉 Migração concluída com sucesso!');
    console.log('📋 Resumo:');
    console.log(`   - Produtos migrados: ${products?.length || 0}`);
    console.log('   - Coluna category_id adicionada');
    console.log('   - Índice criado');
    console.log('');
    console.log('⚠️ IMPORTANTE: Após verificar que tudo está funcionando,');
    console.log('   você pode remover a coluna "category" antiga executando:');
    console.log('   ALTER TABLE public.generic_products DROP COLUMN category;');
    
  } catch (error) {
    console.error('❌ Erro geral na migração:', error);
  }
}

// Executar migração
migrateCategoriestoForeignKeys();
