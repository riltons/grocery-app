-- Migração para criar produtos genéricos padrão
-- Estes produtos serão comuns a todos os usuários

-- Primeiro, modificar a tabela generic_products para suportar produtos padrão
ALTER TABLE generic_products 
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;

-- Adicionar índice para produtos padrão
CREATE INDEX IF NOT EXISTS idx_generic_products_is_default 
ON generic_products(is_default) WHERE is_default = TRUE;

-- Comentário para documentar a coluna
COMMENT ON COLUMN generic_products.is_default IS 'Indica se o produto é padrão (comum a todos os usuários)';

-- Inserir produtos genéricos padrão organizados por categoria
-- ALIMENTOS BÁSICOS
INSERT INTO generic_products (id, name, category, user_id, is_default, created_at) VALUES
(gen_random_uuid(), 'Arroz', 'Alimentos', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Feijão', 'Alimentos', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Açúcar', 'Alimentos', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Sal', 'Alimentos', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Óleo de Soja', 'Alimentos', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Farinha de Trigo', 'Alimentos', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Macarrão', 'Alimentos', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Pão', 'Alimentos', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Ovos', 'Alimentos', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Leite', 'Alimentos', NULL, TRUE, NOW()),

-- CARNES E PROTEÍNAS
(gen_random_uuid(), 'Carne Bovina', 'Carnes', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Frango', 'Carnes', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Peixe', 'Carnes', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Linguiça', 'Carnes', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Presunto', 'Carnes', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Queijo', 'Laticínios', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Iogurte', 'Laticínios', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Manteiga', 'Laticínios', NULL, TRUE, NOW()),

-- FRUTAS
(gen_random_uuid(), 'Banana', 'Frutas', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Maçã', 'Frutas', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Laranja', 'Frutas', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Limão', 'Frutas', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Abacaxi', 'Frutas', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Mamão', 'Frutas', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Uva', 'Frutas', NULL, TRUE, NOW()),

-- VERDURAS E LEGUMES
(gen_random_uuid(), 'Tomate', 'Verduras', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Cebola', 'Verduras', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Alho', 'Verduras', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Batata', 'Verduras', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Cenoura', 'Verduras', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Alface', 'Verduras', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Brócolis', 'Verduras', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Abobrinha', 'Verduras', NULL, TRUE, NOW()),

-- BEBIDAS
(gen_random_uuid(), 'Água', 'Bebidas', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Refrigerante', 'Bebidas', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Suco', 'Bebidas', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Cerveja', 'Bebidas', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Café', 'Bebidas', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Chá', 'Bebidas', NULL, TRUE, NOW()),

-- HIGIENE PESSOAL
(gen_random_uuid(), 'Sabonete', 'Higiene', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Shampoo', 'Higiene', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Condicionador', 'Higiene', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Pasta de Dente', 'Higiene', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Papel Higiênico', 'Higiene', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Desodorante', 'Higiene', NULL, TRUE, NOW()),

-- LIMPEZA
(gen_random_uuid(), 'Detergente', 'Limpeza', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Sabão em Pó', 'Limpeza', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Amaciante', 'Limpeza', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Desinfetante', 'Limpeza', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Papel Toalha', 'Limpeza', NULL, TRUE, NOW()),

-- OUTROS
(gen_random_uuid(), 'Pilhas', 'Outros', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Fósforo', 'Outros', NULL, TRUE, NOW()),
(gen_random_uuid(), 'Vela', 'Outros', NULL, TRUE, NOW())

ON CONFLICT DO NOTHING;

-- Verificar quantos produtos foram inseridos
SELECT COUNT(*) as total_produtos_padrao FROM generic_products WHERE is_default = TRUE;