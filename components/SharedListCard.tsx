import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { List } from '../lib/supabase';

interface SharedListCardProps {
  list: List & {
    shared_by?: string;
    permission?: 'view' | 'edit' | 'admin';
    is_shared?: boolean;
  };
  onLeave?: (list: List) => void;
}

export default function SharedListCard({ list, onLeave }: SharedListCardProps) {
  const router = useRouter();

  const getPermissionLabel = (permission?: string) => {
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

  const getPermissionColor = (permission?: string) => {
    switch (permission) {
      case 'view':
        return '#6b7280';
      case 'edit':
        return '#4CAF50';
      case 'admin':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getPermissionIcon = (permission?: string) => {
    switch (permission) {
      case 'view':
        return 'eye-outline';
      case 'edit':
        return 'create-outline';
      case 'admin':
        return 'settings-outline';
      default:
        return 'eye-outline';
    }
  };

  const handlePress = () => {
    router.push(`/list/${list.id}`);
  };

  const handleLeave = () => {
    Alert.alert(
      'Sair da Lista',
      `Tem certeza que deseja sair da lista "${list.name}"? Você perderá o acesso a esta lista.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          style: 'destructive',
          onPress: () => onLeave?.(list)
        }
      ]
    );
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Data não disponível';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Data inválida';
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Data inválida';
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <Ionicons name="people" size={16} color="#4CAF50" />
            <Text style={styles.title} numberOfLines={1}>
              {list.name}
            </Text>
          </View>
          <View style={styles.sharedInfo}>
            <Text style={styles.sharedBy}>
              Compartilhada por {typeof list.shared_by === 'string' ? list.shared_by : 'Usuário'}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.leaveButton}
          onPress={handleLeave}
        >
          <Ionicons name="exit-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Ionicons name="list-outline" size={16} color="#64748b" />
            <Text style={styles.statText}>
              {list.items_count || 0} itens
            </Text>
          </View>
          
          <View style={styles.stat}>
            <Ionicons name="calendar-outline" size={16} color="#64748b" />
            <Text style={styles.statText}>
              {formatDate(list.created_at)}
            </Text>
          </View>
        </View>

        <View style={styles.permissionContainer}>
          <View style={[
            styles.permissionBadge,
            { backgroundColor: `${getPermissionColor(list.permission)}15` }
          ]}>
            <Ionicons 
              name={getPermissionIcon(list.permission) as any} 
              size={14} 
              color={getPermissionColor(list.permission)} 
            />
            <Text style={[
              styles.permissionText,
              { color: getPermissionColor(list.permission) }
            ]}>
              {getPermissionLabel(list.permission)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusDot,
            { backgroundColor: list.status === 'active' ? '#4CAF50' : '#94a3b8' }
          ]} />
          <Text style={styles.statusText}>
            {list.status === 'active' ? 'Ativa' : 'Finalizada'}
          </Text>
        </View>
        
        <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 6,
    flex: 1,
  },
  sharedInfo: {
    marginLeft: 22,
  },
  sharedBy: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
  },
  leaveButton: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: '#fef2f2',
  },
  content: {
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 4,
  },
  permissionContainer: {
    alignItems: 'flex-start',
  },
  permissionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  permissionText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
});