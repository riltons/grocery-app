import React, { useState } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface ProductImageProps {
  imageUrl?: string;
  onImageChange?: (imageUrl: string) => void;
  editable?: boolean;
  style?: any;
}

export default function ProductImage({ 
  imageUrl, 
  onImageChange, 
  editable = false,
  style 
}: ProductImageProps) {
  const [loading, setLoading] = useState(false);

  const handleImagePicker = async () => {
    try {
      // Solicitar permissões
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permissão necessária',
          'Precisamos de permissão para acessar suas fotos.'
        );
        return;
      }

      // Abrir seletor de imagens
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        onImageChange?.(imageUri);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem');
    }
  };

  const handleTakePhoto = async () => {
    try {
      // Solicitar permissões da câmera
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permissão necessária',
          'Precisamos de permissão para usar a câmera.'
        );
        return;
      }

      // Abrir câmera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        onImageChange?.(imageUri);
      }
    } catch (error) {
      console.error('Erro ao tirar foto:', error);
      Alert.alert('Erro', 'Não foi possível tirar a foto');
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Adicionar Imagem',
      'Como você gostaria de adicionar uma imagem?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Galeria', onPress: handleImagePicker },
        { text: 'Câmera', onPress: handleTakePhoto },
      ]
    );
  };

  if (!imageUrl) {
    return (
      <View style={[styles.container, styles.emptyContainer, style]}>
        <Ionicons name="image-outline" size={48} color="#ccc" />
        <Text style={styles.emptyText}>Sem imagem</Text>
        {editable && (
          <TouchableOpacity 
            style={styles.addButton}
            onPress={showImageOptions}
          >
            <Ionicons name="add" size={20} color="#4CAF50" />
            <Text style={styles.addButtonText}>Adicionar</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Image 
        source={{ uri: imageUrl }} 
        style={styles.image}
        resizeMode="cover"
      />
      
      {editable && (
        <TouchableOpacity 
          style={styles.editButton}
          onPress={showImageOptions}
        >
          <Ionicons name="camera" size={20} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
    overflow: 'hidden',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    minHeight: 120,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  addButtonText: {
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 4,
  },
  image: {
    width: '100%',
    height: 120,
  },
  editButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
  },
});