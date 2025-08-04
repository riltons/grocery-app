import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Product {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  brand?: string;
  type?: 'generic' | 'specific';
  category?: string;
  generic_products?: {
    name: string;
    category: string | null;
  };
}

interface ProductCategorySectionProps {
  categoryName: string;
  categoryIcon?: string;
  categoryColor?: string;
  products: Product[];
  onProductPress: (product: Product) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  deletingProducts: Set<string>;
  initiallyExpanded?: boolean;
}

export default function ProductCategorySection({
  categoryName,
  categoryIcon = 'pricetag-outline',
  categoryColor = '#4CAF50',
  products,
  onProductPress,
  onEditProduct,
  onDeleteProduct,
  deletingProducts,
  initiallyExpanded = true,
}: ProductCategorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);

  const renderProductItem = ({ item }: { item: Product }) => {
    const isDeleting = deletingProducts.has(item.id);
    const isGeneric = item.type === 'generic';
    
    return (
      <View style={styles.productItem}>
        <TouchableOpacity 
          style={styles.productContent}
          onPress={() => onProductPress(item)}
          disabled={isDeleting}
        >
          {/* Imagem do produto */}
          <View style={styles.productImageContainer}>
            {item.image_url ? (
              <Image 
                source={{ uri: item.image_url }} 
                style={styles.productImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.productImagePlaceholder}>
                <Ionicons 
                  name={isGeneric ? 'pricetag-outline' : 'cube-outline'} 
                  size={20} 
                  color="#999" 
                />
              </View>
            )}
          </View>

          <View style={styles.productInfo}>
            <Text style={styles.productName}>{item.name}</Text>
            
            <View style={styles.productMeta}>
              <View style={[styles.typeBadge, isGeneric ? styles.genericBadge : styles.specificBadge]}>
                <Text style={styles.typeBadgeText}>
                  {isGeneric ? 'Genérico' : 'Específico'}
                </Text>
              </View>
              
              {item.brand && (
                <Text style={styles.productBrand}>{item.brand}</Text>
              )}
            </View>
            
            {item.description && (
              <Text style={styles.productDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.editButton, isDeleting && styles.actionButtonDisabled]}
            onPress={() => onEditProduct(item)}
            disabled={isDeleting}
          >
            <Ionicons name="pencil-outline" size={18} color="#4CAF50" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
            onPress={() => onDeleteProduct(item)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#ff6b6b" />
            ) : (
              <Ionicons name="trash-outline" size={18} color="#ff6b6b" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (products.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.categoryHeader}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <View style={styles.categoryInfo}>
          <Ionicons 
            name={categoryIcon as any} 
            size={20} 
            color={categoryColor} 
            style={styles.categoryIcon}
          />
          <Text style={styles.categoryName}>{categoryName}</Text>
          <View style={[styles.countBadge, { backgroundColor: categoryColor }]}>
            <Text style={styles.countText}>{products.length}</Text>
          </View>
        </View>
        <Ionicons 
          name={isExpanded ? 'chevron-up' : 'chevron-down'} 
          size={20} 
          color="#666" 
        />
      </TouchableOpacity>
      
      {isExpanded && (
        <View style={styles.productsContainer}>
          <FlatList
            data={products}
            renderItem={renderProductItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  countText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  productsContainer: {
    backgroundColor: '#fff',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 16,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  productContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  productImageContainer: {
    marginRight: 12,
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  productImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
    lineHeight: 20,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 8,
  },
  genericBadge: {
    backgroundColor: '#E3F2FD',
  },
  specificBadge: {
    backgroundColor: '#E8F5E8',
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
  },
  productBrand: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  productDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  editButton: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderLeftWidth: 1,
    borderLeftColor: '#e0e0e0',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  deleteButton: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderLeftWidth: 1,
    borderLeftColor: '#e0e0e0',
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
});