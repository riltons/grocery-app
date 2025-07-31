-- Migração para adicionar suporte a códigos de barras
-- Execute este script no Supabase SQL Editor

-- 1. Adicionar colunas de código de barras à tabela specific_products
ALTER TABLE public.specific_products 
ADD COLUMN IF NOT EXISTS barcode VARCHAR(50),
ADD COLUMN IF NOT EXISTS barcode_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS external_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS data_source VARCHAR(50) DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS last_external_sync TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS default_unit VARCHAR(20);

-- 2. Criar índice para busca rápida por código de barras
CREATE INDEX IF NOT EXISTS idx_specific_products_barcode ON public.specific_products(barcode);
CREATE INDEX IF NOT EXISTS idx_specific_products_user_barcode ON public.specific_products(user_id, barcode);

-- 3. Adicionar constraint de unicidade para código de barras por usuário
ALTER TABLE public.specific_products 
ADD CONSTRAINT unique_user_barcode UNIQUE (user_id, barcode);

-- 4. Criar tabela de cache de códigos de barras
CREATE TABLE IF NOT EXISTS public.barcode_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barcode VARCHAR(50) NOT NULL,
  barcode_type VARCHAR(20) NOT NULL,
  product_data JSONB NOT NULL,
  source VARCHAR(50) NOT NULL,
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 5. Criar índices para a tabela de cache
CREATE INDEX IF NOT EXISTS idx_barcode_cache_barcode ON public.barcode_cache(barcode);
CREATE INDEX IF NOT EXISTS idx_barcode_cache_user ON public.barcode_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_barcode_cache_user_barcode ON public.barcode_cache(user_id, barcode);
CREATE INDEX IF NOT EXISTS idx_barcode_cache_expires ON public.barcode_cache(expires_at);

-- 6. Habilitar RLS na tabela de cache
ALTER TABLE public.barcode_cache ENABLE ROW LEVEL SECURITY;

-- 7. Criar políticas RLS para barcode_cache
CREATE POLICY "Usuários podem ver seu próprio cache de códigos de barras" 
  ON public.barcode_cache FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir em seu próprio cache de códigos de barras" 
  ON public.barcode_cache FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seu próprio cache de códigos de barras" 
  ON public.barcode_cache FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir de seu próprio cache de códigos de barras" 
  ON public.barcode_cache FOR DELETE 
  USING (auth.uid() = user_id);

-- 8. Criar função para limpeza automática do cache expirado
CREATE OR REPLACE FUNCTION clean_expired_barcode_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM public.barcode_cache 
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 9. Comentários para documentação
COMMENT ON TABLE public.barcode_cache IS 'Cache de códigos de barras escaneados para melhorar performance';
COMMENT ON COLUMN public.specific_products.barcode IS 'Código de barras do produto (EAN, UPC, etc.)';
COMMENT ON COLUMN public.specific_products.barcode_type IS 'Tipo do código de barras (EAN13, UPC_A, etc.)';
COMMENT ON COLUMN public.specific_products.external_id IS 'ID do produto em APIs externas (Cosmos, Open Food Facts)';
COMMENT ON COLUMN public.specific_products.data_source IS 'Fonte dos dados do produto (local, cosmos, openfoodfacts, manual)';
COMMENT ON COLUMN public.specific_products.confidence_score IS 'Pontuação de confiança dos dados (0.0 a 1.0)';