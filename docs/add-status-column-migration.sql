-- Migração para adicionar coluna status na tabela lists
-- Execute este SQL no Supabase SQL Editor

-- Adicionar coluna status à tabela lists
ALTER TABLE lists 
ADD COLUMN status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'finished'));

-- Criar índice para melhor performance nas consultas por status
CREATE INDEX IF NOT EXISTS idx_lists_status ON lists(status);

-- Atualizar listas existentes para ter status 'pending' por padrão
UPDATE lists SET status = 'pending' WHERE status IS NULL;

-- Comentário para documentação
COMMENT ON COLUMN lists.status IS 'Status da lista: pending (pendente) ou finished (finalizada)';