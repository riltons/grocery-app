-- Tabelas para o sistema de compartilhamento de listas

-- Tabela para compartilhamentos de listas
CREATE TABLE IF NOT EXISTS list_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission VARCHAR(10) NOT NULL CHECK (permission IN ('view', 'edit', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(list_id, user_id)
);

-- Tabela para convites de compartilhamento
CREATE TABLE IF NOT EXISTS invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  inviter_user_id UUID NOT NULL REFERENCES auth.users(id),
  invitee_email VARCHAR(255) NOT NULL,
  invitee_user_id UUID REFERENCES auth.users(id),
  permission VARCHAR(10) NOT NULL CHECK (permission IN ('view', 'edit', 'admin')),
  status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(list_id, invitee_email)
);

-- Tabela para links de compartilhamento
CREATE TABLE IF NOT EXISTS share_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  permission VARCHAR(10) NOT NULL CHECK (permission IN ('view', 'edit', 'admin')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_list_shares_list_id ON list_shares(list_id);
CREATE INDEX IF NOT EXISTS idx_list_shares_user_id ON list_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_invitee_email ON invitations(invitee_email);
CREATE INDEX IF NOT EXISTS idx_invitations_invitee_user_id ON invitations(invitee_user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_share_links_token ON share_links(token);
CREATE INDEX IF NOT EXISTS idx_share_links_list_id ON share_links(list_id);

-- Extensão da tabela lists para suporte a compartilhamento
ALTER TABLE lists 
ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS share_settings JSONB DEFAULT '{"allowInvites": true, "defaultPermission": "edit"}';

-- Função para atualizar is_shared automaticamente
CREATE OR REPLACE FUNCTION update_list_shared_status()
RETURNS TRIGGER AS $
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE lists 
    SET is_shared = true
    WHERE id = NEW.list_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE lists 
    SET is_shared = EXISTS(SELECT 1 FROM list_shares WHERE list_id = OLD.list_id)
    WHERE id = OLD.list_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$ LANGUAGE plpgsql;

-- Trigger para atualizar status automaticamente
DROP TRIGGER IF EXISTS trigger_update_list_shared_status ON list_shares;
CREATE TRIGGER trigger_update_list_shared_status
  AFTER INSERT OR DELETE ON list_shares
  FOR EACH ROW
  EXECUTE FUNCTION update_list_shared_status();

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_list_shares_updated_at 
    BEFORE UPDATE ON list_shares 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE list_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para list_shares
CREATE POLICY "Users can view list shares they participate in" ON list_shares
  FOR SELECT USING (
    user_id = auth.uid() OR 
    list_id IN (
      SELECT id FROM lists WHERE user_id = auth.uid()
    ) OR
    list_id IN (
      SELECT list_id FROM list_shares WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "List owners can manage shares" ON list_shares
  FOR ALL USING (
    list_id IN (
      SELECT id FROM lists WHERE user_id = auth.uid()
    )
  );

-- Políticas RLS para invitations
CREATE POLICY "Inviters can view their invitations" ON invitations
  FOR SELECT USING (inviter_user_id = auth.uid());

CREATE POLICY "Invitees can view their invitations" ON invitations
  FOR SELECT USING (
    invitee_user_id = auth.uid() OR 
    invitee_email IN (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Inviters can create invitations" ON invitations
  FOR INSERT WITH CHECK (inviter_user_id = auth.uid());

CREATE POLICY "Invitees can update invitation status" ON invitations
  FOR UPDATE USING (
    invitee_user_id = auth.uid() OR 
    invitee_email IN (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- Políticas RLS para share_links
CREATE POLICY "List owners can manage share links" ON share_links
  FOR ALL USING (
    list_id IN (
      SELECT id FROM lists WHERE user_id = auth.uid()
    )
  );

-- Função para buscar listas compartilhadas de um usuário
CREATE OR REPLACE FUNCTION get_shared_lists(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  user_id UUID,
  status VARCHAR,
  items_count INTEGER,
  shared_by VARCHAR,
  permission VARCHAR,
  is_shared BOOLEAN
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.name,
    l.created_at,
    l.updated_at,
    l.user_id,
    l.status,
    l.items_count,
    u.email as shared_by,
    ls.permission,
    l.is_shared
  FROM lists l
  JOIN list_shares ls ON l.id = ls.list_id
  LEFT JOIN auth.users u ON l.user_id = u.id
  WHERE ls.user_id = user_uuid;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para buscar convites pendentes de um usuário
CREATE OR REPLACE FUNCTION get_pending_invitations(user_email VARCHAR)
RETURNS TABLE (
  id UUID,
  list_id UUID,
  list_name VARCHAR,
  inviter_user_id UUID,
  inviter_email VARCHAR,
  invitee_email VARCHAR,
  permission VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.list_id,
    l.name as list_name,
    i.inviter_user_id,
    u.email as inviter_email,
    i.invitee_email,
    i.permission,
    i.created_at,
    i.expires_at
  FROM invitations i
  JOIN lists l ON i.list_id = l.id
  LEFT JOIN auth.users u ON i.inviter_user_id = u.id
  WHERE i.invitee_email = user_email 
    AND i.status = 'pending'
    AND i.expires_at > NOW();
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários para documentação
COMMENT ON TABLE list_shares IS 'Compartilhamentos de listas entre usuários';
COMMENT ON TABLE invitations IS 'Convites de compartilhamento pendentes';
COMMENT ON TABLE share_links IS 'Links de compartilhamento público';
COMMENT ON COLUMN list_shares.permission IS 'Nível de permissão: view, edit, admin';
COMMENT ON COLUMN invitations.status IS 'Status do convite: pending, accepted, rejected, expired';
COMMENT ON COLUMN share_links.is_active IS 'Indica se o link está ativo';