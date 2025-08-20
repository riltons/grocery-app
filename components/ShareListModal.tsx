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
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import type { List, SharePermission, Invitation } from '../lib/supabase';

interface ShareListModalProps {
  visible: boolean;
  onClose: () => void;
  list: List | null;
  onSuccess?: () => void;
}

interface ParticipantInfo {
  id: string;
  userId: string;
  email: string;
  name?: string;
  permission: SharePermission;
  isOwner: boolean;
  joinedAt: string;
}

const { height: screenHeight } = Dimensions.get('window');

export default function ShareListModal({ 
  visible, 
  onClose, 
  list,
  onSuccess 
}: ShareListModalProps) {
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState<'invite' | 'participants'>('invite');
  const [loading, setLoading] = useState(false);
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
  
  // Estados para convite
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedPermission, setSelectedPermission] = useState<SharePermission>('edit');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (visible && list) {
      loadParticipants();
      loadPendingInvitations();
    }
  }, [visible, list]);

  const loadParticipants = async () => {
    if (!list) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar participantes da lista
      const { data: shares, error } = await supabase
        .from('list_shares')
        .select(`
          id,
          user_id,
          permission,
          created_at
        `)
        .eq('list_id', list.id);

      if (error) {
        throw error;
      }

      const participants: ParticipantInfo[] = [];

      // Adicionar proprietário
      participants.push({
        id: 'owner',
        userId: list.user_id || user.id,
        email: 'Você (Proprietário)',
        name: 'Proprietário',
        permission: 'admin',
        isOwner: true,
        joinedAt: list.created_at || new Date().toISOString(),
      });

      // Adicionar participantes compartilhados
      if (shares) {
        for (const share of shares) {
          participants.push({
            id: share.id,
            userId: share.user_id,
            email: `Usuário ${share.user_id.substring(0, 8)}...`, // Simplificado por enquanto
            name: `Participante`,
            permission: share.permission as SharePermission,
            isOwner: false,
            joinedAt: share.created_at,
          });
        }
      }

      setParticipants(participants);
    } catch (error) {
      console.error('Erro ao carregar participantes:', error);
      showError('Erro', 'Não foi possível carregar os participantes');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingInvitations = async () => {
    if (!list) return;
    
    try {
      const { data: invitations, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('list_id', list.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setPendingInvitations(invitations || []);
    } catch (error) {
      console.error('Erro ao carregar convites pendentes:', error);
    }
  };

  const handleInviteUser = async () => {
    if (!list || !inviteEmail.trim()) {
      showError('Erro', 'Digite um email válido');
      return;
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail.trim())) {
      showError('Erro', 'Digite um email válido');
      return;
    }

    setInviting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showError('Erro', 'Usuário não autenticado');
        return;
      }

      // Verificar se já existe um convite pendente para este email
      const { data: existingInvitation } = await supabase
        .from('invitations')
        .select('id')
        .eq('list_id', list.id)
        .eq('invitee_email', inviteEmail.trim())
        .eq('status', 'pending')
        .single();

      if (existingInvitation) {
        showError('Erro', 'Já existe um convite pendente para este usuário');
        return;
      }

      // Criar o convite
      const { error } = await supabase
        .from('invitations')
        .insert({
          list_id: list.id,
          inviter_user_id: user.id,
          invitee_email: inviteEmail.trim(),
          permission: selectedPermission,
          status: 'pending'
        });

      if (error) {
        throw error;
      }

      showSuccess(
        'Convite Enviado!', 
        `Convite enviado para ${inviteEmail.trim()}`
      );
      
      setInviteEmail('');
      loadPendingInvitations();
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao enviar convite:', error);
      showError('Erro', error instanceof Error ? error.message : 'Não foi possível enviar o convite');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveParticipant = (participantUserId: string, participantEmail: string) => {
    Alert.alert(
      'Remover Participante',
      `Tem certeza que deseja remover ${participantEmail} desta lista?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Remover', 
          style: 'destructive',
          onPress: () => removeParticipant(participantUserId)
        }
      ]
    );
  };

  const removeParticipant = async (participantUserId: string) => {
    if (!list) return;
    
    try {
      const { error } = await supabase
        .from('list_shares')
        .delete()
        .eq('list_id', list.id)
        .eq('user_id', participantUserId);

      if (error) {
        throw error;
      }

      showSuccess('Sucesso', 'Participante removido da lista');
      loadParticipants();
    } catch (error) {
      console.error('Erro ao remover participante:', error);
      showError('Erro', error instanceof Error ? error.message : 'Não foi possível remover o participante');
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
        return 'Editar';
    }
  };

  const getPermissionDescription = (permission: SharePermission) => {
    switch (permission) {
      case 'view':
        return 'Pode apenas visualizar a lista';
      case 'edit':
        return 'Pode adicionar, editar e marcar itens';
      case 'admin':
        return 'Pode gerenciar participantes e configurações';
      default:
        return 'Pode adicionar, editar e marcar itens';
    }
  };

  const renderInviteTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Convidar Usuário</Text>
        <Text style={styles.sectionDescription}>
          Digite o email da pessoa que você deseja convidar para colaborar nesta lista
        </Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.textInput}
            placeholder="exemplo@email.com"
            value={inviteEmail}
            onChangeText={setInviteEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Permissão</Text>
          <Text style={styles.inputDescription}>
            Escolha o nível de acesso que esta pessoa terá
          </Text>
          
          {(['view', 'edit', 'admin'] as SharePermission[]).map((permission) => (
            <TouchableOpacity
              key={permission}
              style={[
                styles.permissionOption,
                selectedPermission === permission && styles.permissionOptionSelected
              ]}
              onPress={() => setSelectedPermission(permission)}
            >
              <View style={styles.permissionContent}>
                <View style={styles.permissionInfo}>
                  <Text style={[
                    styles.permissionLabel,
                    selectedPermission === permission && styles.permissionLabelSelected
                  ]}>
                    {getPermissionLabel(permission)}
                  </Text>
                  <Text style={[
                    styles.permissionDescription,
                    selectedPermission === permission && styles.permissionDescriptionSelected
                  ]}>
                    {getPermissionDescription(permission)}
                  </Text>
                </View>
                <View style={[
                  styles.radioButton,
                  selectedPermission === permission && styles.radioButtonSelected
                ]}>
                  {selectedPermission === permission && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.inviteButton, inviting && styles.inviteButtonDisabled]}
          onPress={handleInviteUser}
          disabled={inviting || !inviteEmail.trim()}
        >
          {inviting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Ionicons name="mail-outline" size={20} color="#ffffff" />
              <Text style={styles.inviteButtonText}>Enviar Convite</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {pendingInvitations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Convites Pendentes</Text>
          {pendingInvitations.map((invitation) => (
            <View key={invitation.id} style={styles.invitationItem}>
              <View style={styles.invitationInfo}>
                <Text style={styles.invitationEmail}>{invitation.invitee_email}</Text>
                <Text style={styles.invitationPermission}>
                  {getPermissionLabel(invitation.permission)}
                </Text>
                <Text style={styles.invitationDate}>
                  Enviado em {new Date(invitation.created_at).toLocaleDateString('pt-BR')}
                </Text>
              </View>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>Pendente</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderParticipantsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Carregando participantes...</Text>
        </View>
      ) : participants.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={64} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>Nenhum participante</Text>
          <Text style={styles.emptySubtitle}>
            Esta lista ainda não foi compartilhada com ninguém
          </Text>
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Participantes ({participants.length})</Text>
          {participants.map((participant) => (
            <View key={participant.id} style={styles.participantItem}>
              <View style={styles.participantInfo}>
                <Text style={styles.participantName}>
                  {participant.name || participant.email.split('@')[0]}
                  {participant.isOwner && <Text> (Proprietário)</Text>}
                </Text>
                <Text style={styles.participantEmail}>{participant.email}</Text>
                <Text style={styles.participantPermission}>
                  {getPermissionLabel(participant.permission)}
                </Text>
                <Text style={styles.participantDate}>
                  Entrou em {new Date(participant.joinedAt).toLocaleDateString('pt-BR')}
                </Text>
              </View>
              {!participant.isOwner && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveParticipant(participant.userId, participant.email)}
                >
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
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
            <Text style={styles.title}>Compartilhar Lista</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {list && (
            <View style={styles.listInfo}>
              <Text style={styles.listName}>{list.name}</Text>
              <Text style={styles.listDescription}>
                Gerencie quem pode acessar e editar esta lista
              </Text>
            </View>
          )}

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'invite' && styles.tabActive]}
              onPress={() => setActiveTab('invite')}
            >
              <Ionicons 
                name="person-add-outline" 
                size={20} 
                color={activeTab === 'invite' ? '#4CAF50' : '#64748b'} 
              />
              <Text style={[
                styles.tabText,
                activeTab === 'invite' && styles.tabTextActive
              ]}>
                Convidar
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'participants' && styles.tabActive]}
              onPress={() => setActiveTab('participants')}
            >
              <Ionicons 
                name="people-outline" 
                size={20} 
                color={activeTab === 'participants' ? '#4CAF50' : '#64748b'} 
              />
              <Text style={[
                styles.tabText,
                activeTab === 'participants' && styles.tabTextActive
              ]}>
                Participantes
              </Text>
              {participants.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{participants.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {activeTab === 'invite' ? renderInviteTab() : renderParticipantsTab()}
          </View>
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
    maxHeight: screenHeight * 0.9,
    minHeight: screenHeight * 0.6,
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
  listInfo: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  listName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  listDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#4CAF50',
    backgroundColor: '#ffffff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginLeft: 8,
  },
  tabTextActive: {
    color: '#4CAF50',
  },
  badge: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputDescription: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  permissionOption: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#ffffff',
  },
  permissionOptionSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#f0f9ff',
  },
  permissionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  permissionInfo: {
    flex: 1,
  },
  permissionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  permissionLabelSelected: {
    color: '#4CAF50',
  },
  permissionDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  permissionDescriptionSelected: {
    color: '#059669',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#4CAF50',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },
  inviteButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  inviteButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  inviteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
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
  invitationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  invitationInfo: {
    flex: 1,
  },
  invitationEmail: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  invitationPermission: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  invitationDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  pendingBadge: {
    backgroundColor: '#fbbf24',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pendingBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ffffff',
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  participantEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  participantPermission: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    marginBottom: 2,
  },
  participantDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
});