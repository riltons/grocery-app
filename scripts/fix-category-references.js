const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

async function fixCategoryReferences() {
  console.log('🔧 Iniciando correção de referências a categorias...');
  
  try {
    // Modificar lib/products.ts para adicionar fallback de categorias
    const productsPath = path.join(process.cwd(), 'lib', 'products.ts');
    if (fs.existsSync(productsPath)) {
      console.log('📝 Modificando lib/products.ts...');
      
      let productsContent = fs.readFileSync(productsPath, 'utf8');
      
      // Adicionar função de fallback para categorias
      if (!productsContent.includes('getCategoryNameById')) {
        const categoryFallbackFunction = `
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
}`;
        
        // Adicionar a função ao final do arquivo
        productsContent += '\n' + categoryFallbackFunction;
        
        // Salvar o arquivo modificado
        fs.writeFileSync(productsPath, productsContent);
        console.log('✅ Função de fallback adicionada a lib/products.ts');
      } else {
        console.log('✅ Função de fallback já existe em lib/products.ts');
      }
      
      // Modificar as consultas para usar o fallback
      const modifiedQueries = productsContent.replace(
        /categories\(id, name\)/g,
        'categories(id, name), category_id'
      );
      
      if (modifiedQueries !== productsContent) {
        fs.writeFileSync(productsPath, modifiedQueries);
        console.log('✅ Consultas modificadas para incluir category_id explicitamente');
      }
    } else {
      console.log('❌ Arquivo lib/products.ts não encontrado');
    }
    
    // Modificar lib/lists.ts para usar o fallback de categorias
    const listsPath = path.join(process.cwd(), 'lib', 'lists.ts');
    if (fs.existsSync(listsPath)) {
      console.log('📝 Modificando lib/lists.ts...');
      
      let listsContent = fs.readFileSync(listsPath, 'utf8');
      
      // Adicionar import da função de fallback
      if (!listsContent.includes('getCategoryNameById')) {
        listsContent = listsContent.replace(
          /import {([^}]*)}/,
          'import {$1, getCategoryNameById}'
        );
        
        // Modificar o processamento de itens para usar o fallback
        listsContent = listsContent.replace(
          /categories\?.name \|\| ''/g,
          'categories?.name || getCategoryNameById(category_id) || ""'
        );
        
        // Salvar o arquivo modificado
        fs.writeFileSync(listsPath, listsContent);
        console.log('✅ lib/lists.ts modificado para usar fallback de categorias');
      } else {
        console.log('✅ lib/lists.ts já usa fallback de categorias');
      }
    } else {
      console.log('❌ Arquivo lib/lists.ts não encontrado');
    }
    
    // Modificar app/product/index.tsx para usar o fallback de categorias
    const productIndexPath = path.join(process.cwd(), 'app', 'product', 'index.tsx');
    if (fs.existsSync(productIndexPath)) {
      console.log('📝 Modificando app/product/index.tsx...');
      
      let productIndexContent = fs.readFileSync(productIndexPath, 'utf8');
      
      // Adicionar import da função de fallback
      if (!productIndexContent.includes('getCategoryNameById')) {
        productIndexContent = productIndexContent.replace(
          /import {([^}]*)}/,
          'import {$1, getCategoryNameById}'
        );
        
        // Modificar a renderização de produtos para usar o fallback
        productIndexContent = productIndexContent.replace(
          /product\.categories\?.name/g,
          'product.categories?.name || getCategoryNameById(product.category_id)'
        );
        
        // Salvar o arquivo modificado
        fs.writeFileSync(productIndexPath, productIndexContent);
        console.log('✅ app/product/index.tsx modificado para usar fallback de categorias');
      } else {
        console.log('✅ app/product/index.tsx já usa fallback de categorias');
      }
    } else {
      console.log('❌ Arquivo app/product/index.tsx não encontrado');
    }
    
    // Modificar app/product/edit/[id].tsx para usar o fallback de categorias
    const productEditPath = path.join(process.cwd(), 'app', 'product', 'edit', '[id].tsx');
    if (fs.existsSync(productEditPath)) {
      console.log('📝 Modificando app/product/edit/[id].tsx...');
      
      let productEditContent = fs.readFileSync(productEditPath, 'utf8');
      
      // Adicionar import da função de fallback
      if (!productEditContent.includes('getCategoryNameById')) {
        productEditContent = productEditContent.replace(
          /import {([^}]*)}/,
          'import {$1, getCategoryNameById}'
        );
        
        // Modificar a renderização de produtos para usar o fallback
        productEditContent = productEditContent.replace(
          /product\.categories\?.name/g,
          'product.categories?.name || getCategoryNameById(product.category_id)'
        );
        
        // Salvar o arquivo modificado
        fs.writeFileSync(productEditPath, productEditContent);
        console.log('✅ app/product/edit/[id].tsx modificado para usar fallback de categorias');
      } else {
        console.log('✅ app/product/edit/[id].tsx já usa fallback de categorias');
      }
    } else {
      console.log('❌ Arquivo app/product/edit/[id].tsx não encontrado');
    }
    
    // Modificar app/list/[id].tsx para usar o fallback de categorias
    const listDetailPath = path.join(process.cwd(), 'app', 'list', '[id].tsx');
    if (fs.existsSync(listDetailPath)) {
      console.log('📝 Modificando app/list/[id].tsx...');
      
      let listDetailContent = fs.readFileSync(listDetailPath, 'utf8');
      
      // Adicionar import da função de fallback
      if (!listDetailContent.includes('getCategoryNameById')) {
        listDetailContent = listDetailContent.replace(
          /import {([^}]*)}/,
          'import {$1, getCategoryNameById}'
        );
        
        // Modificar o processamento de itens para usar o fallback
        listDetailContent = listDetailContent.replace(
          /item\.category/g,
          '(item.category || getCategoryNameById(item.category_id))'
        );
        
        // Salvar o arquivo modificado
        fs.writeFileSync(listDetailPath, listDetailContent);
        console.log('✅ app/list/[id].tsx modificado para usar fallback de categorias');
      } else {
        console.log('✅ app/list/[id].tsx já usa fallback de categorias');
      }
    } else {
      console.log('❌ Arquivo app/list/[id].tsx não encontrado');
    }
    
    console.log('🎉 Correção de referências a categorias concluída!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Reinicie o servidor da aplicação');
    console.log('2. Verifique se os produtos estão exibindo as categorias corretamente');
    console.log('3. Se necessário, atualize o banco de dados via Supabase Dashboard');
    
  } catch (error) {
    console.error('❌ Erro geral na correção:', error);
  }
}

// Executar correção
fixCategoryReferences();
