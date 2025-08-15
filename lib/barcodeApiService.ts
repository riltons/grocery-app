import { useToast } from '../context/ToastContext';

/**
 * Serviço para consulta de APIs de códigos de barras
 * Integra com múltiplas APIs para obter informações de produtos
 */

export interface ProductApiInfo {
  barcode: string;
  name: string;
  brand?: string;
  category?: string;
  image?: string;
  description?: string;
  nutritionalInfo?: NutritionalInfo;
  source: 'cosmos' | 'openfoodfacts' | 'upcitemdb' | 'manual';
  confidence: number;
  metadata?: {
    ncm?: string;
    gtin?: string;
    weight?: string;
    volume?: string;
    ingredients?: string[];
    allergens?: string[];
  };
}

export interface NutritionalInfo {
  energy?: number;
  proteins?: number;
  carbohydrates?: number;
  fat?: number;
  fiber?: number;
  sodium?: number;
  sugar?: number;
}

export interface CosmosApiResponse {
  gtin: string;
  description: string;
  brand: string | { name: string; picture?: string };
  ncm?: string;
  category?: string | { description: string; id: number; parent_id?: number };
  unit?: string;
  image_url?: string;
  thumbnail?: string;
  avg_price?: number;
}

export interface OpenFoodFactsResponse {
  code: string;
  status: number;
  product?: {
    product_name: string;
    product_name_pt?: string;
    brands: string;
    categories: string;
    image_url: string;
    image_front_url?: string;
    image_front_small_url?: string;
    ingredients_text?: string;
    allergens?: string;
    nutriments?: {
      energy_100g?: number;
      proteins_100g?: number;
      carbohydrates_100g?: number;
      fat_100g?: number;
      fiber_100g?: number;
      sodium_100g?: number;
      sugars_100g?: number;
    };
  };
}

export interface UPCItemDBResponse {
  code: string;
  total: number;
  items?: Array<{
    ean: string;
    title: string;
    brand: string;
    category: string;
    images?: string[];
    description?: string;
  }>;
}

class BarcodeApiService {
  private readonly COSMOS_API_KEY = process.env.EXPO_PUBLIC_COSMOS_API_KEY;
  private readonly UPCITEMDB_API_KEY = process.env.EXPO_PUBLIC_UPCITEMDB_API_KEY;
  
  /**
   * Busca informações do produto em múltiplas APIs
   */
  async getProductInfo(barcode: string): Promise<ProductApiInfo | null> {
    console.log('🔍 Buscando informações do produto:', barcode);
    
    try {
      // 1. Tentar API Cosmos primeiro (produtos brasileiros)
      if (this.COSMOS_API_KEY) {
        const cosmosResult = await this.searchCosmos(barcode);
        if (cosmosResult) {
          console.log('✅ Produto encontrado na API Cosmos');
          return cosmosResult;
        }
      }

      // 2. Tentar Open Food Facts (gratuita, boa cobertura internacional)
      const openFoodResult = await this.searchOpenFoodFacts(barcode);
      if (openFoodResult) {
        console.log('✅ Produto encontrado no Open Food Facts');
        return openFoodResult;
      }

      // 3. Tentar UPCItemDB como fallback
      if (this.UPCITEMDB_API_KEY) {
        const upcResult = await this.searchUPCItemDB(barcode);
        if (upcResult) {
          console.log('✅ Produto encontrado no UPCItemDB');
          return upcResult;
        }
      }

      console.log('❌ Produto não encontrado em nenhuma API');
      return null;
    } catch (error) {
      console.error('❌ Erro ao buscar informações do produto:', error);
      return null;
    }
  }

  /**
   * Busca na API Cosmos (produtos brasileiros)
   */
  private async searchCosmos(barcode: string): Promise<ProductApiInfo | null> {
    try {
      console.log('🔍 Consultando API Cosmos...');
      
      const response = await fetch(
        `https://api.cosmos.bluesoft.com.br/gtins/${barcode}`,
        {
          headers: {
            'X-Cosmos-Token': this.COSMOS_API_KEY!,
            'User-Agent': 'GroceryApp/1.0',
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          console.log('📦 Produto não encontrado na API Cosmos');
          return null;
        }
        throw new Error(`Cosmos API error: ${response.status}`);
      }

      const data: CosmosApiResponse = await response.json();
      
      console.log('📦 Dados COMPLETOS recebidos da Cosmos API:', JSON.stringify(data, null, 2));
      
      // Extrair brand corretamente
      let brandName = undefined;
      if (data.brand) {
        if (typeof data.brand === 'string') {
          brandName = data.brand;
        } else if (data.brand.name) {
          brandName = data.brand.name;
        }
      }
      
      // Extrair category corretamente
      let categoryName = undefined;
      if (data.category) {
        if (typeof data.category === 'string') {
          categoryName = data.category;
        } else if (data.category.description) {
          categoryName = data.category.description;
        }
      }
      
      console.log('📦 Dados processados:', {
        gtin: data.gtin,
        description: data.description,
        brandName,
        categoryName,
        image_url: data.image_url,
        ncm: data.ncm,
      });
      
      const productInfo = {
        barcode: data.gtin.toString(),
        name: data.description || 'Produto sem nome',
        brand: brandName || undefined,
        category: this.mapCosmosCategory(categoryName),
        image: data.image_url || data.thumbnail || undefined,
        source: 'cosmos' as const,
        confidence: 0.9,
        metadata: {
          ncm: data.ncm,
          gtin: data.gtin.toString(),
          weight: this.extractWeight(data.description || ''),
          volume: this.extractVolume(data.description || ''),
        }
      };
      
      console.log('✅ Produto processado da Cosmos:', productInfo);
      return productInfo;
    } catch (error) {
      console.error('❌ Erro na API Cosmos:', error);
      return null;
    }
  }

  /**
   * Busca no Open Food Facts (gratuita)
   */
  private async searchOpenFoodFacts(barcode: string): Promise<ProductApiInfo | null> {
    try {
      console.log('🔍 Consultando Open Food Facts...');
      
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
        {
          headers: {
            'User-Agent': 'GroceryApp/1.0',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`OpenFoodFacts API error: ${response.status}`);
      }

      const data: OpenFoodFactsResponse = await response.json();
      
      if (data.status === 0 || !data.product) {
        console.log('📦 Produto não encontrado no Open Food Facts');
        return null;
      }

      const product = data.product;
      
      // Priorizar nome em português se disponível
      const productName = product.product_name_pt || product.product_name;
      
      if (!productName) {
        return null;
      }

      return {
        barcode: data.code,
        name: productName,
        brand: product.brands,
        category: this.mapOpenFoodFactsCategory(product.categories),
        image: product.image_front_small_url || product.image_front_url || product.image_url,
        description: product.ingredients_text,
        source: 'openfoodfacts',
        confidence: 0.8,
        nutritionalInfo: product.nutriments ? {
          energy: product.nutriments.energy_100g,
          proteins: product.nutriments.proteins_100g,
          carbohydrates: product.nutriments.carbohydrates_100g,
          fat: product.nutriments.fat_100g,
          fiber: product.nutriments.fiber_100g,
          sodium: product.nutriments.sodium_100g,
          sugar: product.nutriments.sugars_100g,
        } : undefined,
        metadata: {
          ingredients: product.ingredients_text ? [product.ingredients_text] : undefined,
          allergens: product.allergens ? [product.allergens] : undefined,
        }
      };
    } catch (error) {
      console.error('❌ Erro no Open Food Facts:', error);
      return null;
    }
  }

  /**
   * Busca no UPCItemDB (fallback)
   */
  private async searchUPCItemDB(barcode: string): Promise<ProductApiInfo | null> {
    try {
      console.log('🔍 Consultando UPCItemDB...');
      
      const response = await fetch(
        `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`,
        {
          headers: {
            'User-Agent': 'GroceryApp/1.0',
            'user_key': this.UPCITEMDB_API_KEY!,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`UPCItemDB API error: ${response.status}`);
      }

      const data: UPCItemDBResponse = await response.json();
      
      if (data.total === 0 || !data.items || data.items.length === 0) {
        console.log('📦 Produto não encontrado no UPCItemDB');
        return null;
      }

      const item = data.items[0];
      
      return {
        barcode: item.ean,
        name: item.title,
        brand: item.brand,
        category: item.category,
        image: item.images && item.images.length > 0 ? item.images[0] : undefined,
        description: item.description,
        source: 'upcitemdb',
        confidence: 0.7,
      };
    } catch (error) {
      console.error('❌ Erro no UPCItemDB:', error);
      return null;
    }
  }

  /**
   * Mapeia categorias da API Cosmos para categorias do app
   */
  private mapCosmosCategory(category: string | { description: string; id: number; parent_id?: number } | undefined): string {
    console.log('🏷️ Mapeando categoria:', category, 'Tipo:', typeof category);
    
    if (!category) {
      console.log('🏷️ Categoria vazia, retornando "Outros"');
      return 'Outros';
    }
    
    // Se category é um objeto, usar a description
    let categoryText = '';
    if (typeof category === 'string') {
      categoryText = category;
    } else if (category && typeof category === 'object' && category.description) {
      categoryText = category.description;
    } else {
      console.log('🏷️ Categoria em formato desconhecido, retornando "Outros"');
      return 'Outros';
    }
    
    console.log('🏷️ Texto da categoria extraído:', categoryText);
    
    const categoryMap: Record<string, string> = {
      'ALIMENTOS E BEBIDAS': 'Mercearia',
      'BEBIDAS': 'Bebidas',
      'CARNES E DERIVADOS': 'Carnes',
      'LATICÍNIOS': 'Laticínios',
      'FRUTAS E VEGETAIS': 'Frutas',
      'LIMPEZA': 'Limpeza',
      'HIGIENE PESSOAL': 'Higiene',
      'CASA E JARDIM': 'Casa',
      'BALAS E PIRULITOS': 'Mercearia',
      'DOCES E SOBREMESAS': 'Mercearia',
      'CHOCOLATES': 'Mercearia',
      'AMENDOIM': 'Mercearia',
      'SNACKS': 'Mercearia',
    };
    
    const mappedCategory = categoryMap[categoryText.toUpperCase()] || 'Mercearia';
    console.log('🏷️ Categoria mapeada:', mappedCategory);
    
    return mappedCategory;
  }

  /**
   * Mapeia categorias do Open Food Facts para categorias do app
   */
  private mapOpenFoodFactsCategory(categories: string): string {
    if (!categories) return 'Outros';
    
    const categoryLower = categories.toLowerCase();
    
    if (categoryLower.includes('bebidas') || categoryLower.includes('beverages')) {
      return 'Bebidas';
    }
    if (categoryLower.includes('carnes') || categoryLower.includes('meat')) {
      return 'Carnes';
    }
    if (categoryLower.includes('laticínios') || categoryLower.includes('dairy')) {
      return 'Laticínios';
    }
    if (categoryLower.includes('frutas') || categoryLower.includes('fruits')) {
      return 'Frutas';
    }
    if (categoryLower.includes('vegetais') || categoryLower.includes('vegetables')) {
      return 'Vegetais';
    }
    if (categoryLower.includes('limpeza') || categoryLower.includes('cleaning')) {
      return 'Limpeza';
    }
    
    return 'Mercearia';
  }

  /**
   * Extrai peso do nome do produto
   */
  private extractWeight(productName: string): string | undefined {
    const weightRegex = /(\d+(?:\.\d+)?)\s*(kg|g|gramas?|quilos?)\b/i;
    const match = productName.match(weightRegex);
    return match ? `${match[1]}${match[2].toLowerCase()}` : undefined;
  }

  /**
   * Extrai volume do nome do produto
   */
  private extractVolume(productName: string): string | undefined {
    const volumeRegex = /(\d+(?:\.\d+)?)\s*(ml|l|litros?|mililitros?)\b/i;
    const match = productName.match(volumeRegex);
    return match ? `${match[1]}${match[2].toLowerCase()}` : undefined;
  }

  /**
   * Valida se um código de barras é válido
   */
  isValidBarcode(barcode: string): boolean {
    // Remove espaços e caracteres especiais
    const cleanBarcode = barcode.replace(/\D/g, '');
    
    // Verifica se tem o tamanho correto (8-14 dígitos)
    if (cleanBarcode.length < 8 || cleanBarcode.length > 14) {
      return false;
    }
    
    // Códigos de barras comuns: EAN-8, EAN-13, UPC-A, UPC-E
    const validLengths = [8, 12, 13, 14];
    return validLengths.includes(cleanBarcode.length);
  }

  /**
   * Formata código de barras para exibição
   */
  formatBarcode(barcode: string): string {
    const clean = barcode.replace(/\D/g, '');
    
    // EAN-13: 123-4567-890123
    if (clean.length === 13) {
      return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7)}`;
    }
    
    // EAN-8: 1234-5678
    if (clean.length === 8) {
      return `${clean.slice(0, 4)}-${clean.slice(4)}`;
    }
    
    // UPC-A: 123456-789012
    if (clean.length === 12) {
      return `${clean.slice(0, 6)}-${clean.slice(6)}`;
    }
    
    return clean;
  }
}

export const barcodeApiService = new BarcodeApiService();