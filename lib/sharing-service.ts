import { supabase } from './supabase';
import type { SharePermission } from './supabase';

export interface ShareInvitation {
  id: string;
  list_id: string;
  list_name: string;
  inviter_user_id: string;
  inviter_email: string;
  invitee_email: string;
  permission: SharePermission;
  created_at: string;
  expires_at: string;
}

export interface SharedList {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  status: string;
  items_count: number;
  shared_by: string;
  permission: SharePermission;
  is_shared: boolean;
}

export interface ListParticipant {
  id: string;
  userId: string;
  email: string;
  name?: string;
  permission: SharePermission;
  isOwner: boolean;
  joinedAt: string;
}

/**
 * Serviço simplificado para compartilhamento de listas
 */
export class SharingServiceReal {
  
  /**
   * Convida um usuário para compartilhar uma lista
   */
  async inviteUser(listId: string, userEmail: string, permission: SharePermission): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    // Verificar se o usuário é proprietário da lista
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('user_id, name')
      .eq('id', listId)
      .single();

    if (listError) {
      throw new Error('Lista não encontrada');
    }

    if (list.user_id !== user.id) {
      throw new Error('Apenas o proprietário pode convidar usuários');
    }

    // Verificar se já existe um convite pendente
    const { data: existingInvitation } = await supabase
      .from('invitations')
      .select('id')
      .eq('list_id', listId)
      .eq('invitee_email', userEmail)
      .eq('status', 'pending')
      .single();

    if (existingInvitation) {
      throw new Error('Já existe um convite pendente para este usuário');
    }

    // Criar o convite (invitee_user_id será preenchido quando o usuário aceitar)
    const { error: inviteError } = await supabase
      .from('invitations')
      .insert({
        list_id: listId,
        inviter_user_id: user.id,
        invitee_email: userEmail,
        invitee_user_id: null, // Será preenchido quando aceitar
        permission: permission,
        status: 'pending'
      });

    if (inviteError) {
      throw new Error(`Erro ao criar convite: ${inviteError.message}`);
    }
  }

  /**
   * Busca convites enviados para uma lista
   */
  async getSentInvitations(listId: string): Promise<ShareInvitation[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const { data: invitations, error } = await supabase
      .from('invitations')
      .select(`
        id,
        list_id,
        inviter_user_id,
        invitee_email,
        permission,
        created_at,
        expires_at,
        lists!inner(name)
      `)
      .eq('list_id', listId)
      .eq('inviter_user_id', user.id)
      .eq('status', 'pending');

    if (error) {
      throw new Error(`Erro ao buscar convites: ${error.message}`);
    }

    return (invitations || []).map(inv => ({
      id: inv.id,
      list_id: inv.list_id,
      list_name: (inv.lists as any)?.name || 'Lista',
      inviter_user_id: inv.inviter_user_id,
      inviter_email: user.email || 'Você',
      invitee_email: inv.invitee_email,
      permission: inv.permission,
      created_at: inv.created_at,
      expires_at: inv.expires_at
    }));
  }

  /**
   * Busca participantes de uma lista
   */
  async getListParticipants(listId: string): Promise<ListParticipant[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    // Buscar proprietário da lista
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('user_id, created_at')
      .eq('id', listId)
      .single();

    if (listError) {
      throw new Error('Lista não encontrada');
    }

    const participants: ListParticipant[] = [];

    // Adicionar proprietário
    participants.push({
      id: 'owner',
      userId: list.user_id,
      email: 'Você (Proprietário)',
      name: 'Proprietário',
      permission: 'admin',
      isOwner: true,
      joinedAt: list.created_at
    });

    // Buscar participantes compartilhados
    const { data: shares, error: sharesError } = await supabase
      .from('list_shares')
      .select('id, user_id, permission, created_at')
      .eq('list_id', listId);

    if (sharesError) {
      console.error('Erro ao buscar participantes:', sharesError);
      return participants;
    }

    // Adicionar participantes (sem buscar dados do auth.users por limitações de RLS)
    shares?.forEach(share => {
      participants.push({
        id: share.id,
        userId: share.user_id,
        email: 'Usuário Compartilhado',
        name: 'Participante',
        permission: share.permission,
        isOwner: false,
        joinedAt: share.created_at
      });
    });

    return participants;
  }

  /**
   * Remove um participante da lista
   */
  async removeParticipant(listId: string, participantUserId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    // Verificar se o usuário é proprietário da lista
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('user_id')
      .eq('id', listId)
      .single();

    if (listError) {
      throw new Error('Lista não encontrada');
    }

    if (list.user_id !== user.id) {
      throw new Error('Apenas o proprietário pode remover participantes');
    }

    // Remover o compartilhamento
    const { error: deleteError } = await supabase
      .from('list_shares')
      .delete()
      .eq('list_id', listId)
      .eq('user_id', participantUserId);

    if (deleteError) {
      throw new Error(`Erro ao remover participante: ${deleteError.message}`);
    }
  }

  /**
   * Busca listas compartilhadas com o usuário atual
   */
  async getSharedLists(): Promise<SharedList[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const { data: shares, error } = await supabase
      .from('list_shares')
      .select(`
        permission,
        created_at,
        lists!inner(
          id,
          name,
          created_at,
          updated_at,
          user_id,
          status,
          items_count,
          is_shared
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      throw new Error(`Erro ao buscar listas compartilhadas: ${error.message}`);
    }

    return (shares || []).map(share => ({
      id: (share.lists as any).id,
      name: (share.lists as any).name,
      created_at: (share.lists as any).created_at,
      updated_at: (share.lists as any).updated_at,
      user_id: (share.lists as any).user_id,
      status: (share.lists as any).status || 'active',
      items_count: (share.lists as any).items_count || 0,
      shared_by: 'Proprietário da Lista',
      permission: share.permission,
      is_shared: (share.lists as any).is_shared || true
    }));
  }

  /**
   * Busca convites pendentes para o usuário atual
   */
  async getPendingInvitations(): Promise<ShareInvitation[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const { data: invitations, error } = await supabase
      .from('invitations')
      .select(`
        id,
        list_id,
        inviter_user_id,
        invitee_email,
        permission,
        created_at,
        expires_at,
        lists!inner(name)
      `)
      .or(`invitee_user_id.eq.${user.id},invitee_email.eq.${user.email}`)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString());

    if (error) {
      throw new Error(`Erro ao buscar convites: ${error.message}`);
    }

    return (invitations || []).map(inv => ({
      id: inv.id,
      list_id: inv.list_id,
      list_name: (inv.lists as any)?.name || 'Lista',
      inviter_user_id: inv.inviter_user_id,
      inviter_email: 'Usuário que convidou',
      invitee_email: inv.invitee_email,
      permission: inv.permission,
      created_at: inv.created_at,
      expires_at: inv.expires_at
    }));
  }

  /**
   * Aceita um convite de compartilhamento
   */
  async acceptInvitation(invitationId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    // Buscar o convite
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', invitationId)
      .single();

    if (invitationError) {
      throw new Error('Convite não encontrado');
    }

    // Verificar se o usuário pode aceitar este convite
    if (invitation.invitee_email !== user.email && invitation.invitee_user_id !== user.id) {
      throw new Error('Você não tem permissão para aceitar este convite');
    }

    // Verificar se o convite ainda é válido
    if (invitation.status !== 'pending') {
      throw new Error('Este convite não está mais disponível');
    }

    if (new Date(invitation.expires_at) < new Date()) {
      throw new Error('Este convite expirou');
    }

    // Criar o compartilhamento
    const { error: shareError } = await supabase
      .from('list_shares')
      .insert({
        list_id: invitation.list_id,
        user_id: user.id,
        permission: invitation.permission,
        created_by: invitation.inviter_user_id
      });

    if (shareError) {
      throw new Error(`Erro ao aceitar convite: ${shareError.message}`);
    }

    // Atualizar o status do convite
    const { error: updateError } = await supabase
      .from('invitations')
      .update({
        status: 'accepted',
        responded_at: new Date().toISOString(),
        invitee_user_id: user.id
      })
      .eq('id', invitationId);

    if (updateError) {
      throw new Error(`Erro ao atualizar convite: ${updateError.message}`);
    }
  }

  /**
   * Rejeita um convite de compartilhamento
   */
  async rejectInvitation(invitationId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    // Atualizar o status do convite
    const { error: updateError } = await supabase
      .from('invitations')
      .update({
        status: 'rejected',
        responded_at: new Date().toISOString(),
        invitee_user_id: user.id
      })
      .eq('id', invitationId);

    if (updateError) {
      throw new Error(`Erro ao rejeitar convite: ${updateError.message}`);
    }
  }

  /**
   * Permite que um participante saia da lista
   */
  async leaveList(listId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    // Remover o compartilhamento
    const { error: deleteError } = await supabase
      .from('list_shares')
      .delete()
      .eq('list_id', listId)
      .eq('user_id', user.id);

    if (deleteError) {
      throw new Error(`Erro ao sair da lista: ${deleteError.message}`);
    }
  }
}

// Instância singleton do serviço
export const sharingServiceReal = new SharingServiceReal();