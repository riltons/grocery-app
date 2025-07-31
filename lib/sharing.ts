import { supabase } from './supabase';
import type { 
  ListShare, 
  Invitation, 
  ShareLink, 
  SharePermission, 
  InvitationStatus 
} from './supabase';

/**
 * Serviço principal para gerenciamento de compartilhamento de listas
 */
export class SharingService {
  
  /**
   * Convida um usuário para compartilhar uma lista
   */
  async inviteUser(
    listId: string, 
    userEmail: string, 
    permission: SharePermission
  ): Promise<Invitation> {
    // Validar entrada
    if (!listId || !userEmail || !permission) {
      throw new Error('Parâmetros obrigatórios não fornecidos');
    }

    if (!this.isValidEmail(userEmail)) {
      throw new Error('Email inválido');
    }

    if (!this.isValidPermission(permission)) {
      throw new Error('Permissão inválida');
    }

    // Verificar se o usuário atual é proprietário da lista
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('user_id')
      .eq('id', listId)
      .single();

    if (listError) {
      throw new Error(`Erro ao verificar lista: ${listError.message}`);
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || list.user_id !== user.id) {
      throw new Error('Apenas o proprietário da lista pode convidar usuários');
    }

    // Verificar se já existe um convite pendente para este email
    const { data: existingInvitation } = await supabase
      .from('invitations')
      .select('id, status')
      .eq('list_id', listId)
      .eq('invitee_email', userEmail)
      .eq('status', 'pending')
      .single();

    if (existingInvitation) {
      throw new Error('Já existe um convite pendente para este usuário');
    }

    // Verificar se o usuário já é participante da lista
    const { data: existingShare } = await supabase
      .from('list_shares')
      .select('id')
      .eq('list_id', listId)
      .eq('user_id', user.id)
      .single();

    if (existingShare) {
      throw new Error('Usuário já é participante desta lista');
    }

    // Buscar o user_id do convidado se ele já estiver cadastrado
    const { data: inviteeUser } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', userEmail)
      .single();

    // Criar o convite
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .insert({
        list_id: listId,
        inviter_user_id: user.id,
        invitee_email: userEmail,
        invitee_user_id: inviteeUser?.id || null,
        permission,
        status: 'pending'
      })
      .select()
      .single();

    if (invitationError) {
      throw new Error(`Erro ao criar convite: ${invitationError.message}`);
    }

    return invitation;
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
      throw new Error(`Erro ao buscar convite: ${invitationError.message}`);
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
      throw new Error(`Erro ao criar compartilhamento: ${shareError.message}`);
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

    // Buscar o convite
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', invitationId)
      .single();

    if (invitationError) {
      throw new Error(`Erro ao buscar convite: ${invitationError.message}`);
    }

    // Verificar se o usuário pode rejeitar este convite
    if (invitation.invitee_email !== user.email && invitation.invitee_user_id !== user.id) {
      throw new Error('Você não tem permissão para rejeitar este convite');
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
      throw new Error(`Erro ao atualizar convite: ${updateError.message}`);
    }
  }

  /**
   * Atualiza a permissão de um participante
   */
  async updatePermission(shareId: string, permission: SharePermission): Promise<void> {
    if (!this.isValidPermission(permission)) {
      throw new Error('Permissão inválida');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    // Verificar se o usuário tem permissão para alterar permissões
    const { data: share, error: shareError } = await supabase
      .from('list_shares')
      .select(`
        *,
        lists!inner(user_id)
      `)
      .eq('id', shareId)
      .single();

    if (shareError) {
      throw new Error(`Erro ao buscar compartilhamento: ${shareError.message}`);
    }

    // Apenas o proprietário da lista pode alterar permissões
    if (share.lists.user_id !== user.id) {
      throw new Error('Apenas o proprietário da lista pode alterar permissões');
    }

    // Atualizar a permissão
    const { error: updateError } = await supabase
      .from('list_shares')
      .update({ permission })
      .eq('id', shareId);

    if (updateError) {
      throw new Error(`Erro ao atualizar permissão: ${updateError.message}`);
    }
  }

  /**
   * Remove um participante da lista
   */
  async removeParticipant(shareId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    // Verificar se o usuário tem permissão para remover participantes
    const { data: share, error: shareError } = await supabase
      .from('list_shares')
      .select(`
        *,
        lists!inner(user_id)
      `)
      .eq('id', shareId)
      .single();

    if (shareError) {
      throw new Error(`Erro ao buscar compartilhamento: ${shareError.message}`);
    }

    // Apenas o proprietário da lista pode remover participantes
    if (share.lists.user_id !== user.id) {
      throw new Error('Apenas o proprietário da lista pode remover participantes');
    }

    // Remover o compartilhamento
    const { error: deleteError } = await supabase
      .from('list_shares')
      .delete()
      .eq('id', shareId);

    if (deleteError) {
      throw new Error(`Erro ao remover participante: ${deleteError.message}`);
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

    // Verificar se o usuário é participante da lista
    const { data: share, error: shareError } = await supabase
      .from('list_shares')
      .select('id')
      .eq('list_id', listId)
      .eq('user_id', user.id)
      .single();

    if (shareError) {
      throw new Error('Você não é participante desta lista');
    }

    // Remover o compartilhamento
    const { error: deleteError } = await supabase
      .from('list_shares')
      .delete()
      .eq('id', share.id);

    if (deleteError) {
      throw new Error(`Erro ao sair da lista: ${deleteError.message}`);
    }
  }

  /**
   * Transfere a propriedade de uma lista para outro usuário
   */
  async transferOwnership(listId: string, newOwnerId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    // Verificar se o usuário atual é proprietário da lista
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('user_id')
      .eq('id', listId)
      .single();

    if (listError) {
      throw new Error(`Erro ao verificar lista: ${listError.message}`);
    }

    if (list.user_id !== user.id) {
      throw new Error('Apenas o proprietário pode transferir a propriedade');
    }

    // Verificar se o novo proprietário é participante da lista
    const { data: newOwnerShare, error: shareError } = await supabase
      .from('list_shares')
      .select('id')
      .eq('list_id', listId)
      .eq('user_id', newOwnerId)
      .single();

    if (shareError) {
      throw new Error('O novo proprietário deve ser participante da lista');
    }

    // Transferir a propriedade
    const { error: updateError } = await supabase
      .from('lists')
      .update({ user_id: newOwnerId })
      .eq('id', listId);

    if (updateError) {
      throw new Error(`Erro ao transferir propriedade: ${updateError.message}`);
    }

    // Remover o compartilhamento do novo proprietário (ele agora é dono)
    await supabase
      .from('list_shares')
      .delete()
      .eq('id', newOwnerShare.id);

    // Adicionar o antigo proprietário como participante com permissão admin
    await supabase
      .from('list_shares')
      .insert({
        list_id: listId,
        user_id: user.id,
        permission: 'admin',
        created_by: newOwnerId
      });
  }

  /**
   * Gera um link de compartilhamento
   */
  async generateShareLink(
    listId: string, 
    permission: SharePermission, 
    expiresIn: number = 7 * 24 * 60 * 60 * 1000 // 7 dias em ms
  ): Promise<ShareLink> {
    if (!this.isValidPermission(permission)) {
      throw new Error('Permissão inválida');
    }

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
      throw new Error(`Erro ao verificar lista: ${listError.message}`);
    }

    if (list.user_id !== user.id) {
      throw new Error('Apenas o proprietário pode gerar links de compartilhamento');
    }

    // Gerar token único
    const token = this.generateSecureToken();
    const expiresAt = new Date(Date.now() + expiresIn);

    // Criar o link de compartilhamento
    const { data: shareLink, error: linkError } = await supabase
      .from('share_links')
      .insert({
        list_id: listId,
        token,
        permission,
        expires_at: expiresAt.toISOString(),
        created_by: user.id
      })
      .select()
      .single();

    if (linkError) {
      throw new Error(`Erro ao criar link: ${linkError.message}`);
    }

    return shareLink;
  }

  // Métodos utilitários privados

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPermission(permission: string): permission is SharePermission {
    return ['view', 'edit', 'admin'].includes(permission);
  }

  private generateSecureToken(): string {
    // Gerar token seguro de 32 caracteres
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

// Instância singleton do serviço
export const sharingService = new SharingService();
/**

 * Gerenciador específico para convites de compartilhamento
 */
export class InviteManager {
  
  /**
   * Busca usuários por email para convite
   */
  async searchUsersByEmail(email: string): Promise<{ id: string; email: string; name?: string }[]> {
    if (!email || email.length < 3) {
      return [];
    }

    try {
      // Buscar usuários cadastrados que correspondem ao email
      const { data: users, error } = await supabase
        .from('auth.users')
        .select('id, email, raw_user_meta_data')
        .ilike('email', `%${email}%`)
        .limit(10);

      if (error) {
        console.error('Erro ao buscar usuários:', error);
        return [];
      }

      return users?.map(user => ({
        id: user.id,
        email: user.email,
        name: user.raw_user_meta_data?.name || user.email.split('@')[0]
      })) || [];

    } catch (error) {
      console.error('Erro na busca de usuários:', error);
      return [];
    }
  }

  /**
   * Envia convite com validação completa
   */
  async sendInviteWithValidation(
    listId: string,
    userEmail: string,
    permission: SharePermission
  ): Promise<{ success: boolean; invitation?: Invitation; error?: string }> {
    try {
      // Validações básicas
      if (!this.isValidEmail(userEmail)) {
        return { success: false, error: 'Email inválido' };
      }

      if (!this.isValidPermission(permission)) {
        return { success: false, error: 'Permissão inválida' };
      }

      // Verificar se o usuário não está tentando convidar a si mesmo
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email === userEmail) {
        return { success: false, error: 'Você não pode convidar a si mesmo' };
      }

      // Verificar limite de participantes (máximo 20 por lista)
      const { count: participantCount } = await supabase
        .from('list_shares')
        .select('*', { count: 'exact', head: true })
        .eq('list_id', listId);

      if (participantCount && participantCount >= 20) {
        return { success: false, error: 'Limite máximo de 20 participantes por lista atingido' };
      }

      // Usar o SharingService para criar o convite
      const invitation = await sharingService.inviteUser(listId, userEmail, permission);
      
      return { success: true, invitation };

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  /**
   * Lista convites pendentes para um usuário
   */
  async getPendingInvitations(userEmail?: string): Promise<Invitation[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const emailToSearch = userEmail || user.email;
    if (!emailToSearch) {
      return [];
    }

    const { data: invitations, error } = await supabase
      .from('invitations')
      .select(`
        *,
        lists!inner(name),
        inviter:auth.users!inviter_user_id(email, raw_user_meta_data)
      `)
      .eq('invitee_email', emailToSearch)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar convites: ${error.message}`);
    }

    return invitations || [];
  }

  /**
   * Lista convites enviados por um usuário
   */
  async getSentInvitations(listId?: string): Promise<Invitation[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    let query = supabase
      .from('invitations')
      .select(`
        *,
        lists!inner(name)
      `)
      .eq('inviter_user_id', user.id);

    if (listId) {
      query = query.eq('list_id', listId);
    }

    const { data: invitations, error } = await query
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar convites enviados: ${error.message}`);
    }

    return invitations || [];
  }

  /**
   * Verifica e marca convites expirados
   */
  async expireOldInvitations(): Promise<number> {
    const { data: expiredInvitations, error } = await supabase
      .from('invitations')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString())
      .select('id');

    if (error) {
      throw new Error(`Erro ao expirar convites: ${error.message}`);
    }

    return expiredInvitations?.length || 0;
  }

  /**
   * Cancela um convite pendente
   */
  async cancelInvitation(invitationId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    // Verificar se o usuário é o remetente do convite
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .select('inviter_user_id, status')
      .eq('id', invitationId)
      .single();

    if (invitationError) {
      throw new Error(`Erro ao buscar convite: ${invitationError.message}`);
    }

    if (invitation.inviter_user_id !== user.id) {
      throw new Error('Apenas o remetente pode cancelar o convite');
    }

    if (invitation.status !== 'pending') {
      throw new Error('Apenas convites pendentes podem ser cancelados');
    }

    // Cancelar o convite
    const { error: updateError } = await supabase
      .from('invitations')
      .update({ 
        status: 'expired',
        responded_at: new Date().toISOString()
      })
      .eq('id', invitationId);

    if (updateError) {
      throw new Error(`Erro ao cancelar convite: ${updateError.message}`);
    }
  }

  /**
   * Reenvia um convite expirado
   */
  async resendInvitation(invitationId: string): Promise<Invitation> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    // Buscar o convite original
    const { data: originalInvitation, error: invitationError } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', invitationId)
      .single();

    if (invitationError) {
      throw new Error(`Erro ao buscar convite: ${invitationError.message}`);
    }

    if (originalInvitation.inviter_user_id !== user.id) {
      throw new Error('Apenas o remetente pode reenviar o convite');
    }

    if (originalInvitation.status === 'accepted') {
      throw new Error('Convite já foi aceito');
    }

    // Marcar o convite original como expirado
    await supabase
      .from('invitations')
      .update({ status: 'expired' })
      .eq('id', invitationId);

    // Criar novo convite
    const newInvitation = await sharingService.inviteUser(
      originalInvitation.list_id,
      originalInvitation.invitee_email,
      originalInvitation.permission
    );

    return newInvitation;
  }

  // Métodos utilitários privados
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPermission(permission: string): permission is SharePermission {
    return ['view', 'edit', 'admin'].includes(permission);
  }
}

// Instância singleton do gerenciador de convites
export const inviteManager = new InviteManager();

/**
 * Gerenciador de permissões para listas compartilhadas
 */
export class PermissionManager {

  /**
   * Verifica se um usuário tem permissão para realizar uma ação específica
   */
  async checkPermission(
    listId: string, 
    userId: string, 
    action: 'view' | 'edit' | 'admin' | 'delete'
  ): Promise<boolean> {
    try {
      // Verificar se é o proprietário da lista
      const { data: list, error: listError } = await supabase
        .from('lists')
        .select('user_id')
        .eq('id', listId)
        .single();

      if (listError) {
        return false;
      }

      // Proprietário tem todas as permissões
      if (list.user_id === userId) {
        return true;
      }

      // Verificar permissões de compartilhamento
      const { data: share, error: shareError } = await supabase
        .from('list_shares')
        .select('permission')
        .eq('list_id', listId)
        .eq('user_id', userId)
        .single();

      if (shareError) {
        return false; // Usuário não é participante
      }

      // Verificar permissões baseadas na ação
      return this.hasPermissionForAction(share.permission, action);

    } catch (error) {
      console.error('Erro ao verificar permissão:', error);
      return false;
    }
  }

  /**
   * Verifica permissões para o usuário atual
   */
  async checkCurrentUserPermission(
    listId: string, 
    action: 'view' | 'edit' | 'admin' | 'delete'
  ): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return false;
    }

    return this.checkPermission(listId, user.id, action);
  }

  /**
   * Obtém as permissões de um usuário para uma lista
   */
  async getUserPermissions(listId: string, userId: string): Promise<{
    isOwner: boolean;
    permission?: SharePermission;
    canView: boolean;
    canEdit: boolean;
    canAdmin: boolean;
    canDelete: boolean;
  }> {
    try {
      // Verificar se é proprietário
      const { data: list, error: listError } = await supabase
        .from('lists')
        .select('user_id')
        .eq('id', listId)
        .single();

      if (listError) {
        throw new Error(`Erro ao buscar lista: ${listError.message}`);
      }

      const isOwner = list.user_id === userId;

      if (isOwner) {
        return {
          isOwner: true,
          canView: true,
          canEdit: true,
          canAdmin: true,
          canDelete: true
        };
      }

      // Buscar permissões de compartilhamento
      const { data: share, error: shareError } = await supabase
        .from('list_shares')
        .select('permission')
        .eq('list_id', listId)
        .eq('user_id', userId)
        .single();

      if (shareError) {
        // Usuário não é participante
        return {
          isOwner: false,
          canView: false,
          canEdit: false,
          canAdmin: false,
          canDelete: false
        };
      }

      const permission = share.permission;

      return {
        isOwner: false,
        permission,
        canView: this.hasPermissionForAction(permission, 'view'),
        canEdit: this.hasPermissionForAction(permission, 'edit'),
        canAdmin: this.hasPermissionForAction(permission, 'admin'),
        canDelete: false // Apenas proprietário pode deletar
      };

    } catch (error) {
      throw new Error(`Erro ao obter permissões: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Altera permissões de um participante (apenas proprietário)
   */
  async changeParticipantPermission(
    listId: string,
    participantUserId: string,
    newPermission: SharePermission
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    // Verificar se o usuário atual é proprietário
    const isOwner = await this.checkPermission(listId, user.id, 'admin');
    if (!isOwner) {
      throw new Error('Apenas o proprietário pode alterar permissões');
    }

    // Verificar se o participante existe
    const { data: share, error: shareError } = await supabase
      .from('list_shares')
      .select('id')
      .eq('list_id', listId)
      .eq('user_id', participantUserId)
      .single();

    if (shareError) {
      throw new Error('Participante não encontrado');
    }

    // Atualizar permissão
    const { error: updateError } = await supabase
      .from('list_shares')
      .update({ permission: newPermission })
      .eq('id', share.id);

    if (updateError) {
      throw new Error(`Erro ao alterar permissão: ${updateError.message}`);
    }
  }

  /**
   * Remove um participante da lista (apenas proprietário)
   */
  async removeParticipant(listId: string, participantUserId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    // Verificar se o usuário atual é proprietário
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('user_id')
      .eq('id', listId)
      .single();

    if (listError) {
      throw new Error(`Erro ao verificar lista: ${listError.message}`);
    }

    if (list.user_id !== user.id) {
      throw new Error('Apenas o proprietário pode remover participantes');
    }

    // Não permitir que o proprietário remova a si mesmo
    if (participantUserId === user.id) {
      throw new Error('O proprietário não pode se remover da lista');
    }

    // Remover o participante
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
   * Lista todos os participantes de uma lista com suas permissões
   */
  async getListParticipants(listId: string): Promise<Array<{
    id: string;
    userId: string;
    email: string;
    name?: string;
    permission: SharePermission;
    isOwner: boolean;
    joinedAt: string;
  }>> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    // Verificar se o usuário tem acesso à lista
    const hasAccess = await this.checkPermission(listId, user.id, 'view');
    if (!hasAccess) {
      throw new Error('Você não tem acesso a esta lista');
    }

    // Buscar proprietário da lista
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select(`
        user_id,
        auth.users!inner(email, raw_user_meta_data)
      `)
      .eq('id', listId)
      .single();

    if (listError) {
      throw new Error(`Erro ao buscar proprietário: ${listError.message}`);
    }

    // Buscar participantes
    const { data: shares, error: sharesError } = await supabase
      .from('list_shares')
      .select(`
        id,
        user_id,
        permission,
        created_at,
        auth.users!inner(email, raw_user_meta_data)
      `)
      .eq('list_id', listId);

    if (sharesError) {
      throw new Error(`Erro ao buscar participantes: ${sharesError.message}`);
    }

    const participants = [];

    // Adicionar proprietário
    participants.push({
      id: 'owner',
      userId: list.user_id,
      email: list.auth.users.email,
      name: list.auth.users.raw_user_meta_data?.name || list.auth.users.email.split('@')[0],
      permission: 'admin' as SharePermission,
      isOwner: true,
      joinedAt: new Date().toISOString() // Proprietário "entrou" quando criou a lista
    });

    // Adicionar participantes
    shares?.forEach(share => {
      participants.push({
        id: share.id,
        userId: share.user_id,
        email: share.auth.users.email,
        name: share.auth.users.raw_user_meta_data?.name || share.auth.users.email.split('@')[0],
        permission: share.permission,
        isOwner: false,
        joinedAt: share.created_at
      });
    });

    return participants;
  }

  /**
   * Transfere a propriedade da lista para outro participante
   */
  async transferOwnership(listId: string, newOwnerId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    // Verificar se o usuário atual é proprietário
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('user_id')
      .eq('id', listId)
      .single();

    if (listError) {
      throw new Error(`Erro ao verificar lista: ${listError.message}`);
    }

    if (list.user_id !== user.id) {
      throw new Error('Apenas o proprietário pode transferir a propriedade');
    }

    // Verificar se o novo proprietário é participante
    const { data: newOwnerShare, error: shareError } = await supabase
      .from('list_shares')
      .select('id, permission')
      .eq('list_id', listId)
      .eq('user_id', newOwnerId)
      .single();

    if (shareError) {
      throw new Error('O novo proprietário deve ser um participante da lista');
    }

    // Transferir propriedade
    const { error: updateError } = await supabase
      .from('lists')
      .update({ user_id: newOwnerId })
      .eq('id', listId);

    if (updateError) {
      throw new Error(`Erro ao transferir propriedade: ${updateError.message}`);
    }

    // Remover o novo proprietário da lista de participantes
    await supabase
      .from('list_shares')
      .delete()
      .eq('id', newOwnerShare.id);

    // Adicionar o antigo proprietário como participante admin
    await supabase
      .from('list_shares')
      .insert({
        list_id: listId,
        user_id: user.id,
        permission: 'admin',
        created_by: newOwnerId
      });
  }

  // Métodos utilitários privados

  /**
   * Verifica se uma permissão permite uma ação específica
   */
  private hasPermissionForAction(permission: SharePermission, action: string): boolean {
    const permissionLevels = {
      view: ['view'],
      edit: ['view', 'edit'],
      admin: ['view', 'edit', 'admin']
    };

    return permissionLevels[permission]?.includes(action) || false;
  }

  /**
   * Obtém o nível numérico de uma permissão (para comparações)
   */
  private getPermissionLevel(permission: SharePermission): number {
    const levels = { view: 1, edit: 2, admin: 3 };
    return levels[permission] || 0;
  }
}

// Instância singleton do gerenciador de permissões
export const permissionManager = new PermissionManager();