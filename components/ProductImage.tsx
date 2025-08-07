import React, { useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProductImageProps {
  imageUrl?: string;
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

export default function ProductImage({ 
  imageUrl, 
  size = 'medium',
  style 
}: ProductImageProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return { width: 40, height: 40 };
      case 'medium':
        return { width: 50, height: 50 };
      case 'large':
        return { width: 60, height: 60 };
      default:
        return { width: 50, height: 50 };
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 20;
      case 'medium':
        return 24;
      case 'large':
        return 32;
      default:
        return 24;
    }
  };

  const sizeStyle = getSizeStyle();
  const iconSize = getIconSize();

  if (!imageUrl || error) {
    return (
      <View style={[
        styles.placeholder,
        sizeStyle,
        style
      ]}>
        <Ionicons name="cube-outline" size={iconSize} color="#94a3b8" />
      </View>
    );
  }

  return (
    <View style={[sizeStyle, style]}>
      {loading && (
        <View style={[styles.loadingOverlay, sizeStyle]}>
          <ActivityIndicator size="small" color="#4CAF50" />
        </View>
      )}
      <Image
        source={{ uri: imageUrl }}
        style={[styles.image, sizeStyle]}
        resizeMode="cover"
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    borderRadius: 8,
  },
  placeholder: {
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  loadingOverlay: {
    position: 'absolute',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
});