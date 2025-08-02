-- Migração para vincular produtos à tabela categories através de chaves estrangeiras
-- Esta migração unifica o sistema de categorias

-- Passo 1: Adicionar nova coluna category_id na tabela generic_products
ALTER TABLE public.generic_products 
ADD COLUMN category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- Passo 2: Migrar dados existentes
-- Para cada produto genérico que tem uma categoria (string), 
-- encontrar ou criar a categoria correspondente na tabela categories

DO $$
DECLARE
    product_record RECORD;
    category_record RECORD;
    user_id_var UUID;
BEGIN
    -- Para cada produto genérico com categoria não nula
    FOR product_record IN 
        SELECT id, category, user_id 
        FROM public.generic_products 
        WHERE category IS NOT NULL AND category != ''
    LOOP
        -- Verificar se já existe uma categoria com esse nome para o usuário
        SELECT id INTO category_record
        FROM public.categories 
        WHERE name = product_record.category 
        AND user_id = product_record.user_id;
        
        -- Se não existe, criar a categoria
        IF NOT FOUND THEN
            INSERT INTO public.categories (name, icon, color, user_id, created_at)
            VALUES (
                product_record.category,
                'basket', -- ícone padrão
                '#4CAF50', -- cor padrão
                product_record.user_id,
                NOW()
            )
            RETURNING id INTO category_record;
        END IF;
        
        -- Atualizar o produto para referenciar a categoria
        UPDATE public.generic_products 
        SET category_id = category_record.id
        WHERE id = product_record.id;
        
        RAISE NOTICE 'Produto % vinculado à categoria % (ID: %)', 
            product_record.id, product_record.category, category_record.id;
    END LOOP;
END $$;

-- Passo 3: Remover a coluna category antiga (string)
ALTER TABLE public.generic_products DROP COLUMN category;

-- Passo 4: Criar índice para melhor performance
CREATE INDEX idx_generic_products_category_id ON public.generic_products(category_id);

-- Passo 5: Comentários para documentação
COMMENT ON COLUMN public.generic_products.category_id IS 'Referência à categoria do produto na tabela categories';
COMMENT ON INDEX idx_generic_products_category_id IS 'Índice para otimizar consultas por categoria';

-- Verificação final: mostrar estatísticas da migração
SELECT 
    COUNT(*) as total_produtos,
    COUNT(category_id) as produtos_com_categoria,
    COUNT(*) - COUNT(category_id) as produtos_sem_categoria
FROM public.generic_products;
