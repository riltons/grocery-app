-- Script para migrar categorias existentes (strings) para a nova tabela de categorias
-- Execute APÓS executar categories-migration.sql

-- 1. Primeiro, vamos criar as categorias padrão para todos os usuários existentes
-- que têm produtos mas não têm categorias na nova tabela

INSERT INTO public.categories (name, icon, color, description, user_id)
SELECT DISTINCT 
    'Frutas' as name,
    'nutrition' as icon,
    '#FF6B6B' as color,
    'Frutas frescas e secas' as description,
    gp.user_id
FROM public.generic_products gp
WHERE gp.user_id NOT IN (
    SELECT DISTINCT user_id FROM public.categories WHERE name = 'Frutas'
)
AND gp.user_id IS NOT NULL

UNION ALL

SELECT DISTINCT 
    'Vegetais' as name,
    'leaf' as icon,
    '#4ECDC4' as color,
    'Verduras e legumes' as description,
    gp.user_id
FROM public.generic_products gp
WHERE gp.user_id NOT IN (
    SELECT DISTINCT user_id FROM public.categories WHERE name = 'Vegetais'
)
AND gp.user_id IS NOT NULL

UNION ALL

SELECT DISTINCT 
    'Carnes' as name,
    'restaurant' as icon,
    '#FF8E53' as color,
    'Carnes vermelhas, aves e peixes' as description,
    gp.user_id
FROM public.generic_products gp
WHERE gp.user_id NOT IN (
    SELECT DISTINCT user_id FROM public.categories WHERE name = 'Carnes'
)
AND gp.user_id IS NOT NULL

UNION ALL

SELECT DISTINCT 
    'Laticínios' as name,
    'water' as icon,
    '#45B7D1' as color,
    'Leite, queijos e derivados' as description,
    gp.user_id
FROM public.generic_products gp
WHERE gp.user_id NOT IN (
    SELECT DISTINCT user_id FROM public.categories WHERE name = 'Laticínios'
)
AND gp.user_id IS NOT NULL

UNION ALL

SELECT DISTINCT 
    'Padaria' as name,
    'pizza' as icon,
    '#F7DC6F' as color,
    'Pães, bolos e massas' as description,
    gp.user_id
FROM public.generic_products gp
WHERE gp.user_id NOT IN (
    SELECT DISTINCT user_id FROM public.categories WHERE name = 'Padaria'
)
AND gp.user_id IS NOT NULL

UNION ALL

SELECT DISTINCT 
    'Mercearia' as name,
    'basket' as icon,
    '#BB8FCE' as color,
    'Produtos secos e enlatados' as description,
    gp.user_id
FROM public.generic_products gp
WHERE gp.user_id NOT IN (
    SELECT DISTINCT user_id FROM public.categories WHERE name = 'Mercearia'
)
AND gp.user_id IS NOT NULL

UNION ALL

SELECT DISTINCT 
    'Bebidas' as name,
    'beer' as icon,
    '#58D68D' as color,
    'Bebidas alcoólicas e não alcoólicas' as description,
    gp.user_id
FROM public.generic_products gp
WHERE gp.user_id NOT IN (
    SELECT DISTINCT user_id FROM public.categories WHERE name = 'Bebidas'
)
AND gp.user_id IS NOT NULL

UNION ALL

SELECT DISTINCT 
    'Limpeza' as name,
    'sparkles' as icon,
    '#85C1E9' as color,
    'Produtos de limpeza doméstica' as description,
    gp.user_id
FROM public.generic_products gp
WHERE gp.user_id NOT IN (
    SELECT DISTINCT user_id FROM public.categories WHERE name = 'Limpeza'
)
AND gp.user_id IS NOT NULL

UNION ALL

SELECT DISTINCT 
    'Higiene' as name,
    'medical' as icon,
    '#F8C471' as color,
    'Produtos de higiene pessoal' as description,
    gp.user_id
FROM public.generic_products gp
WHERE gp.user_id NOT IN (
    SELECT DISTINCT user_id FROM public.categories WHERE name = 'Higiene'
)
AND gp.user_id IS NOT NULL

UNION ALL

SELECT DISTINCT 
    'Outros' as name,
    'ellipsis-horizontal' as icon,
    '#BDC3C7' as color,
    'Outros produtos' as description,
    gp.user_id
FROM public.generic_products gp
WHERE gp.user_id NOT IN (
    SELECT DISTINCT user_id FROM public.categories WHERE name = 'Outros'
)
AND gp.user_id IS NOT NULL;

-- 2. Agora vamos mapear as categorias existentes (strings) para os IDs das novas categorias
-- Criar uma tabela temporária para o mapeamento

CREATE TEMP TABLE category_mapping AS
SELECT 
    c.id as category_id,
    c.name as category_name,
    c.user_id
FROM public.categories c;

-- 3. Atualizar produtos que têm categorias como string para usar os IDs
-- Mapeamento baseado em similaridade de nomes

-- Frutas
UPDATE public.generic_products 
SET category = cm.category_id::text
FROM category_mapping cm
WHERE generic_products.user_id = cm.user_id
AND cm.category_name = 'Frutas'
AND (
    LOWER(generic_products.category) LIKE '%fruta%' OR
    LOWER(generic_products.category) LIKE '%fruit%' OR
    generic_products.category = 'frutas'
);

-- Vegetais
UPDATE public.generic_products 
SET category = cm.category_id::text
FROM category_mapping cm
WHERE generic_products.user_id = cm.user_id
AND cm.category_name = 'Vegetais'
AND (
    LOWER(generic_products.category) LIKE '%vegeta%' OR
    LOWER(generic_products.category) LIKE '%verdura%' OR
    LOWER(generic_products.category) LIKE '%legume%' OR
    generic_products.category = 'vegetais'
);

-- Carnes
UPDATE public.generic_products 
SET category = cm.category_id::text
FROM category_mapping cm
WHERE generic_products.user_id = cm.user_id
AND cm.category_name = 'Carnes'
AND (
    LOWER(generic_products.category) LIKE '%carne%' OR
    LOWER(generic_products.category) LIKE '%frango%' OR
    LOWER(generic_products.category) LIKE '%peixe%' OR
    LOWER(generic_products.category) LIKE '%ave%' OR
    generic_products.category = 'carnes'
);

-- Laticínios
UPDATE public.generic_products 
SET category = cm.category_id::text
FROM category_mapping cm
WHERE generic_products.user_id = cm.user_id
AND cm.category_name = 'Laticínios'
AND (
    LOWER(generic_products.category) LIKE '%latic%' OR
    LOWER(generic_products.category) LIKE '%leite%' OR
    LOWER(generic_products.category) LIKE '%queijo%' OR
    LOWER(generic_products.category) LIKE '%iogurte%' OR
    generic_products.category = 'laticinios'
);

-- Bebidas
UPDATE public.generic_products 
SET category = cm.category_id::text
FROM category_mapping cm
WHERE generic_products.user_id = cm.user_id
AND cm.category_name = 'Bebidas'
AND (
    LOWER(generic_products.category) LIKE '%bebida%' OR
    LOWER(generic_products.category) LIKE '%suco%' OR
    LOWER(generic_products.category) LIKE '%refrigerante%' OR
    LOWER(generic_products.category) LIKE '%água%' OR
    generic_products.category = 'bebidas'
);

-- Limpeza
UPDATE public.generic_products 
SET category = cm.category_id::text
FROM category_mapping cm
WHERE generic_products.user_id = cm.user_id
AND cm.category_name = 'Limpeza'
AND (
    LOWER(generic_products.category) LIKE '%limpeza%' OR
    LOWER(generic_products.category) LIKE '%detergente%' OR
    LOWER(generic_products.category) LIKE '%sabão%' OR
    generic_products.category = 'limpeza'
);

-- Higiene
UPDATE public.generic_products 
SET category = cm.category_id::text
FROM category_mapping cm
WHERE generic_products.user_id = cm.user_id
AND cm.category_name = 'Higiene'
AND (
    LOWER(generic_products.category) LIKE '%higiene%' OR
    LOWER(generic_products.category) LIKE '%shampoo%' OR
    LOWER(generic_products.category) LIKE '%sabonete%' OR
    generic_products.category = 'higiene'
);

-- Padaria
UPDATE public.generic_products 
SET category = cm.category_id::text
FROM category_mapping cm
WHERE generic_products.user_id = cm.user_id
AND cm.category_name = 'Padaria'
AND (
    LOWER(generic_products.category) LIKE '%padaria%' OR
    LOWER(generic_products.category) LIKE '%pão%' OR
    LOWER(generic_products.category) LIKE '%bolo%' OR
    generic_products.category = 'padaria'
);

-- Mercearia (produtos que não se encaixaram em outras categorias)
UPDATE public.generic_products 
SET category = cm.category_id::text
FROM category_mapping cm
WHERE generic_products.user_id = cm.user_id
AND cm.category_name = 'Mercearia'
AND (
    LOWER(generic_products.category) LIKE '%mercearia%' OR
    LOWER(generic_products.category) LIKE '%enlatado%' OR
    LOWER(generic_products.category) LIKE '%conserva%' OR
    generic_products.category = 'mercearia'
);

-- Outros (para categorias que não foram mapeadas)
UPDATE public.generic_products 
SET category = cm.category_id::text
FROM category_mapping cm
WHERE generic_products.user_id = cm.user_id
AND cm.category_name = 'Outros'
AND (
    generic_products.category IS NULL OR
    generic_products.category = '' OR
    generic_products.category = 'outros' OR
    -- Produtos que ainda têm categoria como string (não foram mapeados acima)
    generic_products.category NOT IN (
        SELECT DISTINCT category_id::text FROM category_mapping
    )
);

-- 4. Verificar resultados da migração
SELECT 
    'Produtos com categoria UUID' as tipo,
    COUNT(*) as quantidade
FROM public.generic_products 
WHERE category ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'

UNION ALL

SELECT 
    'Produtos com categoria string' as tipo,
    COUNT(*) as quantidade
FROM public.generic_products 
WHERE category IS NOT NULL 
AND category != ''
AND category !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'

UNION ALL

SELECT 
    'Produtos sem categoria' as tipo,
    COUNT(*) as quantidade
FROM public.generic_products 
WHERE category IS NULL OR category = '';

-- 5. Mostrar estatísticas por categoria
SELECT 
    c.name as categoria,
    COUNT(gp.id) as produtos
FROM public.categories c
LEFT JOIN public.generic_products gp ON gp.category = c.id::text
GROUP BY c.id, c.name
ORDER BY produtos DESC;

-- NOTA: Após executar esta migração e verificar que tudo está correto,
-- você pode considerar alterar o tipo da coluna category em generic_products
-- para UUID e adicionar uma foreign key constraint:

-- ALTER TABLE public.generic_products 
-- ALTER COLUMN category TYPE UUID USING category::UUID;

-- ALTER TABLE public.generic_products 
-- ADD CONSTRAINT fk_generic_products_category 
-- FOREIGN KEY (category) REFERENCES public.categories(id);