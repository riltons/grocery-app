import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { List } from '../lib/supabase';

interface ListCardProps {
  list: List;
  onPress?: () => void;
  onEdit?: (list: List) => void;
  onDelete?: (list: List) => void;
  showActions?: boolean;
}

export default function ListCard({ 
  list, 
  onPress, 
  onEdit, 
  onDelete, 
  showActions = false 
}: ListCardProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/list/${list.id}`);
    }
  };

  const handleEdit = (e: any) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(list);
    }
  };

  const handleDelete = (e: any) => {
    e.stopPropagation();
    Alert.alert(
      'Excluir Lista',
      `Tem certeza que deseja excluir a lista "${list.name}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: () => onDelete && onDelete(list)
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
        year: 'numeric',
      });
    } catch (error) {
      return 'Data inválida';
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <View style={styles.cardContent}>
        <View style={styles.mainContent}>
          <Text style={styles.title}>{list.name}</Text>
          <Text style={styles.date}>
            Atualizada em {formatDate(list.updated_at)}
          </Text>
          {list.status === 'finished' && (
            <View style={styles.statusBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
              <Text style={styles.statusText}>Finalizada</Text>
            </View>
          )}
        </View>
        
        {showActions ? (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
              <Ionicons name="pencil" size={18} color="#4CAF50" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
              <Ionicons name="trash" size={18} color="#ff6b6b" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.arrow}>
            <Text style={styles.arrowText}>›</Text>
          </View>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mainContent: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8f1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  arrow: {
    marginLeft: 12,
  },
  arrowText: {
    fontSize: 24,
    color: '#cbd5e1',
    fontWeight: '300',
  },
});