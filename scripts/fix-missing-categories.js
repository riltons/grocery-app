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

async function fixMissingCategories() {
  console.log('🔧 Iniciando correção de categorias faltantes...');
  
  try {
    // Obter o user_id do primeiro usuário (para criar categorias padrão)
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (userError || !users || users.length === 0) {
      console.error('❌ Não foi possível obter usuário:', userError);
      return;
    }
    
    const userId = users[0].id;
    console.log(`👤 Usuário encontrado: ${userId}`);
    
    // Criar categorias padrão para o usuário
    console.log('📝 Criando categorias padrão...');
    
    for (const category of defaultCategories) {
      // Verificar se a categoria já existe para este usuário
      const { data: existingCategory, error: checkError } = await supabase
        .from('categories')
        .select('id')
        .eq('name', category.name)
        .eq('user_id', userId)
        .maybeSingle();
      
      if (checkError) {
        console.error(`❌ Erro ao verificar categoria ${category.name}:`, checkError);
        continue;
      }
      
      if (!existingCategory) {
        // Criar a categoria
        const { data: newCategory, error: createError } = await supabase
          .from('categories')
          .insert({
            name: category.name,
            icon: category.icon,
            color: category.color,
            user_id: userId
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
    
    // Atualizar produtos genéricos para usar categorias válidas
    console.log('🔄 Atualizando produtos genéricos...');
    
    // Mapeamento de categorias antigas para novas
    const categoryMapping = {
      'Alimentos': 'Mercearia',
      'Verduras': 'Vegetais',
      'Legumes': 'Vegetais',
      'Medicamentos': 'Farmácia',
      'Cosméticos': 'Higiene',
      'Eletrônicos': 'Casa',
      'Bebidas': 'Bebidas',
      'Higiene': 'Higiene',
      'Limpeza': 'Limpeza',
      'Frutas': 'Frutas',
      'Carnes': 'Carnes',
      'Laticínios': 'Laticínios',
      'Padaria': 'Padaria',
      'Pet': 'Pet',
      'Casa': 'Casa',
      'Outros': 'Outros'
    };
    
    // Buscar produtos com category_id que não apontam para categorias válidas
    const { data: products, error: productsError } = await supabase
      .from('generic_products')
      .select('id, name, category_id')
      .not('category_id', 'is', null);
    
    if (productsError) {
      console.error('❌ Erro ao buscar produtos:', productsError);
      return;
    }
    
    console.log(`📊 Encontrados ${products.length} produtos com category_id`);
    
    // Para cada produto, verificar se a categoria existe
    for (const product of products) {
      // Verificar se a categoria referenciada existe
      const { data: category, error: categoryError } = await supabase
        .from('categories')
        .select('id, name')
        .eq('id', product.category_id)
        .maybeSingle();
      
      if (categoryError) {
        console.error(`❌ Erro ao verificar categoria do produto ${product.name}:`, categoryError);
        continue;
      }
      
      if (!category) {
        console.log(`🔄 Produto ${product.name} tem category_id inválido, atualizando...`);
        
        // Determinar a nova categoria baseada no nome do produto
        let newCategoryName = 'Outros';
        
        // Lógica simples de mapeamento baseada no nome do produto
        if (product.name.includes('Arroz') || product.name.includes('Feijão') || 
            product.name.includes('Açúcar') || product.name.includes('Sal') || 
            product.name.includes('Farinha')) {
          newCategoryName = 'Mercearia';
        } else if (product.name.includes('Maçã') || product.name.includes('Banana') || 
                   product.name.includes('Laranja') || product.name.includes('Uva') || 
                   product.name.includes('Abacaxi')) {
          newCategoryName = 'Frutas';
        } else if (product.name.includes('Cenoura') || product.name.includes('Batata') || 
                   product.name.includes('Alface') || product.name.includes('Tomate')) {
          newCategoryName = 'Vegetais';
        } else if (product.name.includes('Carne') || product.name.includes('Frango') || 
                   product.name.includes('Peixe')) {
          newCategoryName = 'Carnes';
        } else if (product.name.includes('Leite') || product.name.includes('Queijo') || 
                   product.name.includes('Iogurte') || product.name.includes('Manteiga')) {
          newCategoryName = 'Laticínios';
        }
        
        // Buscar a nova categoria
        const { data: newCategory, error: newCategoryError } = await supabase
          .from('categories')
          .select('id')
          .eq('name', newCategoryName)
          .eq('user_id', userId)
          .maybeSingle();
        
        if (newCategoryError) {
          console.error(`❌ Erro ao buscar nova categoria ${newCategoryName}:`, newCategoryError);
          continue;
        }
        
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
        } else {
          console.log(`⚠️ Categoria ${newCategoryName} não encontrada para produto ${product.name}`);
        }
      }
    }
    
    console.log('🎉 Correção de categorias concluída!');
    
  } catch (error) {
    console.error('❌ Erro geral na correção:', error);
  }
}

// Executar correção
fixMissingCategories();
