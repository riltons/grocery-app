export interface ProductComparison {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  category?: string;
  brand?: string;
  description?: string;
  unitPrice?: number;
  normalizedQuantity?: number;
  efficiency?: number;
  // Campos específicos para produtos com múltiplas dimensões
  totalMeters?: number;
  metersPerUnit?: number;
  layers?: number;
  sheets?: number;
}

export interface UnitConversion {
  baseUnit: string;
  multiplier: number;
  category: UnitCategory;
}

export type UnitCategory = 'peso' | 'volume' | 'comprimento' | 'area' | 'unidade' | 'tempo';

export interface ComparisonResult {
  category: UnitCategory;
  products: ProductComparison[];
  bestProduct: ProductComparison;
  savings: { [productId: string]: number };
}

// Conversões para unidades padrão com categorias bem definidas
export const UNIT_CONVERSIONS: { [key: string]: UnitConversion } = {
  // Peso (base: gramas)
  'mg': { baseUnit: 'g', multiplier: 0.001, category: 'peso' },
  'g': { baseUnit: 'g', multiplier: 1, category: 'peso' },
  'kg': { baseUnit: 'g', multiplier: 1000, category: 'peso' },
  'ton': { baseUnit: 'g', multiplier: 1000000, category: 'peso' },
  
  // Volume (base: mililitros)
  'ml': { baseUnit: 'ml', multiplier: 1, category: 'volume' },
  'cl': { baseUnit: 'ml', multiplier: 10, category: 'volume' },
  'dl': { baseUnit: 'ml', multiplier: 100, category: 'volume' },
  'l': { baseUnit: 'ml', multiplier: 1000, category: 'volume' },
  
  // Comprimento (base: centímetros)
  'mm': { baseUnit: 'cm', multiplier: 0.1, category: 'comprimento' },
  'cm': { baseUnit: 'cm', multiplier: 1, category: 'comprimento' },
  'm': { baseUnit: 'cm', multiplier: 100, category: 'comprimento' },
  'km': { baseUnit: 'cm', multiplier: 100000, category: 'comprimento' },
  
  // Área (base: centímetros quadrados)
  'cm²': { baseUnit: 'cm²', multiplier: 1, category: 'area' },
  'm²': { baseUnit: 'cm²', multiplier: 10000, category: 'area' },
  
  // Unidades (base: unidade)
  'un': { baseUnit: 'un', multiplier: 1, category: 'unidade' },
  'pç': { baseUnit: 'un', multiplier: 1, category: 'unidade' },
  'rolo': { baseUnit: 'un', multiplier: 1, category: 'unidade' },
  'folha': { baseUnit: 'un', multiplier: 1, category: 'unidade' },
  'pacote': { baseUnit: 'un', multiplier: 1, category: 'unidade' },
  'caixa': { baseUnit: 'un', multiplier: 1, category: 'unidade' },
  'dúzia': { baseUnit: 'un', multiplier: 12, category: 'unidade' },
  'centena': { baseUnit: 'un', multiplier: 100, category: 'unidade' },
  
  // Tempo (base: minutos)
  'min': { baseUnit: 'min', multiplier: 1, category: 'tempo' },
  'h': { baseUnit: 'min', multiplier: 60, category: 'tempo' },
  'dia': { baseUnit: 'min', multiplier: 1440, category: 'tempo' },
};

// Categorias de produtos com suas características específicas
export const PRODUCT_CATEGORIES = {
  'papel_higienico': {
    name: 'Papel Higiênico',
    preferredUnits: ['rolo', 'm', 'folha'],
    comparisonFactors: ['quantity', 'length', 'layers', 'softness'],
    icon: '🧻'
  },
  'alimentos': {
    name: 'Alimentos',
    preferredUnits: ['g', 'kg', 'ml', 'l', 'un'],
    comparisonFactors: ['weight', 'volume', 'nutritional_value'],
    icon: '🍎'
  },
  'limpeza': {
    name: 'Produtos de Limpeza',
    preferredUnits: ['ml', 'l', 'g', 'kg'],
    comparisonFactors: ['volume', 'concentration', 'effectiveness'],
    icon: '🧽'
  },
  'bebidas': {
    name: 'Bebidas',
    preferredUnits: ['ml', 'l'],
    comparisonFactors: ['volume', 'alcohol_content'],
    icon: '🥤'
  },
  'higiene': {
    name: 'Higiene Pessoal',
    preferredUnits: ['ml', 'l', 'g', 'un'],
    comparisonFactors: ['volume', 'duration', 'effectiveness'],
    icon: '🧴'
  }
};

export class ProductComparisonService {
  /**
   * Extrai informações detalhadas de produtos com múltiplas dimensões
   */
  static extractProductDetails(product: ProductComparison): ProductComparison {
    const enrichedProduct = { ...product };
    
    if (product.description) {
      const description = product.description.toLowerCase();
      
      // Extrair número de rolos/unidades
      const rollsMatch = description.match(/(\d+)\s*rolos?/i) || 
                        description.match(/(\d+)\s*unidades?/i) ||
                        description.match(/(\d+)\s*un/i);
      if (rollsMatch) {
        enrichedProduct.quantity = parseInt(rollsMatch[1]);
      }
      
      // Extrair metros por rolo
      const metersMatch = description.match(/(\d+(?:\.\d+)?)\s*metros?/i) ||
                         description.match(/(\d+(?:\.\d+)?)\s*m(?:\s|$)/i);
      if (metersMatch) {
        enrichedProduct.metersPerUnit = parseFloat(metersMatch[1]);
        enrichedProduct.totalMeters = enrichedProduct.quantity * enrichedProduct.metersPerUnit;
      }
      
      // Extrair número de camadas
      const layersMatch = description.match(/(\d+)\s*camadas?/i) ||
                         description.match(/(\d+)\s*folhas?/i);
      if (layersMatch) {
        enrichedProduct.layers = parseInt(layersMatch[1]);
      }
      
      // Extrair número de folhas
      const sheetsMatch = description.match(/(\d+)\s*folhas?/i);
      if (sheetsMatch) {
        enrichedProduct.sheets = parseInt(sheetsMatch[1]);
      }
    }
    
    return enrichedProduct;
  }

  /**
   * Normaliza a quantidade do produto para a unidade base da categoria
   */
  static normalizeQuantity(quantity: number, unit: string): { normalizedQuantity: number; baseUnit: string; category: UnitCategory } | null {
    const conversion = UNIT_CONVERSIONS[unit.toLowerCase()];
    if (!conversion) {
      return null;
    }
    
    return {
      normalizedQuantity: quantity * conversion.multiplier,
      baseUnit: conversion.baseUnit,
      category: conversion.category
    };
  }

  /**
   * Calcula o preço por unidade base
   */
  static calculateUnitPrice(product: ProductComparison): number {
    // Primeiro, extrair detalhes do produto
    const enrichedProduct = this.extractProductDetails(product);
    
    // Para papel higiênico e produtos similares, usar metros totais se disponível
    if (enrichedProduct.totalMeters && enrichedProduct.totalMeters > 0) {
      return enrichedProduct.price / enrichedProduct.totalMeters;
    }
    
    const normalized = this.normalizeQuantity(enrichedProduct.quantity, enrichedProduct.unit);
    if (!normalized) {
      return enrichedProduct.price / enrichedProduct.quantity; // Fallback para unidades não reconhecidas
    }
    
    return enrichedProduct.price / normalized.normalizedQuantity;
  }

  /**
   * Agrupa produtos por categoria de unidade
   */
  static groupProductsByCategory(products: ProductComparison[]): { [category: string]: ProductComparison[] } {
    const groups: { [category: string]: ProductComparison[] } = {};
    
    products.forEach(product => {
      // Extrair detalhes do produto primeiro
      const detailedProduct = this.extractProductDetails(product);
      
      const normalized = this.normalizeQuantity(detailedProduct.quantity, detailedProduct.unit);
      const category = normalized?.category || 'outros';
      
      if (!groups[category]) {
        groups[category] = [];
      }
      
      const enrichedProduct = {
        ...detailedProduct,
        unitPrice: this.calculateUnitPrice(product),
        normalizedQuantity: normalized?.normalizedQuantity,
      };
      
      groups[category].push(enrichedProduct);
    });
    
    return groups;
  }

  /**
   * Compara produtos e retorna resultados organizados
   */
  static compareProducts(products: ProductComparison[]): ComparisonResult[] {
    if (products.length < 2) {
      return [];
    }

    const groupedProducts = this.groupProductsByCategory(products);
    const results: ComparisonResult[] = [];

    Object.entries(groupedProducts).forEach(([categoryName, categoryProducts]) => {
      if (categoryProducts.length < 2) {
        return; // Não comparar categorias com apenas 1 produto
      }

      // Ordenar por melhor custo-benefício (menor preço por unidade)
      const sortedProducts = categoryProducts.sort((a, b) => (a.unitPrice || 0) - (b.unitPrice || 0));
      const bestProduct = sortedProducts[0];
      
      // Calcular economia em relação ao melhor produto
      const savings: { [productId: string]: number } = {};
      sortedProducts.forEach(product => {
        if (product.id !== bestProduct.id) {
          const savingsAmount = (product.unitPrice || 0) - (bestProduct.unitPrice || 0);
          const savingsPercentage = ((savingsAmount / (bestProduct.unitPrice || 1)) * 100);
          savings[product.id] = savingsPercentage;
        }
      });

      results.push({
        category: categoryName as UnitCategory,
        products: sortedProducts,
        bestProduct,
        savings
      });
    });

    return results;
  }

  /**
   * Calcula a eficiência do produto baseada em múltiplos fatores
   */
  static calculateEfficiency(product: ProductComparison, category?: string): number {
    const unitPrice = product.unitPrice || this.calculateUnitPrice(product);
    
    // Fator base: preço por unidade (invertido para que menor preço = maior eficiência)
    let efficiency = 1 / unitPrice;
    
    // Ajustes baseados na categoria do produto
    if (category && PRODUCT_CATEGORIES[category as keyof typeof PRODUCT_CATEGORIES]) {
      const categoryInfo = PRODUCT_CATEGORIES[category as keyof typeof PRODUCT_CATEGORIES];
      
      // Para papel higiênico, considerar número de folhas se disponível
      if (category === 'papel_higienico' && product.description) {
        const layersMatch = product.description.match(/(\d+)\s*camadas?/i);
        if (layersMatch) {
          const layers = parseInt(layersMatch[1]);
          efficiency *= (1 + layers * 0.1); // Bonus por camadas extras
        }
      }
    }
    
    return efficiency;
  }

  /**
   * Formata o preço em reais
   */
  static formatPrice(price: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  }

  /**
   * Formata a unidade para exibição
   */
  static formatUnit(unit: string): string {
    const conversion = UNIT_CONVERSIONS[unit.toLowerCase()];
    return conversion ? conversion.baseUnit : unit;
  }

  /**
   * Obtém sugestões de unidades baseadas na categoria do produto
   */
  static getUnitSuggestions(productCategory?: string): string[] {
    if (productCategory && PRODUCT_CATEGORIES[productCategory as keyof typeof PRODUCT_CATEGORIES]) {
      return PRODUCT_CATEGORIES[productCategory as keyof typeof PRODUCT_CATEGORIES].preferredUnits;
    }
    
    // Unidades mais comuns como fallback
    return ['un', 'g', 'kg', 'ml', 'l', 'cm', 'm'];
  }

  /**
   * Valida se dois produtos podem ser comparados
   */
  static canCompareProducts(product1: ProductComparison, product2: ProductComparison): boolean {
    const norm1 = this.normalizeQuantity(product1.quantity, product1.unit);
    const norm2 = this.normalizeQuantity(product2.quantity, product2.unit);
    
    if (!norm1 || !norm2) {
      return false;
    }
    
    return norm1.category === norm2.category;
  }

  /**
   * Gera relatório de comparação em texto
   */
  static generateComparisonReport(results: ComparisonResult[]): string {
    let report = '📊 RELATÓRIO DE COMPARAÇÃO DE PRODUTOS\n\n';
    
    results.forEach((result, index) => {
      report += `${index + 1}. CATEGORIA: ${result.category.toUpperCase()}\n`;
      report += `   🏆 Melhor opção: ${result.bestProduct.name}\n`;
      
      // Mostrar informações específicas para papel higiênico
      if (result.bestProduct.totalMeters) {
        report += `   📏 Total: ${result.bestProduct.quantity} rolos × ${result.bestProduct.metersPerUnit}m = ${result.bestProduct.totalMeters}m\n`;
        report += `   💰 Preço por metro: ${this.formatPrice(result.bestProduct.unitPrice || 0)}\n`;
        if (result.bestProduct.layers) {
          report += `   📄 Camadas: ${result.bestProduct.layers}\n`;
        }
      } else {
        report += `   💰 Preço por ${this.formatUnit(result.bestProduct.unit)}: ${this.formatPrice(result.bestProduct.unitPrice || 0)}\n`;
      }
      report += '\n';
      
      result.products.forEach((product, productIndex) => {
        if (productIndex === 0) return; // Pular o melhor produto (já mostrado)
        
        const savings = result.savings[product.id];
        report += `   ${productIndex + 1}º ${product.name}\n`;
        
        if (product.totalMeters) {
          report += `      📏 ${product.quantity} rolos × ${product.metersPerUnit}m = ${product.totalMeters}m\n`;
          report += `      💰 ${this.formatPrice(product.unitPrice || 0)}/metro\n`;
          if (product.layers) {
            report += `      📄 ${product.layers} camadas\n`;
          }
        }
        
        report += `      💸 ${savings.toFixed(1)}% mais caro\n`;
      });
      
      report += '\n';
    });
    
    return report;
  }
}