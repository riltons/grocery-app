import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PlacesService, type NearbyPlace } from '../lib/places';
import { useToast } from '../context/ToastContext';

interface NearbySupermarketsModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectSupermarket: (name: string, address: string) => void;
}

export default function NearbySupermarketsModal({
  visible,
  onClose,
  onSelectSupermarket,
}: NearbySupermarketsModalProps) {
  const [supermarkets, setSupermarkets] = useState<NearbyPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { showError } = useToast();

  useEffect(() => {
    if (visible) {
      loadNearbySupermarkets();
    }
  }, [visible]);

  const loadNearbySupermarkets = async () => {
    setLoading(true);
    setSupermarkets([]);

    try {
      // Obter localização atual
      const location = await PlacesService.getCurrentLocation();
      
      if (!location) {
        Alert.alert(
          'Localização necessária',
          'Para sugerir supermercados próximos, precisamos acessar sua localização. Verifique as permissões do app.',
          [{ text: 'OK' }]
        );
        return;
      }

      const userCoords = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };
      setUserLocation(userCoords);

      // Buscar supermercados próximos
      const { data, error } = await PlacesService.searchNearbySupermarkets(
        userCoords.lat,
        userCoords.lng,
        5000 // 5km de raio
      );

      if (error) {
        showError('Erro', 'Não foi possível buscar supermercados próximos');
        console.error('Erro ao buscar supermercados:', error);
        return;
      }

      if (data) {
        // Calcular distância e ordenar por proximidade
        const supermarketsWithDistance = data.map(place => ({
          ...place,
          distance: PlacesService.calculateDistance(
            userCoords.lat,
            userCoords.lng,
            place.geometry.location.lat,
            place.geometry.location.lng
          ),
        })).sort((a, b) => a.distance - b.distance);

        setSupermarkets(supermarketsWithDistance);
      }
    } catch (error) {
      console.error('Erro ao carregar supermercados próximos:', error);
      showError('Erro', 'Ocorreu um erro ao buscar supermercados próximos');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSupermarket = (supermarket: NearbyPlace & { distance?: number }) => {
    onSelectSupermarket(supermarket.name, supermarket.vicinity);
    onClose();
  };

  const renderSupermarket = ({ item }: { item: NearbyPlace & { distance?: number } }) => (
    <TouchableOpacity
      style={styles.supermarketItem}
      onPress={() => handleSelectSupermarket(item)}
    >
      <View style={styles.supermarketInfo}>
        <View style={styles.supermarketHeader}>
          <Text style={styles.supermarketName}>{item.name}</Text>
          {item.distance && (
            <Text style={styles.distance}>
              {PlacesService.formatDistance(item.distance)}
            </Text>
          )}
        </View>
        
        <Text style={styles.supermarketAddress}>{item.vicinity}</Text>
        
        <View style={styles.supermarketDetails}>
          {item.rating && (
            <View style={styles.rating}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.ratingText}>
                {item.rating.toFixed(1)}
              </Text>
              {item.user_ratings_total && (
                <Text style={styles.reviewCount}>
                  ({item.user_ratings_total})
                </Text>
              )}
            </View>
          )}
          
          {item.opening_hours && (
            <View style={styles.openStatus}>
              <View style={[
                styles.openIndicator,
                { backgroundColor: item.opening_hours.open_now ? '#4CAF50' : '#F44336' }
              ]} />
              <Text style={[
                styles.openText,
                { color: item.opening_hours.open_now ? '#4CAF50' : '#F44336' }
              ]}>
                {item.opening_hours.open_now ? 'Aberto' : 'Fechado'}
              </Text>
            </View>
          )}
        </View>
      </View>
      
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Supermercados Próximos</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Buscando supermercados próximos...</Text>
          </View>
        ) : supermarkets.length > 0 ? (
          <FlatList
            data={supermarkets}
            renderItem={renderSupermarket}
            keyExtractor={(item) => item.place_id}
            style={styles.list}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>
              Nenhum supermercado encontrado próximo à sua localização
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadNearbySupermarkets}>
              <Text style={styles.retryButtonText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.footer}>
          <TouchableOpacity style={styles.manualButton} onPress={onClose}>
            <Ionicons name="create-outline" size={20} color="#666" />
            <Text style={styles.manualButtonText}>Adicionar manualmente</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  supermarketItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  supermarketInfo: {
    flex: 1,
  },
  supermarketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  supermarketName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  distance: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  supermarketAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  supermarketDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  reviewCount: {
    fontSize: 12,
    color: '#666',
  },
  openStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  openIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  openText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  manualButtonText: {
    fontSize: 16,
    color: '#666',
  },
});