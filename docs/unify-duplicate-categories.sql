-- Script para unificar categorias duplicadas no banco de dados
-- Este script identifica categorias similares e as unifica

-- 1. PRIMEIRO: Identificar categorias duplicadas ou similares
SELECT 
  id,
  name,
  LOWER(TRIM(name)) as normalized_name,
  icon,
  color,
  created_at,
  COUNT(*) OVER (PARTITION BY LOWER(TRIM(name))) as duplicate_count
FROM categories 
ORDER BY normalized_name, created_at;

-- 2. Encontrar categorias que são variações da mesma categoria
WITH similar_categories AS (
  SELECT 
    id,
    name,
    LOWER(TRIM(name)) as normalized_name,
    icon,
    color,
    created_at,
    -- Detectar variações comuns
    CASE 
      WHEN LOWER(name) IN ('bebida', 'bebidas') THEN 'bebidas'
      WHEN LOWER(name) IN ('limpeza', 'produtos de limpeza', 'limpeza domestica') THEN 'limpeza'
      WHEN LOWER(name) IN ('higiene', 'higiene pessoal', 'produtos de higiene') THEN 'higiene'
      WHEN LOWER(name) IN ('carne', 'carnes', 'proteinas', 'proteína') THEN 'carnes'
      WHEN LOWER(name) IN ('fruta', 'frutas') THEN 'frutas'
      WHEN LOWER(name) IN ('verdura', 'verduras', 'legumes', 'vegetais') THEN 'verduras'
      WHEN LOWER(name) IN ('doce', 'doces', 'sobremesa', 'sobremesas') THEN 'doces'
      WHEN LOWER(name) IN ('tempero', 'temperos', 'condimento', 'condimentos') THEN 'temperos'
      WHEN LOWER(name) IN ('graos', 'grãos', 'cereais', 'cereal') THEN 'grãos'
      WHEN LOWER(name) IN ('laticinios', 'laticínios', 'derivados do leite') THEN 'laticínios'
      WHEN LOWER(name) IN ('padaria', 'paes', 'pães', 'panificados') THEN 'padaria'
      WHEN LOWER(name) IN ('congelado', 'congelados', 'frozen') THEN 'congelados'
      WHEN LOWER(name) IN ('pet', 'animais', 'animal de estimação') THEN 'pet'
      WHEN LOWER(name) IN ('bebe', 'bebê', 'infantil', 'criança') THEN 'bebê'
      ELSE LOWER(TRIM(name))
    END as unified_name
  FROM categories
)
SELECT 
  unified_name,
  COUNT(*) as category_count,
  STRING_AGG(name, ', ') as variations,
  STRING_AGG(id::text, ', ') as category_ids
FROM similar_categories
GROUP BY unified_name
HAVING COUNT(*) > 1
ORDER BY category_count DESC;

-- 3. SCRIPT DE UNIFICAÇÃO
-- ATENÇÃO: Execute este script com cuidado, faça backup antes!

-- Função para unificar categorias duplicadas
DO $$
DECLARE
    -- Definir mapeamentos de categorias para unificar
    category_mappings RECORD;
    keep_category_id UUID;
    remove_category_ids UUID[];
BEGIN
    -- Bebidas
    SELECT id INTO keep_category_id FROM categories WHERE LOWER(name) = 'bebidas' ORDER BY created_at LIMIT 1;
    IF keep_category_id IS NOT NULL THEN
        SELECT ARRAY_AGG(id) INTO remove_category_ids 
        FROM categories 
        WHERE LOWER(name) IN ('bebida') AND id != keep_category_id;
        
        IF array_length(remove_category_ids, 1) > 0 THEN
            -- Atualizar produtos genéricos
            UPDATE generic_products 
            SET category_id = keep_category_id 
            WHERE category_id = ANY(remove_category_ids);
            
            -- Remover categorias duplicadas
            DELETE FROM categories WHERE id = ANY(remove_category_ids);
            
            RAISE NOTICE 'Unificadas categorias de bebidas. Mantida: %, Removidas: %', keep_category_id, remove_category_ids;
        END IF;
    END IF;

    -- Limpeza
    SELECT id INTO keep_category_id FROM categories WHERE LOWER(name) = 'limpeza' ORDER BY created_at LIMIT 1;
    IF keep_category_id IS NOT NULL THEN
        SELECT ARRAY_AGG(id) INTO remove_category_ids 
        FROM categories 
        WHERE LOWER(name) IN ('produtos de limpeza', 'limpeza domestica', 'limpeza doméstica') AND id != keep_category_id;
        
        IF array_length(remove_category_ids, 1) > 0 THEN
            UPDATE generic_products SET category_id = keep_category_id WHERE category_id = ANY(remove_category_ids);
            DELETE FROM categories WHERE id = ANY(remove_category_ids);
            RAISE NOTICE 'Unificadas categorias de limpeza. Mantida: %, Removidas: %', keep_category_id, remove_category_ids;
        END IF;
    END IF;

    -- Higiene
    SELECT id INTO keep_category_id FROM categories WHERE LOWER(name) = 'higiene' ORDER BY created_at LIMIT 1;
    IF keep_category_id IS NOT NULL THEN
        SELECT ARRAY_AGG(id) INTO remove_category_ids 
        FROM categories 
        WHERE LOWER(name) IN ('higiene pessoal', 'produtos de higiene') AND id != keep_category_id;
        
        IF array_length(remove_category_ids, 1) > 0 THEN
            UPDATE generic_products SET category_id = keep_category_id WHERE category_id = ANY(remove_category_ids);
            DELETE FROM categories WHERE id = ANY(remove_category_ids);
            RAISE NOTICE 'Unificadas categorias de higiene. Mantida: %, Removidas: %', keep_category_id, remove_category_ids;
        END IF;
    END IF;

    -- Carnes
    SELECT id INTO keep_category_id FROM categories WHERE LOWER(name) = 'carnes' ORDER BY created_at LIMIT 1;
    IF keep_category_id IS NOT NULL THEN
        SELECT ARRAY_AGG(id) INTO remove_category_ids 
        FROM categories 
        WHERE LOWER(name) IN ('carne', 'proteinas', 'proteína') AND id != keep_category_id;
        
        IF array_length(remove_category_ids, 1) > 0 THEN
            UPDATE generic_products SET category_id = keep_category_id WHERE category_id = ANY(remove_category_ids);
            DELETE FROM categories WHERE id = ANY(remove_category_ids);
            RAISE NOTICE 'Unificadas categorias de carnes. Mantida: %, Removidas: %', keep_category_id, remove_category_ids;
        END IF;
    END IF;

    -- Frutas
    SELECT id INTO keep_category_id FROM categories WHERE LOWER(name) = 'frutas' ORDER BY created_at LIMIT 1;
    IF keep_category_id IS NOT NULL THEN
        SELECT ARRAY_AGG(id) INTO remove_category_ids 
        FROM categories 
        WHERE LOWER(name) IN ('fruta') AND id != keep_category_id;
        
        IF array_length(remove_category_ids, 1) > 0 THEN
            UPDATE generic_products SET category_id = keep_category_id WHERE category_id = ANY(remove_category_ids);
            DELETE FROM categories WHERE id = ANY(remove_category_ids);
            RAISE NOTICE 'Unificadas categorias de frutas. Mantida: %, Removidas: %', keep_category_id, remove_category_ids;
        END IF;
    END IF;

    -- Verduras/Legumes
    SELECT id INTO keep_category_id FROM categories WHERE LOWER(name) = 'verduras' ORDER BY created_at LIMIT 1;
    IF keep_category_id IS NOT NULL THEN
        SELECT ARRAY_AGG(id) INTO remove_category_ids 
        FROM categories 
        WHERE LOWER(name) IN ('verdura', 'legumes', 'vegetais') AND id != keep_category_id;
        
        IF array_length(remove_category_ids, 1) > 0 THEN
            UPDATE generic_products SET category_id = keep_category_id WHERE category_id = ANY(remove_category_ids);
            DELETE FROM categories WHERE id = ANY(remove_category_ids);
            RAISE NOTICE 'Unificadas categorias de verduras. Mantida: %, Removidas: %', keep_category_id, remove_category_ids;
        END IF;
    END IF;

    -- Doces
    SELECT id INTO keep_category_id FROM categories WHERE LOWER(name) = 'doces' ORDER BY created_at LIMIT 1;
    IF keep_category_id IS NOT NULL THEN
        SELECT ARRAY_AGG(id) INTO remove_category_ids 
        FROM categories 
        WHERE LOWER(name) IN ('doce', 'sobremesa', 'sobremesas') AND id != keep_category_id;
        
        IF array_length(remove_category_ids, 1) > 0 THEN
            UPDATE generic_products SET category_id = keep_category_id WHERE category_id = ANY(remove_category_ids);
            DELETE FROM categories WHERE id = ANY(remove_category_ids);
            RAISE NOTICE 'Unificadas categorias de doces. Mantida: %, Removidas: %', keep_category_id, remove_category_ids;
        END IF;
    END IF;

    -- Temperos
    SELECT id INTO keep_category_id FROM categories WHERE LOWER(name) = 'temperos' ORDER BY created_at LIMIT 1;
    IF keep_category_id IS NOT NULL THEN
        SELECT ARRAY_AGG(id) INTO remove_category_ids 
        FROM categories 
        WHERE LOWER(name) IN ('tempero', 'condimento', 'condimentos') AND id != keep_category_id;
        
        IF array_length(remove_category_ids, 1) > 0 THEN
            UPDATE generic_products SET category_id = keep_category_id WHERE category_id = ANY(remove_category_ids);
            DELETE FROM categories WHERE id = ANY(remove_category_ids);
            RAISE NOTICE 'Unificadas categorias de temperos. Mantida: %, Removidas: %', keep_category_id, remove_category_ids;
        END IF;
    END IF;

    -- Grãos/Cereais
    SELECT id INTO keep_category_id FROM categories WHERE LOWER(name) = 'grãos' ORDER BY created_at LIMIT 1;
    IF keep_category_id IS NOT NULL THEN
        SELECT ARRAY_AGG(id) INTO remove_category_ids 
        FROM categories 
        WHERE LOWER(name) IN ('graos', 'cereais', 'cereal') AND id != keep_category_id;
        
        IF array_length(remove_category_ids, 1) > 0 THEN
            UPDATE generic_products SET category_id = keep_category_id WHERE category_id = ANY(remove_category_ids);
            DELETE FROM categories WHERE id = ANY(remove_category_ids);
            RAISE NOTICE 'Unificadas categorias de grãos. Mantida: %, Removidas: %', keep_category_id, remove_category_ids;
        END IF;
    END IF;

    -- Laticínios
    SELECT id INTO keep_category_id FROM categories WHERE LOWER(name) = 'laticínios' ORDER BY created_at LIMIT 1;
    IF keep_category_id IS NOT NULL THEN
        SELECT ARRAY_AGG(id) INTO remove_category_ids 
        FROM categories 
        WHERE LOWER(name) IN ('laticinios', 'derivados do leite') AND id != keep_category_id;
        
        IF array_length(remove_category_ids, 1) > 0 THEN
            UPDATE generic_products SET category_id = keep_category_id WHERE category_id = ANY(remove_category_ids);
            DELETE FROM categories WHERE id = ANY(remove_category_ids);
            RAISE NOTICE 'Unificadas categorias de laticínios. Mantida: %, Removidas: %', keep_category_id, remove_category_ids;
        END IF;
    END IF;

    -- Padaria
    SELECT id INTO keep_category_id FROM categories WHERE LOWER(name) = 'padaria' ORDER BY created_at LIMIT 1;
    IF keep_category_id IS NOT NULL THEN
        SELECT ARRAY_AGG(id) INTO remove_category_ids 
        FROM categories 
        WHERE LOWER(name) IN ('paes', 'pães', 'panificados') AND id != keep_category_id;
        
        IF array_length(remove_category_ids, 1) > 0 THEN
            UPDATE generic_products SET category_id = keep_category_id WHERE category_id = ANY(remove_category_ids);
            DELETE FROM categories WHERE id = ANY(remove_category_ids);
            RAISE NOTICE 'Unificadas categorias de padaria. Mantida: %, Removidas: %', keep_category_id, remove_category_ids;
        END IF;
    END IF;

    -- Congelados
    SELECT id INTO keep_category_id FROM categories WHERE LOWER(name) = 'congelados' ORDER BY created_at LIMIT 1;
    IF keep_category_id IS NOT NULL THEN
        SELECT ARRAY_AGG(id) INTO remove_category_ids 
        FROM categories 
        WHERE LOWER(name) IN ('congelado', 'frozen') AND id != keep_category_id;
        
        IF array_length(remove_category_ids, 1) > 0 THEN
            UPDATE generic_products SET category_id = keep_category_id WHERE category_id = ANY(remove_category_ids);
            DELETE FROM categories WHERE id = ANY(remove_category_ids);
            RAISE NOTICE 'Unificadas categorias de congelados. Mantida: %, Removidas: %', keep_category_id, remove_category_ids;
        END IF;
    END IF;

    -- Pet
    SELECT id INTO keep_category_id FROM categories WHERE LOWER(name) = 'pet' ORDER BY created_at LIMIT 1;
    IF keep_category_id IS NOT NULL THEN
        SELECT ARRAY_AGG(id) INTO remove_category_ids 
        FROM categories 
        WHERE LOWER(name) IN ('animais', 'animal de estimação') AND id != keep_category_id;
        
        IF array_length(remove_category_ids, 1) > 0 THEN
            UPDATE generic_products SET category_id = keep_category_id WHERE category_id = ANY(remove_category_ids);
            DELETE FROM categories WHERE id = ANY(remove_category_ids);
            RAISE NOTICE 'Unificadas categorias de pet. Mantida: %, Removidas: %', keep_category_id, remove_category_ids;
        END IF;
    END IF;

    -- Bebê
    SELECT id INTO keep_category_id FROM categories WHERE LOWER(name) = 'bebê' ORDER BY created_at LIMIT 1;
    IF keep_category_id IS NOT NULL THEN
        SELECT ARRAY_AGG(id) INTO remove_category_ids 
        FROM categories 
        WHERE LOWER(name) IN ('bebe', 'infantil', 'criança') AND id != keep_category_id;
        
        IF array_length(remove_category_ids, 1) > 0 THEN
            UPDATE generic_products SET category_id = keep_category_id WHERE category_id = ANY(remove_category_ids);
            DELETE FROM categories WHERE id = ANY(remove_category_ids);
            RAISE NOTICE 'Unificadas categorias de bebê. Mantida: %, Removidas: %', keep_category_id, remove_category_ids;
        END IF;
    END IF;

    RAISE NOTICE 'Processo de unificação de categorias concluído!';
END $$;

-- 4. VERIFICAÇÃO FINAL: Listar categorias após unificação
SELECT 
  id,
  name,
  icon,
  color,
  created_at,
  (SELECT COUNT(*) FROM generic_products WHERE category_id = categories.id) as product_count
FROM categories 
ORDER BY name;

-- 5. OPCIONAL: Remover categorias órfãs (sem produtos)
-- DELETE FROM categories 
-- WHERE id NOT IN (SELECT DISTINCT category_id FROM generic_products WHERE category_id IS NOT NULL);