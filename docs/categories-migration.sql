-- Migração para criar tabela de categorias
-- Execute este SQL no Supabase SQL Editor

-- 1. Criar tabela de categorias
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50) NOT NULL DEFAULT 'basket',
    color VARCHAR(7) DEFAULT '#4CAF50',
    description TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT categories_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT categories_icon_not_empty CHECK (LENGTH(TRIM(icon)) > 0),
    CONSTRAINT categories_color_format CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT categories_unique_name_per_user UNIQUE (user_id, name)
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_created_at ON public.categories(created_at);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS
-- Política para SELECT: usuários podem ver apenas suas próprias categorias
CREATE POLICY "Users can view own categories" ON public.categories
    FOR SELECT USING (auth.uid() = user_id);

-- Política para INSERT: usuários podem criar suas próprias categorias
CREATE POLICY "Users can insert own categories" ON public.categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE: usuários podem atualizar apenas suas próprias categorias
CREATE POLICY "Users can update own categories" ON public.categories
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para DELETE: usuários podem deletar apenas suas próprias categorias
CREATE POLICY "Users can delete own categories" ON public.categories
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Criar trigger para atualizar updated_at
CREATE TRIGGER handle_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 7. Inserir categorias padrão (opcional - será feito via código)
-- As categorias padrão serão criadas automaticamente pelo CategoryService
-- quando um usuário não tiver categorias

-- 8. Atualizar tabela generic_products para usar UUID em category (se necessário)
-- Verificar se a coluna category em generic_products precisa ser alterada
-- para referenciar a nova tabela de categorias

-- NOTA: Se você quiser migrar categorias existentes (strings) para a nova tabela:
-- 1. Primeiro execute esta migração
-- 2. Execute o script de migração de dados (categories-data-migration.sql)
-- 3. Depois altere a coluna category em generic_products para UUID

-- Para verificar se a migração foi executada com sucesso:
-- SELECT * FROM public.categories LIMIT 5;
-- SELECT COUNT(*) FROM public.categories;

-- Para testar as políticas RLS:
-- INSERT INTO public.categories (name, icon, user_id) VALUES ('Teste', 'basket', auth.uid());
-- SELECT * FROM public.categories WHERE user_id = auth.uid();