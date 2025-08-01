-- Migração para adicionar coluna generic_product_id à tabela list_items
-- Esta coluna permitirá armazenar a referência direta ao produto genérico

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

-- Adicionar coluna product_name se ela não existir (para armazenar o nome diretamente)
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
COMMENT ON COLUMN list_items.generic_product_id IS 'Referência ao produto genérico (para produtos genéricos adicionados diretamente)';
COMMENT ON COLUMN list_items.product_name IS 'Nome do produto armazenado diretamente no item da lista';