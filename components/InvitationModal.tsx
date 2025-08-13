import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import type { Invitation, SharePermission } from '../lib/supabase';

interface InvitationModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface MockInvitation {
  id: string;
  listName: string;
  inviterName: string;
  inviterEmail: string;
  permission: SharePermission;
  createdAt: string;
  expiresAt: string;
}

const { height: screenHeight } = Dimensions.get('window');

export default function InvitationModal({ 
  visible, 
  onClose, 
  onSuccess 
}: InvitationModalProps) {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [invitations, setInvitations] = useState<ShareInvitation[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadInvitations();
    }
  }, [visible]);

  const loadInvitations = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        setInvitations([]);
        return;
      }

      const { data: invitations, error } = await supabase
        .from('invitations')
        .select(`
          *,
          lists!inner(name)
        `)
        .eq('invitee_email', user.email)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Converter para o formato esperado pelo componente
      const formattedInvitations: MockInvitation[] = (invitations || []).map(inv => {
        const listName = (inv.lists as any)?.name || 'Lista sem nome';
        return {
          id: inv.id,
          listName,
          inviterName: 'Usuário',
          inviterEmail: 'Usuário que convidou',
          permission: inv.permission as SharePermission,
          createdAt: inv.created_at,
          expiresAt: inv.expires_at,
        };
      });

      setInvitations(formattedInvitations);
    } catch (error) {
      console.error('Erro ao carregar convites:', error);
      showError('Erro', 'Não foi possível carregar os convites');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitation: MockInvitation) => {
    setProcessingId(invitation.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showError('Erro', 'Usuário não autenticado');
        return;
      }

      // Buscar o convite completo
      const { data: fullInvitation, error: inviteError } = await supabase
        .from('invitations')
        .select('*')
        .eq('id', invitation.id)
        .single();

      if (inviteError || !fullInvitation) {
        throw new Error('Convite não encontrado');
      }

      // Criar o compartilhamento
      const { error: shareError } = await supabase
        .from('list_shares')
        .insert({
          list_id: fullInvitation.list_id,
          user_id: user.id,
          permission: fullInvitation.permission,
          created_by: fullInvitation.inviter_user_id
        });

      if (shareError) {
        throw shareError;
      }

      // Atualizar o status do convite
      const { error: updateError } = await supabase
        .from('invitations')
        .update({
          status: 'accepted',
          responded_at: new Date().toISOString(),
          invitee_user_id: user.id
        })
        .eq('id', invitation.id);

      if (updateError) {
        throw updateError;
      }

      showSuccess(
        'Convite Aceito!', 
        `Você agora tem acesso à lista "${invitation.listName}"`
      );
      
      // Remove o convite da lista
      setInvitations(prev => prev.filter(inv => inv.id !== invitation.id));
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao aceitar convite:', error);
      showError('Erro', error instanceof Error ? error.message : 'Não foi possível aceitar o convite');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectInvitation = async (invitation: MockInvitation) => {
    setProcessingId(invitation.id);
    try {
      const { error } = await supabase
        .from('invitations')
        .update({
          status: 'rejected',
          responded_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      if (error) {
        throw error;
      }
      
      showSuccess('Convite Rejeitado', 'O convite foi rejeitado');
      
      // Remove o convite da lista
      setInvitations(prev => prev.filter(inv => inv.id !== invitation.id));
    } catch (error) {
      console.error('Erro ao rejeitar convite:', error);
      showError('Erro', error instanceof Error ? error.message : 'Não foi possível rejeitar o convite');
    } finally {
      setProcessingId(null);
    }
  };

  const getPermissionLabel = (permission: SharePermission) => {
    switch (permission) {
      case 'view':
        return 'Visualizar';
      case 'edit':
        return 'Editar';
      case 'admin':
        return 'Administrar';
      default:
        return 'Visualizar';
    }
  };

  const getPermissionDescription = (permission: SharePermission) => {
    switch (permission) {
      case 'view':
        return 'Você poderá apenas visualizar a lista';
      case 'edit':
        return 'Você poderá adicionar, editar e marcar itens';
      case 'admin':
        return 'Você poderá gerenciar participantes e configurações';
      default:
        return 'Você poderá apenas visualizar a lista';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderInvitation = (invitation: MockInvitation) => (
    <View key={invitation.id} style={styles.invitationCard}>
      <View style={styles.invitationHeader}>
        <View style={styles.invitationInfo}>
          <Text style={styles.listName}>{invitation.listName}</Text>
          <Text style={styles.inviterInfo}>
            Convite de {invitation.inviterName}
          </Text>
          <Text style={styles.inviterEmail}>
            {invitation.inviterEmail}
          </Text>
        </View>
        <View style={styles.permissionBadge}>
          <Text style={styles.permissionText}>
            {getPermissionLabel(invitation.permission)}
          </Text>
        </View>
      </View>

      <View style={styles.permissionDetails}>
        <Text style={styles.permissionDescription}>
          {getPermissionDescription(invitation.permission)}
        </Text>
      </View>

      <View style={styles.invitationMeta}>
        <Text style={styles.dateText}>
          Enviado em {formatDate(invitation.createdAt)}
        </Text>
        <Text style={styles.expiryText}>
          Expira em {formatDate(invitation.expiresAt)}
        </Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.rejectButton, processingId === invitation.id && styles.buttonDisabled]}
          onPress={() => handleRejectInvitation(invitation)}
          disabled={processingId !== null}
        >
          {processingId === invitation.id ? (
            <ActivityIndicator size="small" color="#ef4444" />
          ) : (
            <>
              <Ionicons name="close" size={16} color="#ef4444" />
              <Text style={styles.rejectButtonText}>Rejeitar</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.acceptButton, processingId === invitation.id && styles.buttonDisabled]}
          onPress={() => handleAcceptInvitation(invitation)}
          disabled={processingId !== null}
        >
          {processingId === invitation.id ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Ionicons name="checkmark" size={16} color="#ffffff" />
              <Text style={styles.acceptButtonText}>Aceitar</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <View style={styles.bottomSheet}>
          <View style={styles.handle} />
          
          <View style={styles.header}>
            <Text style={styles.title}>Convites Pendentes</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>Carregando convites...</Text>
              </View>
            ) : invitations.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="mail-outline" size={64} color="#cbd5e1" />
                <Text style={styles.emptyTitle}>Nenhum convite pendente</Text>
                <Text style={styles.emptySubtitle}>
                  Quando alguém compartilhar uma lista com você, o convite aparecerá aqui
                </Text>
              </View>
            ) : (
              <View style={styles.invitationsContainer}>
                {invitations.map(renderInvitation)}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.8,
    minHeight: screenHeight * 0.4,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  invitationsContainer: {
    padding: 20,
  },
  invitationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  invitationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  invitationInfo: {
    flex: 1,
    marginRight: 12,
  },
  listName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  inviterInfo: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  inviterEmail: {
    fontSize: 12,
    color: '#94a3b8',
  },
  permissionBadge: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  permissionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4CAF50',
  },
  permissionDetails: {
    marginBottom: 12,
  },
  permissionDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  invitationMeta: {
    marginBottom: 16,
  },
  dateText: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 2,
  },
  expiryText: {
    fontSize: 12,
    color: '#f59e0b',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
    backgroundColor: '#ffffff',
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ef4444',
    marginLeft: 6,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
    marginLeft: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});