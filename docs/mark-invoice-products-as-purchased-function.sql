-- Função para marcar produtos da nota fiscal como comprados na lista
-- Esta função compara produtos da nota fiscal com itens da lista e:
-- 1. Marca produtos correspondentes como comprados
-- 2. Atualiza preços e quantidades
-- 3. Adiciona novos produtos não encontrados na lista

CREATE OR REPLACE FUNCTION mark_invoice_products_as_purchased(
    p_invoice_id UUID,
    p_list_id UUID,
    p_user_id UUID
)
RETURNS TABLE(
    updated_items_count INTEGER,
    added_items_count INTEGER,
    matched_products JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated_count INTEGER := 0;
    v_added_count INTEGER := 0;
    v_matched_products JSONB := '[]'::jsonb;
    v_invoice_item RECORD;
    v_list_item RECORD;
    v_match_found BOOLEAN;
    v_match_info JSONB;
BEGIN
    -- Verificar se o usuário tem acesso à nota fiscal e à lista
    IF NOT EXISTS (
        SELECT 1 FROM invoices 
        WHERE id = p_invoice_id AND user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'Nota fiscal não encontrada ou acesso negado';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM lists 
        WHERE id = p_list_id AND user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'Lista não encontrada ou acesso negado';
    END IF;
    
    -- Processar cada item da nota fiscal
    FOR v_invoice_item IN (
        SELECT 
            id,
            name,
            quantity,
            unit,
            unit_price,
            total_price,
            barcode
        FROM invoice_items 
        WHERE invoice_id = p_invoice_id
        ORDER BY name
    ) LOOP
        v_match_found := FALSE;
        
        -- Tentar encontrar correspondência na lista
        FOR v_list_item IN (
            SELECT 
                id,
                product_name,
                quantity as list_quantity,
                unit as list_unit,
                checked,
                price
            FROM list_items 
            WHERE list_id = p_list_id
            AND NOT checked -- Só considerar itens não marcados
            ORDER BY product_name
        ) LOOP
            -- Algoritmo de correspondência
            IF (
                -- Correspondência exata (ignorando case e espaços)
                LOWER(TRIM(v_list_item.product_name)) = LOWER(TRIM(v_invoice_item.name))
                OR
                -- Nome do produto da lista contém o nome da nota fiscal
                LOWER(TRIM(v_list_item.product_name)) LIKE '%' || LOWER(TRIM(v_invoice_item.name)) || '%'
                OR
                -- Nome da nota fiscal contém o nome do produto da lista
                LOWER(TRIM(v_invoice_item.name)) LIKE '%' || LOWER(TRIM(v_list_item.product_name)) || '%'
            ) THEN
                -- Marcar como comprado e atualizar informações
                UPDATE list_items 
                SET 
                    checked = TRUE,
                    price = COALESCE(v_invoice_item.unit_price, price),
                    quantity = CASE 
                        WHEN v_invoice_item.unit = list_unit THEN v_invoice_item.quantity
                        ELSE quantity
                    END,
                    updated_at = NOW()
                WHERE id = v_list_item.id;
                
                v_updated_count := v_updated_count + 1;
                v_match_found := TRUE;
                
                -- Registrar informações da correspondência
                v_match_info := jsonb_build_object(
                    'type', 'updated',
                    'list_item_id', v_list_item.id,
                    'list_item_name', v_list_item.product_name,
                    'invoice_item_name', v_invoice_item.name,
                    'price_updated', v_invoice_item.unit_price,
                    'quantity_updated', v_invoice_item.quantity
                );
                
                v_matched_products := v_matched_products || v_match_info;
                
                -- Sair do loop interno após encontrar correspondência
                EXIT;
            END IF;
        END LOOP;
        
        -- Se não encontrou correspondência, adicionar como novo item
        IF NOT v_match_found THEN
            INSERT INTO list_items (
                list_id,
                product_name,
                quantity,
                unit,
                checked,
                price,
                user_id,
                created_at,
                updated_at
            ) VALUES (
                p_list_id,
                v_invoice_item.name,
                v_invoice_item.quantity,
                v_invoice_item.unit,
                TRUE, -- Já marcar como comprado
                v_invoice_item.unit_price,
                p_user_id,
                NOW(),
                NOW()
            );
            
            v_added_count := v_added_count + 1;
            
            -- Registrar informações do novo item
            v_match_info := jsonb_build_object(
                'type', 'added',
                'invoice_item_name', v_invoice_item.name,
                'quantity', v_invoice_item.quantity,
                'unit', v_invoice_item.unit,
                'price', v_invoice_item.unit_price
            );
            
            v_matched_products := v_matched_products || v_match_info;
        END IF;
    END LOOP;
    
    -- Retornar resultados
    RETURN QUERY SELECT 
        v_updated_count,
        v_added_count,
        v_matched_products;
END;
$$;

-- Comentário da função
COMMENT ON FUNCTION mark_invoice_products_as_purchased(UUID, UUID, UUID) IS 
'Marca produtos da nota fiscal como comprados na lista de compras, atualizando preços e adicionando novos itens';

-- Exemplo de uso:
-- SELECT * FROM mark_invoice_products_as_purchased(
--     'uuid-da-nota-fiscal',
--     'uuid-da-lista',
--     'uuid-do-usuario'
-- );