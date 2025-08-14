-- Tabelas para o sistema de notas fiscais

-- Tabela principal para armazenar notas fiscais
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  number VARCHAR(50) NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  store_name VARCHAR(255) NOT NULL,
  store_document VARCHAR(20),
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  xml_url TEXT,
  qr_code_data TEXT,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  list_id UUID REFERENCES lists(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Evitar duplicatas por usuário (mesmo número e loja)
  UNIQUE(user_id, number, store_document)
);

-- Tabela para itens das notas fiscais
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,3) NOT NULL DEFAULT 1,
  unit VARCHAR(20) NOT NULL DEFAULT 'un',
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  barcode VARCHAR(50),
  brand VARCHAR(255),
  category VARCHAR(100),
  specific_product_id UUID REFERENCES specific_products(id) ON DELETE SET NULL,
  generic_product_id UUID REFERENCES generic_products(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para vincular notas fiscais a listas de compras
CREATE TABLE IF NOT EXISTS invoice_list_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  linked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Evitar duplicatas
  UNIQUE(invoice_id, list_id)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_invoices_user_date ON invoices(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_store ON invoices(store_id);
CREATE INDEX IF NOT EXISTS idx_invoices_list ON invoices(list_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(user_id, number);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_user ON invoice_items(user_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_barcode ON invoice_items(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoice_items_products ON invoice_items(specific_product_id, generic_product_id);

CREATE INDEX IF NOT EXISTS idx_invoice_list_links_invoice ON invoice_list_links(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_list_links_list ON invoice_list_links(list_id);
CREATE INDEX IF NOT EXISTS idx_invoice_list_links_user ON invoice_list_links(user_id);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_invoices_updated_at 
    BEFORE UPDATE ON invoices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_list_links ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para invoices
CREATE POLICY "Users can view their own invoices" ON invoices
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoices" ON invoices
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices" ON invoices
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices" ON invoices
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para invoice_items
CREATE POLICY "Users can view their own invoice items" ON invoice_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoice items" ON invoice_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoice items" ON invoice_items
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoice items" ON invoice_items
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para invoice_list_links
CREATE POLICY "Users can view their own invoice list links" ON invoice_list_links
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoice list links" ON invoice_list_links
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoice list links" ON invoice_list_links
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoice list links" ON invoice_list_links
    FOR DELETE USING (auth.uid() = user_id);

-- Função para calcular total da nota fiscal baseado nos itens
CREATE OR REPLACE FUNCTION calculate_invoice_total(invoice_uuid UUID)
RETURNS DECIMAL(10,2) AS $
DECLARE
    total DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(total_price), 0)
    INTO total
    FROM invoice_items
    WHERE invoice_id = invoice_uuid;
    
    RETURN total;
END;
$ LANGUAGE plpgsql;

-- Trigger para atualizar total da nota quando itens são modificados
CREATE OR REPLACE FUNCTION update_invoice_total()
RETURNS TRIGGER AS $
BEGIN
    -- Atualizar o total da nota fiscal
    UPDATE invoices 
    SET total_amount = calculate_invoice_total(
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.invoice_id
            ELSE NEW.invoice_id
        END
    )
    WHERE id = (
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.invoice_id
            ELSE NEW.invoice_id
        END
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER update_invoice_total_on_items_change
    AFTER INSERT OR UPDATE OR DELETE ON invoice_items
    FOR EACH ROW EXECUTE FUNCTION update_invoice_total();

-- Comentários para documentação
COMMENT ON TABLE invoices IS 'Notas fiscais processadas pelos usuários';
COMMENT ON TABLE invoice_items IS 'Itens das notas fiscais com detalhes dos produtos';
COMMENT ON TABLE invoice_list_links IS 'Vinculação entre notas fiscais e listas de compras';

COMMENT ON COLUMN invoices.store_id IS 'Referência à loja cadastrada (opcional)';
COMMENT ON COLUMN invoices.list_id IS 'Lista principal vinculada à nota fiscal (opcional)';
COMMENT ON COLUMN invoices.xml_url IS 'URL original do XML da nota fiscal';
COMMENT ON COLUMN invoices.qr_code_data IS 'Dados do QR Code escaneado';

COMMENT ON COLUMN invoice_items.specific_product_id IS 'Produto específico vinculado (se existir)';
COMMENT ON COLUMN invoice_items.generic_product_id IS 'Produto genérico vinculado (se existir)';

-- Views úteis para consultas
CREATE OR REPLACE VIEW invoice_summary AS
SELECT 
    i.id,
    i.number,
    i.date,
    i.store_name,
    i.total_amount,
    s.name as store_name_registered,
    l.name as list_name,
    COUNT(ii.id) as items_count,
    i.created_at,
    i.user_id
FROM invoices i
LEFT JOIN stores s ON i.store_id = s.id
LEFT JOIN lists l ON i.list_id = l.id
LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
GROUP BY i.id, s.name, l.name;

COMMENT ON VIEW invoice_summary IS 'Resumo das notas fiscais com informações agregadas';