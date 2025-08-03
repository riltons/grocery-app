const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://eajhacfvnifqfovifjyw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhamhhY2Z2bmlmcWZvdmlmanl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2OTc1MTAsImV4cCI6MjA2MjI3MzUxMH0.Ig6ZQo6G-UTSPHpSqUxDIcBY_hD9TpuR8uVZVZgkOAY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Mapeamento de categorias padrão
const defaultCategories = [
  { name: 'Frutas', icon: 'nutrition', color: '#FF9800' },
  { name: 'Vegetais', icon: 'leaf', color: '#4CAF50' },
  { name: 'Carnes', icon: 'restaurant', color: '#F44336' },
  { name: 'Laticínios', icon: 'water', color: '#2196F3' },
  { name: 'Padaria', icon: 'pizza', color: '#FFC107' },
  { name: 'Mercearia', icon: 'basket', color: '#9C27B0' },
  { name: 'Bebidas', icon: 'wine', color: '#3F51B5' },
  { name: 'Limpeza', icon: 'brush', color: '#795548' },
  { name: 'Higiene', icon: 'body', color: '#00BCD4' },
  { name: 'Pet', icon: 'paw', color: '#E91E63' },
  { name: 'Casa', icon: 'home', color: '#607D8B' },
  { name: 'Farmácia', icon: 'medkit', color: '#8BC34A' },
  { name: 'Outros', icon: 'help-buoy', color: '#9E9E9E' }
];

// Mapeamento de IDs específicos para categorias
// Estes são os IDs que estão sendo referenciados pelos produtos
const specificCategoryIds = {
  '96a0a394-673e-4a6c-b0d5-3deab6e97748': 'Mercearia', // ID usado por Arroz, Feijão
  '586594f6-24f5-43ec-a600-2bbce4e7ef06': 'Vegetais',  // ID usado por Cenoura
  // Adicione outros IDs conforme necessário
};

async function createMissingCategories() {
  console.log('🔧 Iniciando criação de categorias faltantes...');
  
  try {
    // Verificar categorias existentes
    const { data: existingCategories, error: checkError } = await supabase
      .from('categories')
      .select('id, name');
    
    if (checkError) {
      console.error('❌ Erro ao verificar categorias existentes:', checkError);
      return;
    }
    
    console.log(`📊 Encontradas ${existingCategories?.length || 0} categorias existentes`);
    
    // Criar categorias padrão
    console.log('📝 Criando categorias padrão...');
    
    for (const category of defaultCategories) {
      // Verificar se a categoria já existe
      const categoryExists = existingCategories?.some(c => c.name === category.name);
      
      if (!categoryExists) {
        // Criar a categoria
        const { data: newCategory, error: createError } = await supabase
          .from('categories')
          .insert({
            name: category.name,
            icon: category.icon,
            color: category.color
          })
          .select('id')
          .single();
        
        if (createError) {
          console.error(`❌ Erro ao criar categoria ${category.name}:`, createError);
        } else {
          console.log(`✅ Categoria ${category.name} criada com ID: ${newCategory.id}`);
        }
      } else {
        console.log(`✅ Categoria ${category.name} já existe`);
      }
    }
    
    // Criar categorias específicas com IDs específicos
    console.log('📝 Criando categorias com IDs específicos...');
    
    for (const [id, name] of Object.entries(specificCategoryIds)) {
      // Verificar se já existe uma categoria com este ID
      const categoryExists = existingCategories?.some(c => c.id === id);
      
      if (!categoryExists) {
        // Encontrar a categoria padrão correspondente
        const defaultCategory = defaultCategories.find(c => c.name === name);
        
        if (!defaultCategory) {
          console.log(`⚠️ Categoria padrão ${name} não encontrada para ID ${id}`);
          continue;
        }
        
        // Criar a categoria com ID específico
        const { error: createError } = await supabase
          .from('categories')
          .insert({
            id: id,
            name: name,
            icon: defaultCategory.icon,
            color: defaultCategory.color
          });
        
        if (createError) {
          console.error(`❌ Erro ao criar categoria ${name} com ID ${id}:`, createError);
        } else {
          console.log(`✅ Categoria ${name} criada com ID específico: ${id}`);
        }
      } else {
        console.log(`✅ Categoria com ID ${id} já existe`);
      }
    }
    
    // Verificar produtos com category_id inválido
    console.log('🔍 Verificando produtos com category_id inválido...');
    
    const { data: products, error: productsError } = await supabase
      .from('generic_products')
      .select('id, name, category_id')
      .not('category_id', 'is', null);
    
    if (productsError) {
      console.error('❌ Erro ao buscar produtos:', productsError);
      return;
    }
    
    console.log(`📊 Encontrados ${products.length} produtos com category_id`);
    
    // Verificar categorias novamente após criação
    const { data: updatedCategories, error: updatedError } = await supabase
      .from('categories')
      .select('id, name');
    
    if (updatedError) {
      console.error('❌ Erro ao verificar categorias atualizadas:', updatedError);
      return;
    }
    
    // Para cada produto, verificar se a categoria existe
    let invalidCount = 0;
    for (const product of products) {
      const categoryExists = updatedCategories?.some(c => c.id === product.category_id);
      
      if (!categoryExists) {
        invalidCount++;
        console.log(`⚠️ Produto ${product.name} tem category_id inválido: ${product.category_id}`);
        
        // Tentar encontrar uma categoria apropriada
        let newCategoryName = 'Outros';
        
        // Lógica simples de mapeamento baseada no nome do produto
        if (product.name.match(/arroz|feijão|açúcar|sal|farinha|macarrão/i)) {
          newCategoryName = 'Mercearia';
        } else if (product.name.match(/maçã|banana|laranja|uva|abacaxi|fruta/i)) {
          newCategoryName = 'Frutas';
        } else if (product.name.match(/cenoura|batata|alface|tomate|legume|verdura/i)) {
          newCategoryName = 'Vegetais';
        } else if (product.name.match(/carne|frango|peixe|boi|porco/i)) {
          newCategoryName = 'Carnes';
        } else if (product.name.match(/leite|queijo|iogurte|manteiga/i)) {
          newCategoryName = 'Laticínios';
        }
        
        // Buscar a categoria pelo nome
        const newCategory = updatedCategories?.find(c => c.name === newCategoryName);
        
        if (newCategory) {
          // Atualizar o produto com a nova categoria
          const { error: updateError } = await supabase
            .from('generic_products')
            .update({ category_id: newCategory.id })
            .eq('id', product.id);
          
          if (updateError) {
            console.error(`❌ Erro ao atualizar produto ${product.name}:`, updateError);
          } else {
            console.log(`✅ Produto ${product.name} atualizado para categoria ${newCategoryName}`);
          }
        }
      }
    }
    
    console.log(`📊 Encontrados ${invalidCount} produtos com category_id inválido`);
    
    // Verificar se a migração foi bem-sucedida
    console.log('🔍 Verificando resultado da migração...');
    
    const { data: finalProducts, error: finalError } = await supabase
      .from('generic_products')
      .select('id, name, category_id, categories(id, name)')
      .limit(5);
    
    if (finalError) {
      console.error('❌ Erro ao verificar produtos finais:', finalError);
    } else {
      console.log('📊 Amostra de produtos após migração:');
      finalProducts.forEach(product => {
        console.log(`- ${product.name}: ${product.categories?.name || 'Sem categoria'} (${product.category_id})`);
      });
    }
    
    console.log('🎉 Criação de categorias concluída!');
    
  } catch (error) {
    console.error('❌ Erro geral na correção:', error);
  }
}

// Executar correção
createMissingCategories();
