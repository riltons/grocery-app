import * as Location from 'expo-location';

export interface NearbyPlace {
  place_id: string;
  name: string;
  vicinity: string;
  rating?: number;
  user_ratings_total?: number;
  types: string[];
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  opening_hours?: {
    open_now: boolean;
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
}

export interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: {
    open_now: boolean;
    weekday_text: string[];
  };
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

/**
 * Serviço para buscar lugares próximos usando Google Places API
 */
export const PlacesService = {
  /**
   * Solicita permissão de localização do usuário
   */
  requestLocationPermission: async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Erro ao solicitar permissão de localização:', error);
      return false;
    }
  },

  /**
   * Obtém a localização atual do usuário
   */
  getCurrentLocation: async (): Promise<Location.LocationObject | null> => {
    try {
      const hasPermission = await PlacesService.requestLocationPermission();
      if (!hasPermission) {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return location;
    } catch (error) {
      console.error('Erro ao obter localização atual:', error);
      return null;
    }
  },

  /**
   * Busca supermercados próximos usando Google Places API
   */
  searchNearbySupermarkets: async (
    latitude: number,
    longitude: number,
    radius: number = 5000
  ): Promise<{ data: NearbyPlace[] | null; error: any }> => {
    try {
      // Aqui você deve usar sua chave da Google Places API
      const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
      
      console.log('🔑 API Key configurada:', GOOGLE_PLACES_API_KEY ? 'SIM' : 'NÃO');
      
      if (!GOOGLE_PLACES_API_KEY) {
        console.warn('Google Places API key não configurada - usando dados simulados');
        // Retornar dados simulados para desenvolvimento
        return {
          data: [
            {
              place_id: 'sim_1',
              name: 'Supermercado Pão de Açúcar',
              vicinity: 'Rua das Flores, 123 - Centro',
              rating: 4.2,
              user_ratings_total: 150,
              types: ['supermarket', 'grocery_or_supermarket', 'food', 'store'],
              geometry: {
                location: {
                  lat: latitude + 0.001,
                  lng: longitude + 0.001,
                }
              },
              opening_hours: {
                open_now: true
              }
            },
            {
              place_id: 'sim_2',
              name: 'Extra Supermercados',
              vicinity: 'Av. Principal, 456 - Bairro Novo',
              rating: 4.0,
              user_ratings_total: 89,
              types: ['supermarket', 'grocery_or_supermarket', 'food', 'store'],
              geometry: {
                location: {
                  lat: latitude - 0.002,
                  lng: longitude + 0.002,
                }
              },
              opening_hours: {
                open_now: false
              }
            },
            {
              place_id: 'sim_3',
              name: 'Carrefour',
              vicinity: 'Shopping Center, Loja 45',
              rating: 4.1,
              user_ratings_total: 203,
              types: ['supermarket', 'grocery_or_supermarket', 'food', 'store'],
              geometry: {
                location: {
                  lat: latitude + 0.003,
                  lng: longitude - 0.001,
                }
              }
            }
          ],
          error: null
        };
      }

      // Usar a nova Places API (New) em vez da legacy
      const url = `https://places.googleapis.com/v1/places:searchNearby`;
      
      console.log('🌐 Fazendo request para Google Places API (New)...');
      console.log('📍 Localização:', `${latitude},${longitude}`);
      console.log('📏 Raio:', `${radius}m`);
      
      const requestBody = {
        includedTypes: ['supermarket', 'grocery_store'],
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: {
              latitude: latitude,
              longitude: longitude,
            },
            radius: radius,
          },
        },
        languageCode: 'pt-BR',
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
          'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.currentOpeningHours,places.types',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      console.log('📊 Status da resposta:', response.status);
      
      if (response.ok && data.places) {
        console.log('✅ Supermercados encontrados:', data.places?.length || 0);
        
        // Converter formato da nova API para o formato esperado
        const convertedResults = data.places.map((place: any) => ({
          place_id: place.id || `place_${Math.random()}`,
          name: place.displayName?.text || 'Supermercado',
          vicinity: place.formattedAddress || 'Endereço não disponível',
          rating: place.rating,
          user_ratings_total: place.userRatingCount,
          types: place.types || ['supermarket'],
          geometry: {
            location: {
              lat: place.location?.latitude || latitude,
              lng: place.location?.longitude || longitude,
            },
          },
          opening_hours: place.currentOpeningHours ? {
            open_now: place.currentOpeningHours.openNow || false,
          } : undefined,
        }));
        
        return { data: convertedResults, error: null };
      } else {
        console.error('❌ Erro na API do Google Places:', response.status);
        console.error('💬 Resposta completa:', data);
        
        // Tratar diferentes tipos de erro
        let errorMessage = 'Erro ao buscar supermercados próximos';
        
        if (data.error) {
          switch (data.error.code) {
            case 403:
              errorMessage = 'Chave da API inválida ou sem permissões. Verifique a configuração no Google Cloud Console.';
              break;
            case 400:
              errorMessage = 'Parâmetros da requisição inválidos.';
              break;
            case 429:
              errorMessage = 'Limite de consultas da API excedido.';
              break;
            default:
              errorMessage = data.error.message || 'Erro desconhecido na API';
          }
        } else if (!data.places || data.places.length === 0) {
          errorMessage = 'Nenhum supermercado encontrado próximo à sua localização.';
        }
        
        return { data: null, error: errorMessage };
      }
    } catch (error) {
      console.error('Erro ao buscar supermercados próximos:', error);
      return { data: null, error };
    }
  },

  /**
   * Obtém detalhes de um lugar específico
   */
  getPlaceDetails: async (placeId: string): Promise<{ data: PlaceDetails | null; error: any }> => {
    try {
      const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
      
      if (!GOOGLE_PLACES_API_KEY) {
        console.warn('Google Places API key não configurada');
        return { data: null, error: 'API key não configurada' };
      }

      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=place_id,name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,opening_hours,geometry&key=${GOOGLE_PLACES_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        return { data: data.result, error: null };
      } else {
        console.error('Erro na API do Google Places:', data.status, data.error_message);
        return { data: null, error: data.error_message || 'Erro ao buscar detalhes do lugar' };
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes do lugar:', error);
      return { data: null, error };
    }
  },

  /**
   * Calcula a distância entre duas coordenadas em metros
   */
  calculateDistance: (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371e3; // Raio da Terra em metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  },

  /**
   * Formata a distância para exibição
   */
  formatDistance: (distanceInMeters: number): string => {
    if (distanceInMeters < 1000) {
      return `${Math.round(distanceInMeters)}m`;
    } else {
      return `${(distanceInMeters / 1000).toFixed(1)}km`;
    }
  }
};