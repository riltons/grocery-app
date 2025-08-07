-- Tabelas para o sistema de pesquisa de preços persistente

-- Tabela para sessões de pesquisa de preços
CREATE TABLE IF NOT EXISTS price_search_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true
);

-- Tabela para itens das sessões de pesquisa
CREATE TABLE IF NOT EXISTS price_search_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES price_search_sessions(id) ON DELETE CASCADE,
  specific_product_id UUID NOT NULL REFERENCES specific_products(id) ON DELETE CASCADE,
  price DECIMAL(10,2),
  scanned BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Evitar duplicatas na mesma sessão
  UNIQUE(session_id, specific_product_id)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_price_search_sessions_store_user ON price_search_sessions(store_id, user_id);
CREATE INDEX IF NOT EXISTS idx_price_search_sessions_active ON price_search_sessions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_price_search_items_session ON price_search_items(session_id);
CREATE INDEX IF NOT EXISTS idx_price_search_items_user ON price_search_items(user_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_price_search_sessions_updated_at 
    BEFORE UPDATE ON price_search_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE price_search_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_search_items ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para price_search_sessions
CREATE POLICY "Users can view their own price search sessions" ON price_search_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own price search sessions" ON price_search_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own price search sessions" ON price_search_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own price search sessions" ON price_search_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para price_search_items
CREATE POLICY "Users can view their own price search items" ON price_search_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own price search items" ON price_search_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own price search items" ON price_search_items
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own price search items" ON price_search_items
    FOR DELETE USING (auth.uid() = user_id);

-- Função para limpar sessões antigas (opcional)
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS void AS $$
BEGIN
    -- Marcar como inativas sessões com mais de 7 dias sem atualização
    UPDATE price_search_sessions 
    SET is_active = false 
    WHERE is_active = true 
    AND updated_at < NOW() - INTERVAL '7 days';
    
    -- Deletar sessões inativas com mais de 30 dias
    DELETE FROM price_search_sessions 
    WHERE is_active = false 
    AND updated_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE price_search_sessions IS 'Sessões de pesquisa de preços por loja';
COMMENT ON TABLE price_search_items IS 'Itens escaneados em cada sessão de pesquisa';
COMMENT ON COLUMN price_search_sessions.is_active IS 'Indica se a sessão está ativa (apenas uma por loja/usuário)';
COMMENT ON COLUMN price_search_items.scanned IS 'Indica se o produto foi escaneado ou adicionado manualmente';
COMMENT ON COLUMN price_search_items.price IS 'Preço informado pelo usuário (pode ser null se ainda não informado)';