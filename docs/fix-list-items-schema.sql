-- Script para corrigir o schema da tabela list_items
-- Execute este script no SQL Editor do Supabase para adicionar as colunas necessárias

-- Adicionar coluna product_id se ela não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'list_items' 
        AND column_name = 'product_id'
    ) THEN
        ALTER TABLE list_items 
        ADD COLUMN product_id UUID REFERENCES specific_products(id) ON DELETE SET NULL;
        
        -- Adicionar índice para melhor performance
        CREATE INDEX IF NOT EXISTS idx_list_items_product_id 
        ON list_items(product_id);
        
        RAISE NOTICE 'Coluna product_id adicionada à tabela list_items';
    ELSE
        RAISE NOTICE 'Coluna product_id já existe na tabela list_items';
    END IF;
END $$;

-- Adicionar coluna generic_product_id se ela não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'list_items' 
        AND column_name = 'generic_product_id'
    ) THEN
        ALTER TABLE list_items 
        ADD COLUMN generic_product_id UUID REFERENCES generic_products(id) ON DELETE SET NULL;
        
        -- Adicionar índice para melhor performance
        CREATE INDEX IF NOT EXISTS idx_list_items_generic_product_id 
        ON list_items(generic_product_id);
        
        RAISE NOTICE 'Coluna generic_product_id adicionada à tabela list_items';
    ELSE
        RAISE NOTICE 'Coluna generic_product_id já existe na tabela list_items';
    END IF;
END $$;

-- Adicionar coluna product_name se ela não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'list_items' 
        AND column_name = 'product_name'
    ) THEN
        ALTER TABLE list_items 
        ADD COLUMN product_name TEXT;
        
        RAISE NOTICE 'Coluna product_name adicionada à tabela list_items';
    ELSE
        RAISE NOTICE 'Coluna product_name já existe na tabela list_items';
    END IF;
END $$;

-- Comentários para documentar as colunas
COMMENT ON COLUMN list_items.product_id IS 'Referência ao produto específico';
COMMENT ON COLUMN list_items.generic_product_id IS 'Referência ao produto genérico';
COMMENT ON COLUMN list_items.product_name IS 'Nome do produto armazenado diretamente no item da lista';

-- Verificar se as colunas foram criadas
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'list_items' 
AND column_name IN ('product_id', 'generic_product_id', 'product_name')
ORDER BY column_name;
