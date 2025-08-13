-- Correção das políticas RLS para evitar acesso direto à tabela auth.users

-- Remover políticas problemáticas
DROP POLICY IF EXISTS "Invitees can view their invitations" ON invitations;
DROP POLICY IF EXISTS "Invitees can update invitation status" ON invitations;

-- Recriar políticas sem acessar auth.users diretamente
CREATE POLICY "Invitees can view their invitations" ON invitations
  FOR SELECT USING (
    invitee_user_id = auth.uid() OR 
    invitee_email = auth.email()
  );

CREATE POLICY "Invitees can update invitation status" ON invitations
  FOR UPDATE USING (
    invitee_user_id = auth.uid() OR 
    invitee_email = auth.email()
  );

-- Atualizar funções para não acessar auth.users diretamente
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
) AS $$
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
    'Proprietário da Lista' as shared_by,
    ls.permission,
    l.is_shared
  FROM lists l
  JOIN list_shares ls ON l.id = ls.list_id
  WHERE ls.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.list_id,
    l.name as list_name,
    i.inviter_user_id,
    'Usuário que convidou' as inviter_email,
    i.invitee_email,
    i.permission,
    i.created_at,
    i.expires_at
  FROM invitations i
  JOIN lists l ON i.list_id = l.id
  WHERE i.invitee_email = user_email 
    AND i.status = 'pending'
    AND i.expires_at > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;