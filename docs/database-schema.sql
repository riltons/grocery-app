-- Esquema do banco de dados para o aplicativo de lista de supermercado

-- Habilitar a extensão pgvector para embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabela de usuários (gerenciada pelo Supabase Auth)
-- Esta tabela é criada automaticamente pelo Supabase

-- Tabela de produtos genéricos
CREATE TABLE public.generic_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Tabela de produtos específicos
CREATE TABLE public.specific_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  generic_product_id UUID NOT NULL REFERENCES public.generic_products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Tabela de listas
CREATE TABLE public.lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Tabela de itens da lista
CREATE TABLE public.list_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT,
  checked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Tabela de relação entre itens da lista e produtos específicos
CREATE TABLE public.list_item_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_item_id UUID NOT NULL REFERENCES public.list_items(id) ON DELETE CASCADE,
  specific_product_id UUID NOT NULL REFERENCES public.specific_products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Tabela de lojas
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Tabela de histórico de preços
CREATE TABLE public.price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  specific_product_id UUID NOT NULL REFERENCES public.specific_products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Políticas RLS (Row Level Security)

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.generic_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specific_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_item_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

-- Políticas para generic_products
CREATE POLICY "Usuários podem ver seus próprios produtos genéricos" 
  ON public.generic_products FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios produtos genéricos" 
  ON public.generic_products FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios produtos genéricos" 
  ON public.generic_products FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir seus próprios produtos genéricos" 
  ON public.generic_products FOR DELETE 
  USING (auth.uid() = user_id);

-- Políticas para specific_products (similar para as demais tabelas)
CREATE POLICY "Usuários podem ver seus próprios produtos específicos" 
  ON public.specific_products FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios produtos específicos" 
  ON public.specific_products FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios produtos específicos" 
  ON public.specific_products FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir seus próprios produtos específicos" 
  ON public.specific_products FOR DELETE 
  USING (auth.uid() = user_id);

-- Políticas similares para as demais tabelas (lists, list_items, list_item_products, stores, price_history)
-- Seguindo o mesmo padrão de permissão apenas para o próprio usuário