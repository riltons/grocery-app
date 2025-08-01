import { COSMOS_API_KEY } from '@env';

export interface BarcodeResult {
  data: string;
  type: string;
  isValid: boolean;
  format: BarcodeFormat;
}

export enum BarcodeFormat {
  EAN13 = 'ean13',
  EAN8 = 'ean8',
  UPC_A = 'upc_a',
  UPC_E = 'upc_e',
  QR = 'qr'
}

export class BarcodeValidator {
  private static readonly SUPPORTED_FORMATS = [
    'ean13',
    'ean8',
    'upc_a',
    'upc_e',
    'qr'
  ];

  /**
   * Valida se o código de barras escaneado é um formato suportado
   */
  static validateBarcode(data: string, type: string): BarcodeResult {
    const result: BarcodeResult = {
      data: data.trim(),
      type,
      isValid: false,
      format: type as BarcodeFormat
    };

    // Verificar se o tipo é suportado
    if (!this.SUPPORTED_FORMATS.includes(type as any)) {
      console.warn(`Formato de código de barras não suportado: ${type}`);
      return result;
    }

    // Validar formato específico
    try {
      switch (type) {
        case 'ean13':
          result.isValid = this.validateEAN13(result.data);
          result.format = BarcodeFormat.EAN13;
          break;
        
        case 'ean8':
          result.isValid = this.validateEAN8(result.data);
          result.format = BarcodeFormat.EAN8;
          break;
        
        case 'upc_a':
          result.isValid = this.validateUPCA(result.data);
          result.format = BarcodeFormat.UPC_A;
          break;
        
        case 'upc_e':
          result.isValid = this.validateUPCE(result.data);
          result.format = BarcodeFormat.UPC_E;
          break;
        
        case 'qr':
          result.isValid = this.validateQR(result.data);
          result.format = BarcodeFormat.QR;
          break;
        
        default:
          result.isValid = false;
      }
    } catch (error) {
      console.error(`Erro na validação do código ${type}:`, error);
      result.isValid = false;
    }

    return result;
  }

  /**
   * Valida código EAN-13
   */
  private static validateEAN13(data: string): boolean {
    if (data.length !== 13) return false;
    if (!/^\d{13}$/.test(data)) return false;
    
    return this.validateCheckDigit(data, 13);
  }

  /**
   * Valida código EAN-8
   */
  private static validateEAN8(data: string): boolean {
    if (data.length !== 8) return false;
    if (!/^\d{8}$/.test(data)) return false;
    
    return this.validateCheckDigit(data, 8);
  }

  /**
   * Valida código UPC-A
   */
  private static validateUPCA(data: string): boolean {
    if (data.length !== 12) return false;
    if (!/^\d{12}$/.test(data)) return false;
    
    return this.validateCheckDigit(data, 12);
  }

  /**
   * Valida código UPC-E
   */
  private static validateUPCE(data: string): boolean {
    if (data.length !== 8) return false;
    if (!/^\d{8}$/.test(data)) return false;
    
    // UPC-E tem validação específica, mas para simplicidade
    // vamos aceitar qualquer código de 8 dígitos numéricos
    return true;
  }

  /**
   * Valida código QR
   */
  private static validateQR(data: string): boolean {
    // QR codes podem conter qualquer tipo de dados
    // Vamos verificar se contém informações de produto
    return data.length > 0 && data.length <= 2953; // Limite máximo do QR Code
  }

  /**
   * Valida dígito verificador para códigos EAN/UPC
   */
  private static validateCheckDigit(data: string, length: number): boolean {
    const digits = data.split('').map(Number);
    const checkDigit = digits[length - 1];
    
    let sum = 0;
    for (let i = 0; i < length - 1; i++) {
      if (length === 13) {
        // EAN-13: multiplica por 1 ou 3 alternadamente
        sum += digits[i] * (i % 2 === 0 ? 1 : 3);
      } else {
        // EAN-8, UPC-A: multiplica por 3 ou 1 alternadamente
        sum += digits[i] * (i % 2 === 0 ? 3 : 1);
      }
    }
    
    const calculatedCheckDigit = (10 - (sum % 10)) % 10;
    return calculatedCheckDigit === checkDigit;
  }

  /**
   * Formata código de barras para exibição
   */
  static formatBarcodeForDisplay(data: string, format: BarcodeFormat): string {
    switch (format) {
      case BarcodeFormat.EAN13:
        // Formato: 1 234567 890123
        return `${data.slice(0, 1)} ${data.slice(1, 7)} ${data.slice(7, 13)}`;
      
      case BarcodeFormat.EAN8:
        // Formato: 1234 5678
        return `${data.slice(0, 4)} ${data.slice(4, 8)}`;
      
      case BarcodeFormat.UPC_A:
        // Formato: 1 23456 78901 2
        return `${data.slice(0, 1)} ${data.slice(1, 6)} ${data.slice(6, 11)} ${data.slice(11, 12)}`;
      
      case BarcodeFormat.UPC_E:
        // Formato: 12345678
        return data;
      
      case BarcodeFormat.QR:
        return data;
      
      default:
        return data;
    }
  }

  /**
   * Verifica se o código de barras é provavelmente um código de produto
   */
  static isProductBarcode(result: BarcodeResult): boolean {
    if (!result.isValid) return false;

    switch (result.format) {
      case BarcodeFormat.EAN13:
      case BarcodeFormat.EAN8:
      case BarcodeFormat.UPC_A:
      case BarcodeFormat.UPC_E:
        return true;
      
      case BarcodeFormat.QR:
        // Para QR codes, verificar se contém informações de produto
        return this.isProductQRCode(result.data);
      
      default:
        return false;
    }
  }

  /**
   * Verifica se um QR code contém informações de produto
   */
  private static isProductQRCode(data: string): boolean {
    // Verificar se é um URL de produto ou contém GTIN
    const productPatterns = [
      /gtin[:\s]*(\d{8,14})/i,
      /ean[:\s]*(\d{8,13})/i,
      /upc[:\s]*(\d{8,12})/i,
      /product[_\s]*id/i,
      /barcode/i
    ];

    return productPatterns.some(pattern => pattern.test(data));
  }

  /**
   * Extrai código de produto de QR code se possível
   */
  static extractProductCodeFromQR(data: string): string | null {
    const gtinMatch = data.match(/gtin[:\s]*(\d{8,14})/i);
    if (gtinMatch) return gtinMatch[1];

    const eanMatch = data.match(/ean[:\s]*(\d{8,13})/i);
    if (eanMatch) return eanMatch[1];

    const upcMatch = data.match(/upc[:\s]*(\d{8,12})/i);
    if (upcMatch) return upcMatch[1];

    // Se for apenas números, pode ser um código de produto
    if (/^\d{8,14}$/.test(data)) return data;

    return null;
  }

  /**
   * Obtém informações sobre o formato do código
   */
  static getBarcodeFormatInfo(format: BarcodeFormat): { name: string; description: string } {
    switch (format) {
      case BarcodeFormat.EAN13:
        return {
          name: 'EAN-13',
          description: 'Código de barras europeu de 13 dígitos'
        };
      
      case BarcodeFormat.EAN8:
        return {
          name: 'EAN-8',
          description: 'Código de barras europeu de 8 dígitos'
        };
      
      case BarcodeFormat.UPC_A:
        return {
          name: 'UPC-A',
          description: 'Código de barras americano de 12 dígitos'
        };
      
      case BarcodeFormat.UPC_E:
        return {
          name: 'UPC-E',
          description: 'Código de barras americano compacto de 8 dígitos'
        };
      
      case BarcodeFormat.QR:
        return {
          name: 'QR Code',
          description: 'Código QR bidimensional'
        };
      
      default:
        return {
          name: 'Desconhecido',
          description: 'Formato não reconhecido'
        };
    }
  }
}

import { supabase, SpecificProduct, GenericProduct, BarcodeCache } from './supabase';
import { ProductService } from './products';

// Interfaces para o BarcodeService
export interface ProductInfo {
  barcode: string;
  name: string;
  brand?: string;
  category?: string;
  image?: string;
  description?: string;
  source: 'local' | 'cosmos' | 'openfoodfacts' | 'manual';
  confidence: number;
  genericProduct?: {
    id: string;
    name: string;
    category: string;
  };
  metadata?: {
    ncm?: string;
    unit?: string;
    gtin?: string;
    weight?: string;
    volume?: string;
  };
}

export interface BarcodeSearchResult {
  found: boolean;
  product?: ProductInfo;
  error?: string;
}

/**
 * Serviço para processamento de códigos de barras
 * Implementa busca local, cache e integração com APIs externas
 */
export class BarcodeService {
  private static readonly CACHE_TTL_HOURS = 24; // TTL padrão do cache em horas
  private static readonly FRESH_DATA_HOURS = 6; // Dados considerados frescos por 6 horas

  /**
   * Busca produto específico existente no banco de dados (primeira prioridade)
   * Esta função verifica se o produto já foi cadastrado pelo usuário
   */
  static async searchExistingSpecificProduct(barcode: string): Promise<BarcodeSearchResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { found: false };
      }

      // Buscar produto específico por código de barras
      const { data: specificProduct, error } = await supabase
        .from('specific_products')
        .select(`
          *,
          generic_products (
            id,
            name,
            category
          )
        `)
        .eq('barcode', barcode)
        .eq('user_id', user.id)
        .single();

      if (error || !specificProduct) {
        return { found: false };
      }

      // Converter produto específico para ProductInfo
      const productInfo: ProductInfo = {
        barcode: specificProduct.barcode || barcode,
        name: specificProduct.name,
        brand: specificProduct.brand || '',
        category: specificProduct.generic_products?.category || '',
        description: specificProduct.description || '',
        image: specificProduct.image_url || '',
        source: 'local',
        confidence: 1.0, // Máxima confiança para produtos já cadastrados
        genericProduct: specificProduct.generic_products ? {
          id: specificProduct.generic_products.id,
          name: specificProduct.generic_products.name,
          category: specificProduct.generic_products.category || ''
        } : undefined
      };

      console.log(`Produto específico encontrado no BD: ${specificProduct.name}`);
      return { found: true, product: productInfo };
    } catch (error) {
      console.error('Erro ao buscar produto específico existente:', error);
      return { found: false };
    }
  }

  /**
   * Busca um produto por código de barras localmente
   * Verifica primeiro o cache, depois a tabela de produtos específicos
   */
  static async searchLocal(barcode: string): Promise<BarcodeSearchResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { found: false, error: 'Usuário não autenticado' };
      }

      // 1. Primeiro, buscar no cache
      const cacheResult = await this.searchCache(barcode, user.id);
      if (cacheResult.found && this.isDataFresh(cacheResult.product)) {
        return cacheResult;
      }

      // 2. Buscar na tabela de produtos específicos
      const { data: specificProducts, error: specificError } = await supabase
        .from('specific_products')
        .select(`
          *,
          generic_products (
            id,
            name,
            category
          )
        `)
        .eq('barcode', barcode)
        .eq('user_id', user.id);

      if (specificError) {
        console.error('Erro ao buscar produto específico:', specificError);
        return { found: false, error: specificError.message };
      }

      if (specificProducts && specificProducts.length > 0) {
        const product = specificProducts[0];
        const productInfo: ProductInfo = {
          barcode: product.barcode || barcode,
          name: product.name,
          brand: product.brand,
          category: product.generic_products?.category,
          image: product.image_url,
          description: product.description,
          source: (product.data_source as any) || 'local',
          confidence: product.confidence_score || 1.0,
          genericProduct: product.generic_products ? {
            id: product.generic_products.id,
            name: product.generic_products.name,
            category: product.generic_products.category || ''
          } : undefined,
          metadata: {
            unit: product.default_unit
          }
        };

        // Atualizar cache com dados encontrados
        await this.cacheProduct(barcode, productInfo, user.id);

        return { found: true, product: productInfo };
      }

      // 3. Se não encontrou, retornar dados do cache mesmo se antigos
      if (cacheResult.found) {
        return {
          found: true,
          product: {
            ...cacheResult.product!,
            confidence: Math.max(0.3, cacheResult.product!.confidence - 0.2) // Reduzir confiança
          }
        };
      }

      return { found: false };
    } catch (error) {
      console.error('Erro na busca local:', error);
      return { found: false, error: (error as Error).message };
    }
  }

  /**
   * Busca no cache de códigos de barras
   */
  private static async searchCache(barcode: string, userId: string): Promise<BarcodeSearchResult> {
    try {
      const { data: cacheEntries, error } = await supabase
        .from('barcode_cache')
        .select('*')
        .eq('barcode', barcode)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Erro ao buscar no cache:', error);
        return { found: false };
      }

      if (cacheEntries && cacheEntries.length > 0) {
        const cacheEntry = cacheEntries[0];
        
        // Verificar se não expirou
        if (cacheEntry.expires_at && new Date(cacheEntry.expires_at) < new Date()) {
          // Cache expirado, remover entrada
          await this.removeCacheEntry(cacheEntry.id);
          return { found: false };
        }

        const productInfo: ProductInfo = {
          ...cacheEntry.product_data,
          barcode,
          source: cacheEntry.source as any,
          confidence: cacheEntry.confidence_score || 0.8
        };

        return { found: true, product: productInfo };
      }

      return { found: false };
    } catch (error) {
      console.error('Erro ao buscar no cache:', error);
      return { found: false };
    }
  }

  /**
   * Armazena um produto no cache
   */
  static async cacheProduct(barcode: string, product: ProductInfo, userId?: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;
      
      if (!targetUserId) {
        console.warn('Usuário não autenticado, não foi possível fazer cache');
        return;
      }

      // Calcular data de expiração baseada na confiança
      const hoursToExpire = this.calculateCacheTTL(product.confidence, product.source);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + hoursToExpire);

      // Remover entradas antigas do mesmo código de barras
      await supabase
        .from('barcode_cache')
        .delete()
        .eq('barcode', barcode)
        .eq('user_id', targetUserId);

      // Inserir nova entrada
      const { error } = await supabase
        .from('barcode_cache')
        .insert({
          barcode,
          barcode_type: this.getBarcodeType(barcode),
          product_data: product,
          source: product.source,
          confidence_score: product.confidence,
          expires_at: expiresAt.toISOString(),
          user_id: targetUserId
        });

      if (error) {
        console.error('Erro ao salvar no cache:', error);
      }
    } catch (error) {
      console.error('Erro ao fazer cache do produto:', error);
    }
  }

  /**
   * Verifica se os dados estão frescos (recentes)
   */
  private static isDataFresh(product?: ProductInfo): boolean {
    if (!product) return false;
    
    // Dados manuais são sempre considerados frescos
    if (product.source === 'manual' || product.source === 'local') {
      return true;
    }

    // Para dados externos, verificar se são recentes
    // Como não temos timestamp no ProductInfo, vamos assumir que dados com alta confiança são frescos
    return product.confidence >= 0.8;
  }

  /**
   * Calcula o TTL do cache baseado na confiança e fonte
   */
  private static calculateCacheTTL(confidence: number, source: string): number {
    const baseTTL = this.CACHE_TTL_HOURS;
    
    switch (source) {
      case 'local':
      case 'manual':
        return baseTTL * 7; // 7 dias para dados locais
      case 'cosmos':
        return Math.floor(baseTTL * (1 + confidence)); // 24-48h baseado na confiança
      case 'openfoodfacts':
        return Math.floor(baseTTL * confidence); // 12-24h baseado na confiança
      default:
        return baseTTL;
    }
  }

  /**
   * Determina o tipo do código de barras baseado no comprimento
   */
  private static getBarcodeType(barcode: string): string {
    switch (barcode.length) {
      case 8:
        return 'EAN8';
      case 12:
        return 'UPC_A';
      case 13:
        return 'EAN13';
      default:
        return 'UNKNOWN';
    }
  }

  /**
   * Remove uma entrada específica do cache
   */
  private static async removeCacheEntry(cacheId: string): Promise<void> {
    try {
      await supabase
        .from('barcode_cache')
        .delete()
        .eq('id', cacheId);
    } catch (error) {
      console.error('Erro ao remover entrada do cache:', error);
    }
  }

  /**
   * Limpa entradas expiradas do cache
   */
  static async cleanExpiredCache(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const now = new Date().toISOString();
      
      await supabase
        .from('barcode_cache')
        .delete()
        .eq('user_id', user.id)
        .lt('expires_at', now);
    } catch (error) {
      console.error('Erro ao limpar cache expirado:', error);
    }
  }

  /**
   * Busca produtos específicos existentes por código de barras
   * Útil para verificar se um produto já foi cadastrado
   */
  static async findExistingProductByBarcode(barcode: string): Promise<SpecificProduct | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      const { data, error } = await supabase
        .from('specific_products')
        .select('*')
        .eq('barcode', barcode)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Erro ao buscar produto existente:', error);
        return null;
      }

      return data || null;
    } catch (error) {
      console.error('Erro ao buscar produto existente:', error);
      return null;
    }
  }

  /**
   * Verifica se dados do cache estão frescos baseado no timestamp
   */
  static isDataFreshByTimestamp(timestamp: string, freshHours: number = this.FRESH_DATA_HOURS): boolean {
    const dataTime = new Date(timestamp);
    const now = new Date();
    const diffHours = (now.getTime() - dataTime.getTime()) / (1000 * 60 * 60);
    
    return diffHours <= freshHours;
  }

  /**
   * Busca produto com estratégia de fallback entre APIs
   * Ordem: BD Específicos → Cache Local → Cosmos → Open Food Facts
   */
  static async searchWithFallback(barcode: string): Promise<BarcodeSearchResult> {
    try {
      console.log(`Iniciando busca com fallback para código: ${barcode}`);

      // 1. PRIMEIRO: Verificar se já existe produto específico no BD
      const existingProduct = await this.searchExistingSpecificProduct(barcode);
      if (existingProduct.found) {
        console.log('Produto específico encontrado no banco de dados');
        return existingProduct;
      }

      // 2. Busca no cache local (mais rápido)
      const localResult = await this.searchLocal(barcode);
      if (localResult.found && this.isDataFresh(localResult.product)) {
        console.log('Produto encontrado no cache local com dados frescos');
        return localResult;
      }

      // 2. Busca na API Cosmos (produtos brasileiros)
      if (CosmosService.isValidGTIN(barcode)) {
        console.log('Buscando na API Cosmos...');
        const normalizedGTIN = CosmosService.normalizeGTIN(barcode);
        const cosmosResult = await CosmosService.getProductByGTIN(normalizedGTIN);
        
        if (cosmosResult) {
          console.log('Produto encontrado na API Cosmos');
          // Fazer cache do resultado
          await this.cacheProduct(barcode, cosmosResult);
          return { found: true, product: cosmosResult };
        }
      }

      // 3. Fallback para Open Food Facts (produtos internacionais)
      console.log('Buscando no Open Food Facts...');
      const openFoodResult = await OpenFoodFactsService.getProduct(barcode);
      if (openFoodResult) {
        console.log('Produto encontrado no Open Food Facts');
        // Fazer cache do resultado
        await this.cacheProduct(barcode, openFoodResult);
        return { found: true, product: openFoodResult };
      }

      // 4. Fallback para dados locais mesmo se antigos
      if (localResult.found) {
        console.log('Usando dados locais antigos como fallback');
        return {
          found: true,
          product: {
            ...localResult.product!,
            confidence: Math.max(0.3, localResult.product!.confidence - 0.2) // Reduzir confiança
          }
        };
      }

      // 5. Último recurso: produto vazio para preenchimento manual
      console.log('Produto não encontrado em nenhuma fonte');
      return {
        found: true,
        product: this.createEmptyProduct(barcode)
      };
    } catch (error) {
      console.error('Erro na busca com fallback:', error);
      return { found: false, error: (error as Error).message };
    }
  }

  /**
   * Cria um produto vazio para preenchimento manual
   */
  private static createEmptyProduct(barcode: string): ProductInfo {
    return {
      barcode,
      name: '',
      source: 'manual',
      confidence: 0.1,
      metadata: {}
    };
  }

  /**
   * Busca inteligente com cache dinâmico e métricas de confiança
   */
  static async smartSearch(barcode: string): Promise<{
    result: BarcodeSearchResult;
    metrics: {
      searchTime: number;
      sourcesAttempted: string[];
      cacheHit: boolean;
      confidenceScore: number;
    };
  }> {
    const startTime = Date.now();
    const sourcesAttempted: string[] = [];
    let cacheHit = false;

    try {
      // Verificar cache primeiro
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const cacheResult = await this.searchCache(barcode, user.id);
        if (cacheResult.found) {
          cacheHit = true;
          sourcesAttempted.push('cache');
          
          if (this.isDataFresh(cacheResult.product)) {
            const searchTime = Date.now() - startTime;
            return {
              result: cacheResult,
              metrics: {
                searchTime,
                sourcesAttempted,
                cacheHit,
                confidenceScore: cacheResult.product?.confidence || 0
              }
            };
          }
        }
      }

      // Busca com fallback
      sourcesAttempted.push('local');
      const result = await this.searchWithFallback(barcode);
      
      // Determinar fontes tentadas baseado no resultado
      if (result.found && result.product) {
        if (result.product.source !== 'local') {
          sourcesAttempted.push(result.product.source);
        }
      }

      const searchTime = Date.now() - startTime;
      
      return {
        result,
        metrics: {
          searchTime,
          sourcesAttempted,
          cacheHit,
          confidenceScore: result.product?.confidence || 0
        }
      };
    } catch (error) {
      const searchTime = Date.now() - startTime;
      return {
        result: { found: false, error: (error as Error).message },
        metrics: {
          searchTime,
          sourcesAttempted,
          cacheHit,
          confidenceScore: 0
        }
      };
    }
  }

  /**
   * Busca em lote com otimização de cache
   */
  static async batchSearch(barcodes: string[]): Promise<{
    [barcode: string]: BarcodeSearchResult;
  }> {
    const results: { [barcode: string]: BarcodeSearchResult } = {};
    
    // Separar códigos que estão no cache dos que precisam ser buscados
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Se não há usuário, buscar todos individualmente
      for (const barcode of barcodes) {
        results[barcode] = await this.searchWithFallback(barcode);
      }
      return results;
    }

    const cachedResults: { [barcode: string]: BarcodeSearchResult } = {};
    const toBeFetched: string[] = [];

    // Verificar cache para todos os códigos
    for (const barcode of barcodes) {
      const cacheResult = await this.searchCache(barcode, user.id);
      if (cacheResult.found && this.isDataFresh(cacheResult.product)) {
        cachedResults[barcode] = cacheResult;
      } else {
        toBeFetched.push(barcode);
      }
    }

    // Buscar códigos não encontrados no cache
    const cosmosPromises: Promise<{ barcode: string; result: ProductInfo | null }>[] = [];
    const openFoodPromises: Promise<{ barcode: string; result: ProductInfo | null }>[] = [];

    // Separar códigos válidos para Cosmos dos demais
    const cosmosGTINs = toBeFetched.filter(barcode => CosmosService.isValidGTIN(barcode));
    const otherBarcodes = toBeFetched.filter(barcode => !CosmosService.isValidGTIN(barcode));

    // Buscar em lote na Cosmos
    if (cosmosGTINs.length > 0) {
      const cosmosResults = await CosmosService.getMultipleProductsByGTIN(cosmosGTINs);
      for (const [gtin, result] of Object.entries(cosmosResults)) {
        if (result) {
          await this.cacheProduct(gtin, result, user.id);
          results[gtin] = { found: true, product: result };
        } else {
          // Tentar Open Food Facts como fallback
          openFoodPromises.push(
            OpenFoodFactsService.getProduct(gtin).then(result => ({ barcode: gtin, result }))
          );
        }
      }
    }

    // Buscar códigos não válidos para Cosmos diretamente no Open Food Facts
    for (const barcode of otherBarcodes) {
      openFoodPromises.push(
        OpenFoodFactsService.getProduct(barcode).then(result => ({ barcode, result }))
      );
    }

    // Processar resultados do Open Food Facts
    const openFoodResults = await Promise.allSettled(openFoodPromises);
    for (const promiseResult of openFoodResults) {
      if (promiseResult.status === 'fulfilled') {
        const { barcode, result } = promiseResult.value;
        if (result) {
          await this.cacheProduct(barcode, result, user.id);
          results[barcode] = { found: true, product: result };
        } else {
          results[barcode] = { found: false };
        }
      }
    }

    // Combinar resultados do cache com os buscados
    return { ...cachedResults, ...results };
  }

  /**
   * Obtém estatísticas do cache para debugging
   */
  static async getCacheStats(): Promise<{
    totalEntries: number;
    expiredEntries: number;
    sourceBreakdown: { [key: string]: number };
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { totalEntries: 0, expiredEntries: 0, sourceBreakdown: {} };
      }

      const { data: cacheEntries, error } = await supabase
        .from('barcode_cache')
        .select('source, expires_at')
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao obter estatísticas do cache:', error);
        return { totalEntries: 0, expiredEntries: 0, sourceBreakdown: {} };
      }

      const now = new Date();
      let expiredCount = 0;
      const sourceBreakdown: { [key: string]: number } = {};

      cacheEntries?.forEach(entry => {
        // Contar por fonte
        sourceBreakdown[entry.source] = (sourceBreakdown[entry.source] || 0) + 1;
        
        // Contar expirados
        if (entry.expires_at && new Date(entry.expires_at) < now) {
          expiredCount++;
        }
      });

      return {
        totalEntries: cacheEntries?.length || 0,
        expiredEntries: expiredCount,
        sourceBreakdown
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas do cache:', error);
      return { totalEntries: 0, expiredEntries: 0, sourceBreakdown: {} };
    }
  }

  /**
   * Otimiza o cache removendo entradas antigas e duplicadas
   */
  static async optimizeCache(): Promise<{
    removedExpired: number;
    removedDuplicates: number;
    totalRemoved: number;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { removedExpired: 0, removedDuplicates: 0, totalRemoved: 0 };
      }

      // Remover entradas expiradas
      const now = new Date().toISOString();
      const { data: expiredEntries, error: expiredError } = await supabase
        .from('barcode_cache')
        .select('id')
        .eq('user_id', user.id)
        .lt('expires_at', now);

      let removedExpired = 0;
      if (!expiredError && expiredEntries) {
        const { error: deleteExpiredError } = await supabase
          .from('barcode_cache')
          .delete()
          .eq('user_id', user.id)
          .lt('expires_at', now);

        if (!deleteExpiredError) {
          removedExpired = expiredEntries.length;
        }
      }

      // Remover duplicatas (manter apenas a mais recente de cada código)
      const { data: allEntries, error: allError } = await supabase
        .from('barcode_cache')
        .select('id, barcode, created_at')
        .eq('user_id', user.id)
        .order('barcode')
        .order('created_at', { ascending: false });

      let removedDuplicates = 0;
      if (!allError && allEntries) {
        const seenBarcodes = new Set<string>();
        const duplicateIds: string[] = [];

        for (const entry of allEntries) {
          if (seenBarcodes.has(entry.barcode)) {
            duplicateIds.push(entry.id);
          } else {
            seenBarcodes.add(entry.barcode);
          }
        }

        if (duplicateIds.length > 0) {
          const { error: deleteDuplicatesError } = await supabase
            .from('barcode_cache')
            .delete()
            .in('id', duplicateIds);

          if (!deleteDuplicatesError) {
            removedDuplicates = duplicateIds.length;
          }
        }
      }

      const totalRemoved = removedExpired + removedDuplicates;

      return { removedExpired, removedDuplicates, totalRemoved };
    } catch (error) {
      console.error('Erro ao otimizar cache:', error);
      return { removedExpired: 0, removedDuplicates: 0, totalRemoved: 0 };
    }
  }
}

// Interfaces para API Cosmos
interface CosmosApiResponse {
  gtin: string;
  description: string;
  brand: string;
  ncm: string;
  tax_info?: {
    icms: number;
    ipi: number;
    pis_cofins: number;
  };
  category: string;
  unit: string;
  image_url?: string;
  thumbnail?: string;
  avg_price?: number;
  max_price?: number;
  min_price?: number;
}

interface CosmosErrorResponse {
  error: string;
  message: string;
}

/**
 * Serviço para integração com a API Cosmos (produtos brasileiros)
 */
export class CosmosService {
  private static readonly BASE_URL = 'https://api.cosmos.bluesoft.com.br';
  private static readonly API_KEY = COSMOS_API_KEY || '';
  private static readonly TIMEOUT_MS = 10000; // 10 segundos
  private static readonly MAX_RETRIES = 3;

  /**
   * Busca produto por GTIN na API Cosmos
   */
  static async getProductByGTIN(gtin: string): Promise<ProductInfo | null> {
    console.log('🔑 Token Cosmos carregado:', this.API_KEY ? 'SIM' : 'NÃO');
    
    if (!this.API_KEY) {
      console.warn('Chave da API Cosmos não configurada');
      return null;
    }

    try {
      const response = await this.makeRequest(`/gtins/${gtin}`);
      
      if (!response) {
        return null;
      }

      return this.transformCosmosToProductInfo(response, gtin);
    } catch (error) {
      console.error('Erro na API Cosmos:', error);
      return null;
    }
  }

  /**
   * Faz requisição para a API Cosmos com retry
   */
  private static async makeRequest(endpoint: string, retryCount = 0): Promise<CosmosApiResponse | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

      const response = await fetch(`${this.BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'X-Cosmos-Token': this.API_KEY,
          'User-Agent': 'GroceryApp/1.0',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) {
          // Produto não encontrado
          return null;
        }
        
        if (response.status === 429 && retryCount < this.MAX_RETRIES) {
          // Rate limit - aguardar e tentar novamente
          const delay = Math.pow(2, retryCount) * 1000; // Backoff exponencial
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.makeRequest(endpoint, retryCount + 1);
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Verificar se é uma resposta de erro
      if ('error' in data) {
        const errorData = data as CosmosErrorResponse;
        throw new Error(`API Error: ${errorData.message}`);
      }

      return data as CosmosApiResponse;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Timeout na requisição para API Cosmos');
      }

      if (retryCount < this.MAX_RETRIES) {
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequest(endpoint, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Transforma dados da API Cosmos para ProductInfo
   */
  private static transformCosmosToProductInfo(cosmosData: CosmosApiResponse, gtin: string): ProductInfo {
    const productInfo: ProductInfo = {
      barcode: gtin,
      name: cosmosData.description,
      brand: cosmosData.brand?.name || undefined,
      category: this.mapCosmosCategory(cosmosData.category),
      image: cosmosData.image_url || cosmosData.thumbnail,
      source: 'cosmos',
      confidence: 0.9, // Alta confiança para dados da Cosmos
      metadata: {
        ncm: cosmosData.ncm,
        unit: cosmosData.unit,
        gtin: cosmosData.gtin,
        weight: this.extractWeight(cosmosData.description),
        volume: this.extractVolume(cosmosData.description)
      }
    };

    return productInfo;
  }

  /**
   * Mapeia categorias da Cosmos para categorias internas
   */
  private static mapCosmosCategory(cosmosCategory: any): string {
    // Handle case where category is an object with description
    let categoryName: string;
    if (typeof cosmosCategory === 'object' && cosmosCategory?.description) {
      categoryName = cosmosCategory.description;
    } else if (typeof cosmosCategory === 'string') {
      categoryName = cosmosCategory;
    } else {
      return 'Outros';
    }

    const categoryMap: { [key: string]: string } = {
      'Alimentos e Bebidas': 'Alimentação',
      'Bebidas': 'Bebidas',
      'Laticínios': 'Laticínios',
      'Carnes e Peixes': 'Carnes',
      'Frutas e Vegetais': 'Hortifruti',
      'Padaria': 'Padaria',
      'Congelados': 'Congelados',
      'Higiene e Beleza': 'Higiene',
      'Limpeza': 'Limpeza',
      'Casa e Jardim': 'Casa',
      'Pet Shop': 'Pet',
      'Farmácia': 'Farmácia',
      'Refrigerantes Pet': 'Bebidas',
      'Refrigerantes': 'Bebidas'
    };

    return categoryMap[categoryName] || categoryName || 'Outros';
  }

  /**
   * Extrai informações de peso do nome do produto
   */
  private static extractWeight(productName: string): string | undefined {
    const weightPatterns = [
      /(\d+(?:\.\d+)?)\s*kg/gi,
      /(\d+(?:\.\d+)?)\s*g(?:\s|$)/gi,
      /(\d+(?:\.\d+)?)\s*gramas?/gi,
      /(\d+(?:\.\d+)?)\s*quilos?/gi
    ];

    for (const pattern of weightPatterns) {
      const match = productName.match(pattern);
      if (match) {
        return match[0].toLowerCase();
      }
    }

    return undefined;
  }

  /**
   * Extrai informações de volume do nome do produto
   */
  private static extractVolume(productName: string): string | undefined {
    const volumePatterns = [
      /(\d+(?:\.\d+)?)\s*l(?:\s|$)/gi,
      /(\d+(?:\.\d+)?)\s*ml/gi,
      /(\d+(?:\.\d+)?)\s*litros?/gi,
      /(\d+(?:\.\d+)?)\s*mililitros?/gi
    ];

    for (const pattern of volumePatterns) {
      const match = productName.match(pattern);
      if (match) {
        return match[0].toLowerCase();
      }
    }

    return undefined;
  }

  /**
   * Busca múltiplos produtos por uma lista de GTINs
   */
  static async getMultipleProductsByGTIN(gtins: string[]): Promise<{ [gtin: string]: ProductInfo | null }> {
    const results: { [gtin: string]: ProductInfo | null } = {};
    
    // Processar em lotes para não sobrecarregar a API
    const batchSize = 5;
    for (let i = 0; i < gtins.length; i += batchSize) {
      const batch = gtins.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (gtin) => {
        const result = await this.getProductByGTIN(gtin);
        return { gtin, result };
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((promiseResult, index) => {
        const gtin = batch[index];
        if (promiseResult.status === 'fulfilled') {
          results[gtin] = promiseResult.value.result;
        } else {
          console.error(`Erro ao buscar GTIN ${gtin}:`, promiseResult.reason);
          results[gtin] = null;
        }
      });

      // Pequena pausa entre lotes para respeitar rate limits
      if (i + batchSize < gtins.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return results;
  }

  /**
   * Verifica se a API Cosmos está disponível
   */
  static async checkApiHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'X-Cosmos-Token': this.API_KEY,
          'User-Agent': 'GroceryApp/1.0'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.error('Erro ao verificar saúde da API Cosmos:', error);
      return false;
    }
  }

  /**
   * Obtém estatísticas de uso da API (se disponível)
   */
  static async getApiUsageStats(): Promise<{
    requestsToday: number;
    requestsThisMonth: number;
    remainingQuota: number;
  } | null> {
    try {
      const response = await this.makeRequest('/usage');
      
      if (response && 'requests_today' in response) {
        return {
          requestsToday: (response as any).requests_today || 0,
          requestsThisMonth: (response as any).requests_this_month || 0,
          remainingQuota: (response as any).remaining_quota || 0
        };
      }

      return null;
    } catch (error) {
      console.error('Erro ao obter estatísticas da API:', error);
      return null;
    }
  }

  /**
   * Valida se um GTIN é válido para busca na Cosmos
   */
  static isValidGTIN(gtin: string): boolean {
    // GTINs válidos: 8, 12, 13 ou 14 dígitos
    if (!/^\d{8}$|^\d{12}$|^\d{13}$|^\d{14}$/.test(gtin)) {
      return false;
    }

    // Verificar se não é um código interno de loja (geralmente começam com 2)
    if (gtin.startsWith('2') && gtin.length === 13) {
      return false;
    }

    return true;
  }

  /**
   * Normaliza GTIN para formato padrão da API
   */
  static normalizeGTIN(gtin: string): string {
    // Remove espaços e caracteres especiais
    const cleaned = gtin.replace(/\D/g, '');
    
    // Converte EAN-8 para EAN-13 adicionando zeros à esquerda
    if (cleaned.length === 8) {
      return '00000' + cleaned;
    }
    
    // Converte UPC-A para EAN-13 adicionando zero à esquerda
    if (cleaned.length === 12) {
      return '0' + cleaned;
    }
    
    return cleaned;
  }
}

// Interfaces para Open Food Facts API
interface OpenFoodFactsProduct {
  product_name?: string;
  product_name_pt?: string;
  brands?: string;
  categories?: string;
  categories_hierarchy?: string[];
  image_url?: string;
  image_front_url?: string;
  image_front_small_url?: string;
  nutriments?: {
    energy_100g?: number;
    fat_100g?: number;
    carbohydrates_100g?: number;
    proteins_100g?: number;
    salt_100g?: number;
    sodium_100g?: number;
    sugars_100g?: number;
    fiber_100g?: number;
  };
  quantity?: string;
  serving_size?: string;
  packaging?: string;
  labels?: string;
  countries?: string;
  manufacturing_places?: string;
  ingredients_text?: string;
  ingredients_text_pt?: string;
  allergens?: string;
  traces?: string;
  nutrition_grade_fr?: string;
  nova_group?: number;
  ecoscore_grade?: string;
}

interface OpenFoodFactsResponse {
  code: string;
  status: number;
  status_verbose: string;
  product?: OpenFoodFactsProduct;
}

interface NutritionalInfo {
  energy?: number; // kcal por 100g
  fat?: number; // g por 100g
  carbohydrates?: number; // g por 100g
  proteins?: number; // g por 100g
  salt?: number; // g por 100g
  sodium?: number; // mg por 100g
  sugars?: number; // g por 100g
  fiber?: number; // g por 100g
  nutritionGrade?: string; // A, B, C, D, E
  novaGroup?: number; // 1-4
  ecoScore?: string; // A, B, C, D, E
}

/**
 * Serviço para integração com Open Food Facts (fallback para produtos internacionais)
 */
export class OpenFoodFactsService {
  private static readonly BASE_URL = 'https://world.openfoodfacts.org/api/v0';
  private static readonly TIMEOUT_MS = 8000; // 8 segundos
  private static readonly MAX_RETRIES = 2;

  /**
   * Busca produto por código de barras no Open Food Facts
   */
  static async getProduct(barcode: string): Promise<ProductInfo | null> {
    try {
      const response = await this.makeRequest(`/product/${barcode}.json`);
      
      if (!response || response.status === 0) {
        return null;
      }

      return this.transformOpenFoodFactsToProductInfo(response, barcode);
    } catch (error) {
      console.error('Erro na API Open Food Facts:', error);
      return null;
    }
  }

  /**
   * Faz requisição para a API Open Food Facts com retry
   */
  private static async makeRequest(endpoint: string, retryCount = 0): Promise<OpenFoodFactsResponse | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

      const response = await fetch(`${this.BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'GroceryApp/1.0 (https://github.com/grocery-app)',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        
        if (response.status === 429 && retryCount < this.MAX_RETRIES) {
          // Rate limit - aguardar e tentar novamente
          const delay = Math.pow(2, retryCount) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.makeRequest(endpoint, retryCount + 1);
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data as OpenFoodFactsResponse;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Timeout na requisição para Open Food Facts');
      }

      if (retryCount < this.MAX_RETRIES) {
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequest(endpoint, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Transforma dados do Open Food Facts para ProductInfo
   */
  private static transformOpenFoodFactsToProductInfo(
    offData: OpenFoodFactsResponse, 
    barcode: string
  ): ProductInfo {
    const product = offData.product!;
    
    // Priorizar nomes em português
    const productName = product.product_name_pt || product.product_name || 'Produto sem nome';
    
    const productInfo: ProductInfo = {
      barcode,
      name: productName,
      brand: product.brands?.split(',')[0]?.trim(),
      category: this.mapOpenFoodFactsCategory(product.categories_hierarchy),
      image: this.selectBestImage(product),
      description: this.buildDescription(product),
      source: 'openfoodfacts',
      confidence: this.calculateConfidence(product),
      metadata: {
        unit: this.extractUnit(product.quantity),
        weight: this.extractWeight(product.quantity || productName),
        volume: this.extractVolume(product.quantity || productName)
      }
    };

    return productInfo;
  }

  /**
   * Mapeia categorias do Open Food Facts para categorias internas
   */
  private static mapOpenFoodFactsCategory(categoriesHierarchy?: string[]): string {
    if (!categoriesHierarchy || categoriesHierarchy.length === 0) {
      return 'Outros';
    }

    const categoryMap: { [key: string]: string } = {
      'en:beverages': 'Bebidas',
      'en:alcoholic-beverages': 'Bebidas',
      'en:non-alcoholic-beverages': 'Bebidas',
      'en:dairy': 'Laticínios',
      'en:milk': 'Laticínios',
      'en:cheese': 'Laticínios',
      'en:yogurt': 'Laticínios',
      'en:meat': 'Carnes',
      'en:poultry': 'Carnes',
      'en:fish': 'Carnes',
      'en:seafood': 'Carnes',
      'en:fruits': 'Hortifruti',
      'en:vegetables': 'Hortifruti',
      'en:bread': 'Padaria',
      'en:bakery': 'Padaria',
      'en:cereals': 'Cereais',
      'en:pasta': 'Massas',
      'en:rice': 'Cereais',
      'en:frozen-foods': 'Congelados',
      'en:snacks': 'Snacks',
      'en:chocolate': 'Doces',
      'en:candy': 'Doces',
      'en:condiments': 'Condimentos',
      'en:sauces': 'Condimentos',
      'en:oils': 'Óleos',
      'en:baby-food': 'Infantil',
      'en:pet-food': 'Pet'
    };

    // Procurar pela categoria mais específica primeiro
    for (let i = categoriesHierarchy.length - 1; i >= 0; i--) {
      const category = categoriesHierarchy[i];
      if (categoryMap[category]) {
        return categoryMap[category];
      }
    }

    return 'Alimentação';
  }

  /**
   * Seleciona a melhor imagem disponível
   */
  private static selectBestImage(product: OpenFoodFactsProduct): string | undefined {
    // Prioridade: front_url > front_small_url > image_url
    return product.image_front_url || 
           product.image_front_small_url || 
           product.image_url;
  }

  /**
   * Constrói descrição do produto baseada nas informações disponíveis
   */
  private static buildDescription(product: OpenFoodFactsProduct): string | undefined {
    const parts: string[] = [];

    if (product.quantity) {
      parts.push(`Quantidade: ${product.quantity}`);
    }

    if (product.packaging) {
      parts.push(`Embalagem: ${product.packaging}`);
    }

    if (product.countries) {
      const countries = product.countries.split(',').map(c => c.trim());
      if (countries.length > 0) {
        parts.push(`Origem: ${countries[0]}`);
      }
    }

    if (product.nutrition_grade_fr) {
      parts.push(`Nutri-Score: ${product.nutrition_grade_fr.toUpperCase()}`);
    }

    return parts.length > 0 ? parts.join(' • ') : undefined;
  }

  /**
   * Calcula confiança baseada na completude dos dados
   */
  private static calculateConfidence(product: OpenFoodFactsProduct): number {
    let score = 0.5; // Base score

    // Nome do produto
    if (product.product_name || product.product_name_pt) score += 0.2;
    
    // Marca
    if (product.brands) score += 0.1;
    
    // Categoria
    if (product.categories_hierarchy && product.categories_hierarchy.length > 0) score += 0.1;
    
    // Imagem
    if (product.image_front_url || product.image_url) score += 0.1;
    
    // Informações nutricionais
    if (product.nutriments && Object.keys(product.nutriments).length > 0) score += 0.1;

    return Math.min(score, 0.8); // Máximo 0.8 para dados externos
  }

  /**
   * Extrai unidade da quantidade
   */
  private static extractUnit(quantity?: string): string | undefined {
    if (!quantity) return undefined;

    const unitPatterns = [
      { pattern: /(\d+(?:\.\d+)?)\s*(kg|quilos?)/gi, unit: 'kg' },
      { pattern: /(\d+(?:\.\d+)?)\s*(g|gramas?)/gi, unit: 'g' },
      { pattern: /(\d+(?:\.\d+)?)\s*(l|litros?)/gi, unit: 'l' },
      { pattern: /(\d+(?:\.\d+)?)\s*(ml|mililitros?)/gi, unit: 'ml' },
      { pattern: /(\d+)\s*(unidades?|un|pcs?)/gi, unit: 'un' }
    ];

    for (const { pattern, unit } of unitPatterns) {
      if (pattern.test(quantity)) {
        return unit;
      }
    }

    return undefined;
  }

  /**
   * Extrai peso da quantidade ou nome do produto
   */
  private static extractWeight(text: string): string | undefined {
    const weightPatterns = [
      /(\d+(?:\.\d+)?)\s*kg/gi,
      /(\d+(?:\.\d+)?)\s*g(?:\s|$)/gi,
      /(\d+(?:\.\d+)?)\s*gramas?/gi,
      /(\d+(?:\.\d+)?)\s*quilos?/gi
    ];

    for (const pattern of weightPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0].toLowerCase().trim();
      }
    }

    return undefined;
  }

  /**
   * Extrai volume da quantidade ou nome do produto
   */
  private static extractVolume(text: string): string | undefined {
    const volumePatterns = [
      /(\d+(?:\.\d+)?)\s*l(?:\s|$)/gi,
      /(\d+(?:\.\d+)?)\s*ml/gi,
      /(\d+(?:\.\d+)?)\s*litros?/gi,
      /(\d+(?:\.\d+)?)\s*mililitros?/gi
    ];

    for (const pattern of volumePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0].toLowerCase().trim();
      }
    }

    return undefined;
  }

  /**
   * Extrai informações nutricionais completas
   */
  static extractNutritionalInfo(product: OpenFoodFactsProduct): NutritionalInfo | undefined {
    if (!product.nutriments) return undefined;

    const nutriments = product.nutriments;
    
    return {
      energy: nutriments.energy_100g,
      fat: nutriments.fat_100g,
      carbohydrates: nutriments.carbohydrates_100g,
      proteins: nutriments.proteins_100g,
      salt: nutriments.salt_100g,
      sodium: nutriments.sodium_100g ? nutriments.sodium_100g * 1000 : undefined, // Converter para mg
      sugars: nutriments.sugars_100g,
      fiber: nutriments.fiber_100g,
      nutritionGrade: product.nutrition_grade_fr?.toUpperCase(),
      novaGroup: product.nova_group,
      ecoScore: product.ecoscore_grade?.toUpperCase()
    };
  }

  /**
   * Busca múltiplos produtos por códigos de barras
   */
  static async getMultipleProducts(barcodes: string[]): Promise<{ [barcode: string]: ProductInfo | null }> {
    const results: { [barcode: string]: ProductInfo | null } = {};
    
    // Processar em lotes menores para não sobrecarregar a API
    const batchSize = 3;
    for (let i = 0; i < barcodes.length; i += batchSize) {
      const batch = barcodes.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (barcode) => {
        const result = await this.getProduct(barcode);
        return { barcode, result };
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((promiseResult, index) => {
        const barcode = batch[index];
        if (promiseResult.status === 'fulfilled') {
          results[barcode] = promiseResult.value.result;
        } else {
          console.error(`Erro ao buscar código ${barcode}:`, promiseResult.reason);
          results[barcode] = null;
        }
      });

      // Pausa entre lotes para respeitar rate limits
      if (i + batchSize < barcodes.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * Verifica se a API está disponível
   */
  static async checkApiHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // Testar com um código de barras conhecido
      const response = await fetch(`${this.BASE_URL}/product/3017620422003.json`, {
        method: 'GET',
        headers: {
          'User-Agent': 'GroceryApp/1.0',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.error('Erro ao verificar saúde da API Open Food Facts:', error);
      return false;
    }
  }

  /**
   * Busca produtos por texto (busca avançada)
   */
  static async searchByText(searchText: string, limit = 10): Promise<ProductInfo[]> {
    try {
      const encodedText = encodeURIComponent(searchText);
      const response = await this.makeRequest(`/cgi/search.pl?search_terms=${encodedText}&json=1&page_size=${limit}`);
      
      if (!response || !('products' in response)) {
        return [];
      }

      const products = (response as any).products as OpenFoodFactsProduct[];
      
      return products
        .filter(product => product.product_name || product.product_name_pt)
        .map((product, index) => this.transformOpenFoodFactsToProductInfo({
          code: `search_${index}`,
          status: 1,
          status_verbose: 'product found',
          product
        }, `search_${index}`));
    } catch (error) {
      console.error('Erro na busca por texto:', error);
      return [];
    }
  }
}

/**
 * Serviço para identificação automática de produtos genéricos
 * Implementa algoritmos de matching por nome e categoria
 */
export class GenericProductMatcher {
  
  /**
   * Mapeamento de categorias externas para categorias internas
   */
  private static readonly CATEGORY_MAPPING: { [key: string]: string } = {
    // Categorias Open Food Facts para categorias internas
    'beverages': 'bebidas',
    'dairy': 'laticínios',
    'meat': 'carnes',
    'fish': 'peixes',
    'fruits': 'frutas',
    'vegetables': 'verduras',
    'cereals': 'cereais',
    'bread': 'pães',
    'snacks': 'lanches',
    'sweets': 'doces',
    'condiments': 'condimentos',
    'oils': 'óleos',
    'frozen': 'congelados',
    'canned': 'enlatados',
    'pasta': 'massas',
    'rice': 'arroz',
    'beans': 'feijões',
    'milk': 'leite',
    'cheese': 'queijos',
    'yogurt': 'iogurtes',
    'chicken': 'frango',
    'beef': 'carne bovina',
    'pork': 'carne suína',
    'fish-products': 'peixes',
    'seafood': 'frutos do mar',
    'eggs': 'ovos',
    'butter': 'manteiga',
    'margarine': 'margarina',
    'cream': 'creme',
    'ice-cream': 'sorvetes',
    'chocolate': 'chocolates',
    'cookies': 'biscoitos',
    'crackers': 'bolachas',
    'chips': 'salgadinhos',
    'nuts': 'castanhas',
    'dried-fruits': 'frutas secas',
    'spices': 'temperos',
    'herbs': 'ervas',
    'sauces': 'molhos',
    'vinegar': 'vinagre',
    'salt': 'sal',
    'sugar': 'açúcar',
    'flour': 'farinha',
    'baking': 'ingredientes para panificação',
    'tea': 'chás',
    'coffee': 'café',
    'juices': 'sucos',
    'soft-drinks': 'refrigerantes',
    'water': 'água',
    'alcoholic-beverages': 'bebidas alcoólicas',
    'wine': 'vinhos',
    'beer': 'cervejas',
    'cleaning': 'limpeza',
    'personal-care': 'higiene pessoal',
    'baby-food': 'alimentação infantil',
    'pet-food': 'ração para animais',
    
    // Categorias Cosmos para categorias internas
    'alimentos': 'alimentos',
    'bebidas': 'bebidas',
    'higiene': 'higiene pessoal',
    'limpeza': 'limpeza',
    'perfumaria': 'perfumaria',
    'medicamentos': 'medicamentos',
    'cosméticos': 'cosméticos',
    'eletrodomésticos': 'eletrodomésticos',
    'eletrônicos': 'eletrônicos',
    'roupas': 'roupas',
    'calçados': 'calçados',
    'livros': 'livros',
    'brinquedos': 'brinquedos',
    'esportes': 'esportes',
    'casa': 'casa e jardim',
    'jardim': 'casa e jardim',
    'automotivo': 'automotivo',
    'ferramentas': 'ferramentas',
    'papelaria': 'papelaria',
    'pet': 'pet shop'
  };

  /**
   * Palavras-chave para identificação de categorias
   */
  private static readonly CATEGORY_KEYWORDS: { [key: string]: string[] } = {
    'arroz': ['arroz', 'rice'],
    'feijão': ['feijão', 'feijao', 'beans', 'bean'],
    'macarrão': ['macarrão', 'macarrao', 'massa', 'pasta', 'espaguete', 'penne', 'fusilli'],
    'açúcar': ['açúcar', 'acucar', 'sugar', 'cristal', 'refinado'],
    'sal': ['sal', 'salt', 'grosso', 'refinado'],
    'óleo': ['óleo', 'oleo', 'oil', 'soja', 'girassol', 'canola'],
    'farinha': ['farinha', 'flour', 'trigo', 'wheat'],
    'leite': ['leite', 'milk', 'integral', 'desnatado', 'semi'],
    'pão': ['pão', 'pao', 'bread', 'forma', 'francês', 'frances'],
    'queijo': ['queijo', 'cheese', 'mussarela', 'prato', 'minas'],
    'iogurte': ['iogurte', 'yogurt', 'natural', 'morango', 'frutas'],
    'manteiga': ['manteiga', 'butter', 'com sal', 'sem sal'],
    'margarina': ['margarina', 'margarine', 'cremosa'],
    'ovos': ['ovos', 'eggs', 'dúzia', 'duzia', 'caipira'],
    'frango': ['frango', 'chicken', 'peito', 'coxa', 'sobrecoxa'],
    'carne': ['carne', 'beef', 'bovina', 'patinho', 'alcatra', 'picanha'],
    'peixe': ['peixe', 'fish', 'salmão', 'salmao', 'tilápia', 'tilapia'],
    'refrigerante': ['refrigerante', 'soda', 'coca', 'pepsi', 'guaraná', 'guarana'],
    'suco': ['suco', 'juice', 'laranja', 'uva', 'maçã', 'maca'],
    'água': ['água', 'agua', 'water', 'mineral', 'sem gás', 'com gás'],
    'café': ['café', 'cafe', 'coffee', 'torrado', 'moído', 'moido'],
    'chá': ['chá', 'cha', 'tea', 'camomila', 'erva doce'],
    'biscoito': ['biscoito', 'cookie', 'bolacha', 'cream cracker', 'água e sal'],
    'chocolate': ['chocolate', 'cacau', 'ao leite', 'amargo', 'branco'],
    'sabonete': ['sabonete', 'soap', 'glicerina', 'neutro'],
    'shampoo': ['shampoo', 'cabelo', 'hair'],
    'pasta de dente': ['pasta', 'dente', 'toothpaste', 'dental'],
    'detergente': ['detergente', 'detergent', 'louça', 'loucas'],
    'sabão em pó': ['sabão', 'sabao', 'powder', 'roupa', 'roupas'],
    'papel higiênico': ['papel', 'higiênico', 'higienico', 'toilet paper'],
    'absorvente': ['absorvente', 'pad', 'feminino', 'noturno']
  };

  /**
   * Produtos essencialmente genéricos (frutas, verduras, etc.)
   */
  private static readonly ESSENTIALLY_GENERIC_KEYWORDS = [
    'banana', 'maçã', 'maca', 'laranja', 'limão', 'limao', 'uva', 'manga', 'abacaxi',
    'melancia', 'melão', 'melao', 'mamão', 'mamao', 'abacate', 'kiwi', 'pêra', 'pera',
    'morango', 'cereja', 'pêssego', 'pessego', 'ameixa', 'caqui', 'goiaba', 'maracujá', 'maracuja',
    'alface', 'tomate', 'cebola', 'alho', 'batata', 'cenoura', 'beterraba', 'abobrinha',
    'pepino', 'pimentão', 'pimentao', 'brócolis', 'brocolis', 'couve-flor', 'couve', 'espinafre',
    'rúcula', 'rucula', 'agrião', 'agriao', 'salsinha', 'cebolinha', 'coentro', 'manjericão', 'manjericao'
  ];

  /**
   * Identifica automaticamente um produto genérico baseado no nome e categoria
   */
  static async findGenericProduct(productName: string, category?: string): Promise<GenericProduct | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Normalizar o nome do produto
      const normalizedName = this.normalizeProductName(productName);
      
      // Buscar todos os produtos genéricos do usuário
      const { data: genericProducts } = await ProductService.getGenericProducts();
      if (!genericProducts) return null;

      // 1. Busca exata por nome
      const exactMatch = genericProducts.find(product => 
        this.normalizeProductName(product.name) === normalizedName
      );
      if (exactMatch) return exactMatch;

      // 2. Busca por palavras-chave
      const keywordMatch = this.findByKeywords(normalizedName, genericProducts);
      if (keywordMatch) return keywordMatch;

      // 3. Busca por categoria se fornecida
      if (category) {
        const mappedCategory = this.mapExternalCategory(category);
        const categoryMatch = genericProducts.find(product => 
          product.category?.toLowerCase() === mappedCategory.toLowerCase()
        );
        if (categoryMatch) return categoryMatch;
      }

      // 4. Busca fuzzy por similaridade
      const fuzzyMatch = this.findBySimilarity(normalizedName, genericProducts);
      if (fuzzyMatch && fuzzyMatch.similarity > 0.7) {
        return fuzzyMatch.product;
      }

      return null;
    } catch (error) {
      console.error('Erro ao identificar produto genérico:', error);
      return null;
    }
  }

  /**
   * Sugere múltiplos produtos genéricos baseado em nome e categoria
   */
  static async suggestGenericProducts(productName: string, category?: string): Promise<{
    product: GenericProduct;
    similarity: number;
    reason: string;
  }[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const normalizedName = this.normalizeProductName(productName);
      
      // Buscar todos os produtos genéricos
      const { data: genericProducts } = await ProductService.getGenericProducts();
      if (!genericProducts) return [];

      const suggestions: { product: GenericProduct; similarity: number; reason: string }[] = [];

      // 1. Busca exata
      const exactMatch = genericProducts.find(product => 
        this.normalizeProductName(product.name) === normalizedName
      );
      if (exactMatch) {
        suggestions.push({
          product: exactMatch,
          similarity: 1.0,
          reason: 'Nome exato'
        });
      }

      // 2. Busca por palavras-chave
      for (const [category, keywords] of Object.entries(this.CATEGORY_KEYWORDS)) {
        if (keywords.some(keyword => normalizedName.includes(keyword.toLowerCase()))) {
          const categoryProducts = genericProducts.filter(product => 
            this.normalizeProductName(product.name).includes(category) ||
            product.category?.toLowerCase().includes(category)
          );
          
          categoryProducts.forEach(product => {
            if (!suggestions.find(s => s.product.id === product.id)) {
              suggestions.push({
                product,
                similarity: 0.9,
                reason: `Palavra-chave: ${category}`
              });
            }
          });
        }
      }

      // 3. Busca por categoria
      if (category) {
        const mappedCategory = this.mapExternalCategory(category);
        const categoryProducts = genericProducts.filter(product => 
          product.category?.toLowerCase().includes(mappedCategory.toLowerCase())
        );
        
        categoryProducts.forEach(product => {
          if (!suggestions.find(s => s.product.id === product.id)) {
            suggestions.push({
              product,
              similarity: 0.8,
              reason: `Categoria: ${mappedCategory}`
            });
          }
        });
      }

      // 4. Busca fuzzy para produtos similares
      genericProducts.forEach(product => {
        if (!suggestions.find(s => s.product.id === product.id)) {
          const similarity = this.calculateSimilarity(normalizedName, this.normalizeProductName(product.name));
          if (similarity > 0.5) {
            suggestions.push({
              product,
              similarity,
              reason: `Similaridade: ${Math.round(similarity * 100)}%`
            });
          }
        }
      });

      // 5. Verificar se é produto essencialmente genérico
      if (this.isEssentiallyGeneric(productName)) {
        const essentiallyGenericProducts = genericProducts.filter(product => 
          this.ESSENTIALLY_GENERIC_KEYWORDS.some(keyword => 
            this.normalizeProductName(product.name).includes(keyword)
          )
        );
        
        essentiallyGenericProducts.forEach(product => {
          if (!suggestions.find(s => s.product.id === product.id)) {
            suggestions.push({
              product,
              similarity: 0.95,
              reason: 'Produto essencialmente genérico'
            });
          }
        });
      }

      // Ordenar por similaridade e limitar resultados
      return suggestions
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);
    } catch (error) {
      console.error('Erro ao sugerir produtos genéricos:', error);
      return [];
    }
  }

  /**
   * Cria um produto específico vinculado ao genérico
   */
  static async createSpecificProduct(
    productInfo: ProductInfo, 
    genericProductId: string
  ): Promise<SpecificProduct | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Validar dados obrigatórios
      if (!productInfo.name || !genericProductId) {
        throw new Error('Nome do produto e ID do produto genérico são obrigatórios');
      }

      // Extrair peso/volume do nome se possível
      const extractedData = this.extractWeightAndVolume(productInfo.name);

      const specificProductData: Omit<SpecificProduct, 'id' | 'created_at'> = {
        generic_product_id: genericProductId,
        name: productInfo.name,
        brand: productInfo.brand || '',
        description: productInfo.description,
        image_url: productInfo.image,
        default_unit: productInfo.metadata?.unit || extractedData.unit || 'unidade',
        barcode: productInfo.barcode,
        barcode_type: this.getBarcodeType(productInfo.barcode),
        external_id: productInfo.metadata?.gtin,
        data_source: productInfo.source,
        confidence_score: productInfo.confidence,
        last_external_sync: new Date().toISOString(),
        user_id: user.id
      };

      // Criar o produto específico
      const { data, error } = await ProductService.createSpecificProduct(specificProductData);
      
      if (error) {
        console.error('Erro ao criar produto específico:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao criar produto específico:', error);
      return null;
    }
  }

  /**
   * Normaliza o nome do produto para comparação
   */
  private static normalizeProductName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[áàâãä]/g, 'a')
      .replace(/[éèêë]/g, 'e')
      .replace(/[íìîï]/g, 'i')
      .replace(/[óòôõö]/g, 'o')
      .replace(/[úùûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[ñ]/g, 'n')
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '');
  }

  /**
   * Mapeia categoria externa para categoria interna
   */
  private static mapExternalCategory(externalCategory: string | undefined): string {
    if (!externalCategory || typeof externalCategory !== 'string') {
      return 'outros';
    }
    const normalized = externalCategory.toLowerCase().trim();
    return this.CATEGORY_MAPPING[normalized] || normalized;
  }

  /**
   * Busca produto por palavras-chave
   */
  private static findByKeywords(normalizedName: string, products: GenericProduct[]): GenericProduct | null {
    for (const [category, keywords] of Object.entries(this.CATEGORY_KEYWORDS)) {
      if (keywords.some(keyword => normalizedName.includes(keyword.toLowerCase()))) {
        const match = products.find(product => 
          this.normalizeProductName(product.name).includes(category) ||
          product.category?.toLowerCase().includes(category)
        );
        if (match) return match;
      }
    }
    return null;
  }

  /**
   * Busca produto por similaridade usando algoritmo de Levenshtein
   */
  private static findBySimilarity(
    targetName: string, 
    products: GenericProduct[]
  ): { product: GenericProduct; similarity: number } | null {
    let bestMatch: { product: GenericProduct; similarity: number } | null = null;

    for (const product of products) {
      const similarity = this.calculateSimilarity(targetName, this.normalizeProductName(product.name));
      
      if (!bestMatch || similarity > bestMatch.similarity) {
        bestMatch = { product, similarity };
      }
    }

    return bestMatch;
  }

  /**
   * Calcula similaridade entre duas strings usando distância de Levenshtein
   */
  private static calculateSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;

    const matrix: number[][] = [];

    // Inicializar matriz
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // Calcular distância
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // Deleção
          matrix[i][j - 1] + 1,      // Inserção
          matrix[i - 1][j - 1] + cost // Substituição
        );
      }
    }

    const distance = matrix[len1][len2];
    const maxLength = Math.max(len1, len2);
    
    return 1 - (distance / maxLength);
  }

  /**
   * Verifica se o produto é essencialmente genérico (frutas, verduras)
   */
  private static isEssentiallyGeneric(productName: string): boolean {
    const normalized = this.normalizeProductName(productName);
    return this.ESSENTIALLY_GENERIC_KEYWORDS.some(keyword => 
      normalized.includes(keyword)
    );
  }

  /**
   * Extrai peso e volume do nome do produto
   */
  private static extractWeightAndVolume(productName: string): {
    weight?: string;
    volume?: string;
    unit?: string;
  } {
    const result: { weight?: string; volume?: string; unit?: string } = {};

    // Padrões para peso (kg, g)
    const weightPatterns = [
      /(\d+(?:\.\d+)?)\s*kg/i,
      /(\d+(?:\.\d+)?)\s*g(?!\s*l)/i,
      /(\d+(?:\.\d+)?)\s*gramas?/i,
      /(\d+(?:\.\d+)?)\s*quilos?/i
    ];

    // Padrões para volume (l, ml)
    const volumePatterns = [
      /(\d+(?:\.\d+)?)\s*l(?:itros?)?/i,
      /(\d+(?:\.\d+)?)\s*ml/i,
      /(\d+(?:\.\d+)?)\s*mililitros?/i
    ];

    // Buscar peso
    for (const pattern of weightPatterns) {
      const match = productName.match(pattern);
      if (match) {
        result.weight = match[1];
        result.unit = match[0].toLowerCase().includes('kg') ? 'kg' : 'g';
        break;
      }
    }

    // Buscar volume
    for (const pattern of volumePatterns) {
      const match = productName.match(pattern);
      if (match) {
        result.volume = match[1];
        result.unit = match[0].toLowerCase().includes('ml') ? 'ml' : 'l';
        break;
      }
    }

    return result;
  }

  /**
   * Determina o tipo do código de barras
   */
  private static getBarcodeType(barcode: string): string {
    if (!barcode) return 'UNKNOWN';
    
    switch (barcode.length) {
      case 8:
        return 'EAN8';
      case 12:
        return 'UPC_A';
      case 13:
        return 'EAN13';
      default:
        return 'UNKNOWN';
    }
  }

  /**
   * Ranking de produtos por popularidade (baseado no uso em listas)
   */
  static async rankProductsByPopularity(products: GenericProduct[]): Promise<{
    product: GenericProduct;
    popularity: number;
  }[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return products.map(p => ({ product: p, popularity: 0 }));

      // Buscar estatísticas de uso dos produtos
      const { data: usageStats, error } = await supabase
        .from('list_items')
        .select(`
          list_item_products (
            specific_products (
              generic_product_id
            )
          )
        `)
        .eq('user_id', user.id);

      if (error || !usageStats) {
        return products.map(p => ({ product: p, popularity: 0 }));
      }

      // Contar uso por produto genérico
      const usageCount: { [key: string]: number } = {};
      
      usageStats.forEach(item => {
        if (item.list_item_products && item.list_item_products.length > 0) {
          const specificProduct = item.list_item_products[0].specific_products;
          if (specificProduct?.generic_product_id) {
            const genericId = specificProduct.generic_product_id;
            usageCount[genericId] = (usageCount[genericId] || 0) + 1;
          }
        }
      });

      // Calcular popularidade normalizada
      const maxUsage = Math.max(...Object.values(usageCount), 1);
      
      return products.map(product => ({
        product,
        popularity: (usageCount[product.id] || 0) / maxUsage
      })).sort((a, b) => b.popularity - a.popularity);
    } catch (error) {
      console.error('Erro ao calcular popularidade dos produtos:', error);
      return products.map(p => ({ product: p, popularity: 0 }));
    }
  }
}/**
 *
 Serviço para sugestões avançadas de produtos genéricos
 */
export class GenericProductSuggestionService {
  
  /**
   * Sugere produtos genéricos com ranking por similaridade e popularidade
   */
  static async getSuggestionsWithRanking(
    productName: string, 
    category?: string,
    limit: number = 5
  ): Promise<{
    product: GenericProduct;
    similarity: number;
    popularity: number;
    finalScore: number;
    reason: string;
  }[]> {
    try {
      // Obter sugestões básicas
      const basicSuggestions = await GenericProductMatcher.suggestGenericProducts(productName, category);
      
      if (basicSuggestions.length === 0) {
        return [];
      }

      // Obter ranking de popularidade
      const products = basicSuggestions.map(s => s.product);
      const popularityRanking = await GenericProductMatcher.rankProductsByPopularity(products);
      
      // Combinar similaridade e popularidade
      const rankedSuggestions = basicSuggestions.map(suggestion => {
        const popularityData = popularityRanking.find(p => p.product.id === suggestion.product.id);
        const popularity = popularityData?.popularity || 0;
        
        // Fórmula: 70% similaridade + 30% popularidade
        const finalScore = (suggestion.similarity * 0.7) + (popularity * 0.3);
        
        return {
          product: suggestion.product,
          similarity: suggestion.similarity,
          popularity,
          finalScore,
          reason: suggestion.reason
        };
      });

      // Ordenar por score final e limitar resultados
      return rankedSuggestions
        .sort((a, b) => b.finalScore - a.finalScore)
        .slice(0, limit);
    } catch (error) {
      console.error('Erro ao obter sugestões com ranking:', error);
      return [];
    }
  }

  /**
   * Sugere produtos genéricos para produtos essencialmente genéricos (frutas/verduras)
   */
  static async suggestForEssentiallyGeneric(productName: string): Promise<{
    product: GenericProduct;
    confidence: number;
    isExactMatch: boolean;
  }[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const normalizedName = GenericProductMatcher['normalizeProductName'](productName);
      
      // Verificar se é produto essencialmente genérico
      const isEssentiallyGeneric = GenericProductMatcher['ESSENTIALLY_GENERIC_KEYWORDS'].some(keyword => 
        normalizedName.includes(keyword)
      );

      if (!isEssentiallyGeneric) {
        return [];
      }

      // Buscar produtos genéricos relacionados
      const { data: genericProducts } = await ProductService.getGenericProducts();
      if (!genericProducts) return [];

      const suggestions: {
        product: GenericProduct;
        confidence: number;
        isExactMatch: boolean;
      }[] = [];

      // Buscar correspondências exatas e similares
      for (const keyword of GenericProductMatcher['ESSENTIALLY_GENERIC_KEYWORDS']) {
        if (normalizedName.includes(keyword)) {
          const matchingProducts = genericProducts.filter(product => {
            const productNormalized = GenericProductMatcher['normalizeProductName'](product.name);
            return productNormalized.includes(keyword) || 
                   product.category?.toLowerCase().includes('fruta') ||
                   product.category?.toLowerCase().includes('verdura') ||
                   product.category?.toLowerCase().includes('legume');
          });

          matchingProducts.forEach(product => {
            const productNormalized = GenericProductMatcher['normalizeProductName'](product.name);
            const isExactMatch = productNormalized === normalizedName || productNormalized.includes(keyword);
            
            if (!suggestions.find(s => s.product.id === product.id)) {
              suggestions.push({
                product,
                confidence: isExactMatch ? 0.95 : 0.8,
                isExactMatch
              });
            }
          });
        }
      }

      return suggestions.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error('Erro ao sugerir produtos essencialmente genéricos:', error);
      return [];
    }
  }

  /**
   * Cria sugestões inteligentes baseadas no contexto do usuário
   */
  static async getContextualSuggestions(
    productName: string,
    category?: string,
    userContext?: {
      recentProducts?: string[];
      frequentCategories?: string[];
      shoppingPatterns?: string[];
    }
  ): Promise<{
    product: GenericProduct;
    score: number;
    contextReason: string;
  }[]> {
    try {
      // Obter sugestões básicas
      const basicSuggestions = await GenericProductMatcher.suggestGenericProducts(productName, category);
      
      if (!userContext) {
        return basicSuggestions.map(s => ({
          product: s.product,
          score: s.similarity,
          contextReason: s.reason
        }));
      }

      const contextualSuggestions = basicSuggestions.map(suggestion => {
        let contextBonus = 0;
        let contextReason = suggestion.reason;

        // Bonus por produtos recentes
        if (userContext.recentProducts?.includes(suggestion.product.id)) {
          contextBonus += 0.2;
          contextReason += ' + Usado recentemente';
        }

        // Bonus por categorias frequentes
        if (userContext.frequentCategories?.includes(suggestion.product.category || '')) {
          contextBonus += 0.15;
          contextReason += ' + Categoria frequente';
        }

        // Bonus por padrões de compra
        if (userContext.shoppingPatterns?.some(pattern => 
          suggestion.product.name.toLowerCase().includes(pattern.toLowerCase())
        )) {
          contextBonus += 0.1;
          contextReason += ' + Padrão de compra';
        }

        return {
          product: suggestion.product,
          score: Math.min(1.0, suggestion.similarity + contextBonus),
          contextReason
        };
      });

      return contextualSuggestions.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Erro ao obter sugestões contextuais:', error);
      return [];
    }
  }

  /**
   * Obtém contexto do usuário para sugestões inteligentes
   */
  static async getUserContext(): Promise<{
    recentProducts: string[];
    frequentCategories: string[];
    shoppingPatterns: string[];
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { recentProducts: [], frequentCategories: [], shoppingPatterns: [] };
      }

      // Buscar produtos recentes (últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentItems, error: recentError } = await supabase
        .from('list_items')
        .select(`
          list_item_products (
            specific_products (
              id,
              generic_product_id,
              generic_products (
                id,
                name,
                category
              )
            )
          )
        `)
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      if (recentError) {
        console.error('Erro ao buscar produtos recentes:', recentError);
        return { recentProducts: [], frequentCategories: [], shoppingPatterns: [] };
      }

      // Processar dados
      const recentProducts: string[] = [];
      const categoryCount: { [key: string]: number } = {};
      const productNames: string[] = [];

      recentItems?.forEach(item => {
        if (item.list_item_products && item.list_item_products.length > 0) {
          const specificProduct = item.list_item_products[0].specific_products;
          if (specificProduct?.generic_products) {
            const genericProduct = specificProduct.generic_products;
            
            // Produtos recentes
            if (!recentProducts.includes(genericProduct.id)) {
              recentProducts.push(genericProduct.id);
            }

            // Contagem de categorias
            if (genericProduct.category) {
              categoryCount[genericProduct.category] = (categoryCount[genericProduct.category] || 0) + 1;
            }

            // Nomes para padrões
            productNames.push(genericProduct.name);
          }
        }
      });

      // Categorias mais frequentes
      const frequentCategories = Object.entries(categoryCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([category]) => category);

      // Padrões de compra (palavras mais comuns nos nomes)
      const shoppingPatterns = this.extractShoppingPatterns(productNames);

      return {
        recentProducts: recentProducts.slice(0, 10),
        frequentCategories,
        shoppingPatterns
      };
    } catch (error) {
      console.error('Erro ao obter contexto do usuário:', error);
      return { recentProducts: [], frequentCategories: [], shoppingPatterns: [] };
    }
  }

  /**
   * Extrai padrões de compra dos nomes dos produtos
   */
  private static extractShoppingPatterns(productNames: string[]): string[] {
    const wordCount: { [key: string]: number } = {};
    
    // Palavras irrelevantes para filtrar
    const stopWords = ['de', 'da', 'do', 'com', 'sem', 'para', 'em', 'na', 'no', 'e', 'ou', 'a', 'o'];

    productNames.forEach(name => {
      const words = name.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 2 && !stopWords.includes(word)) {
          wordCount[word] = (wordCount[word] || 0) + 1;
        }
      });
    });

    // Retornar palavras mais frequentes
    return Object.entries(wordCount)
      .filter(([, count]) => count >= 2) // Aparecer pelo menos 2 vezes
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Sugere produtos genéricos baseado em marca
   */
  static async suggestByBrand(brand: string, productName: string): Promise<{
    product: GenericProduct;
    confidence: number;
    brandMatch: boolean;
  }[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Buscar produtos específicos da mesma marca
      const { data: specificProducts, error } = await supabase
        .from('specific_products')
        .select(`
          *,
          generic_products (
            id,
            name,
            category
          )
        `)
        .eq('user_id', user.id)
        .ilike('brand', `%${brand}%`);

      if (error || !specificProducts) {
        return [];
      }

      const suggestions: {
        product: GenericProduct;
        confidence: number;
        brandMatch: boolean;
      }[] = [];

      // Agrupar por produto genérico
      const genericProductMap = new Map<string, GenericProduct>();
      
      specificProducts.forEach(specific => {
        if (specific.generic_products) {
          genericProductMap.set(specific.generic_products.id, specific.generic_products);
        }
      });

      // Calcular confiança baseada na similaridade do nome
      genericProductMap.forEach(genericProduct => {
        const similarity = GenericProductMatcher['calculateSimilarity'](
          GenericProductMatcher['normalizeProductName'](productName),
          GenericProductMatcher['normalizeProductName'](genericProduct.name)
        );

        if (similarity > 0.3) { // Threshold mínimo
          suggestions.push({
            product: genericProduct,
            confidence: similarity,
            brandMatch: true
          });
        }
      });

      return suggestions.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error('Erro ao sugerir por marca:', error);
      return [];
    }
  }

  /**
   * Combina todas as estratégias de sugestão em uma única função
   */
  static async getComprehensiveSuggestions(
    productName: string,
    category?: string,
    brand?: string,
    limit: number = 5
  ): Promise<{
    product: GenericProduct;
    finalScore: number;
    reasons: string[];
    confidence: 'high' | 'medium' | 'low';
  }[]> {
    try {
      const allSuggestions = new Map<string, {
        product: GenericProduct;
        scores: number[];
        reasons: string[];
      }>();

      // 1. Sugestões básicas com ranking
      const rankedSuggestions = await this.getSuggestionsWithRanking(productName, category, 10);
      rankedSuggestions.forEach(suggestion => {
        allSuggestions.set(suggestion.product.id, {
          product: suggestion.product,
          scores: [suggestion.finalScore],
          reasons: [suggestion.reason]
        });
      });

      // 2. Sugestões para produtos essencialmente genéricos
      const essentialSuggestions = await this.suggestForEssentiallyGeneric(productName);
      essentialSuggestions.forEach(suggestion => {
        const existing = allSuggestions.get(suggestion.product.id);
        if (existing) {
          existing.scores.push(suggestion.confidence);
          existing.reasons.push('Produto essencialmente genérico');
        } else {
          allSuggestions.set(suggestion.product.id, {
            product: suggestion.product,
            scores: [suggestion.confidence],
            reasons: ['Produto essencialmente genérico']
          });
        }
      });

      // 3. Sugestões contextuais
      const userContext = await this.getUserContext();
      const contextualSuggestions = await this.getContextualSuggestions(productName, category, userContext);
      contextualSuggestions.forEach(suggestion => {
        const existing = allSuggestions.get(suggestion.product.id);
        if (existing) {
          existing.scores.push(suggestion.score);
          existing.reasons.push(suggestion.contextReason);
        } else {
          allSuggestions.set(suggestion.product.id, {
            product: suggestion.product,
            scores: [suggestion.score],
            reasons: [suggestion.contextReason]
          });
        }
      });

      // 4. Sugestões por marca (se fornecida)
      if (brand) {
        const brandSuggestions = await this.suggestByBrand(brand, productName);
        brandSuggestions.forEach(suggestion => {
          const existing = allSuggestions.get(suggestion.product.id);
          if (existing) {
            existing.scores.push(suggestion.confidence);
            existing.reasons.push(`Marca: ${brand}`);
          } else {
            allSuggestions.set(suggestion.product.id, {
              product: suggestion.product,
              scores: [suggestion.confidence],
              reasons: [`Marca: ${brand}`]
            });
          }
        });
      }

      // Calcular score final e nível de confiança
      const finalSuggestions = Array.from(allSuggestions.values()).map(suggestion => {
        // Score final é a média ponderada dos scores
        const finalScore = suggestion.scores.reduce((sum, score) => sum + score, 0) / suggestion.scores.length;
        
        // Determinar nível de confiança
        let confidence: 'high' | 'medium' | 'low';
        if (finalScore >= 0.8) {
          confidence = 'high';
        } else if (finalScore >= 0.5) {
          confidence = 'medium';
        } else {
          confidence = 'low';
        }

        return {
          product: suggestion.product,
          finalScore,
          reasons: [...new Set(suggestion.reasons)], // Remover duplicatas
          confidence
        };
      });

      // Ordenar por score e limitar resultados
      return finalSuggestions
        .sort((a, b) => b.finalScore - a.finalScore)
        .slice(0, limit);
    } catch (error) {
      console.error('Erro ao obter sugestões abrangentes:', error);
      return [];
    }
  }
}

/**
 * Serviço para criação e validação de produtos específicos
 */
export class SpecificProductCreationService {
  
  /**
   * Vincula automaticamente produto escaneado a produto genérico
   * Busca o melhor produto genérico baseado no nome e categoria
   */
  static async autoLinkToGenericProduct(productInfo: ProductInfo): Promise<{
    success: boolean;
    genericProduct?: GenericProduct;
    confidence: number;
    reason: string;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, confidence: 0, reason: 'Usuário não autenticado' };
      }

      // Buscar produtos genéricos do usuário + padrão
      const { data: genericProducts, error } = await supabase
        .from('generic_products')
        .select('*')
        .or(`user_id.eq.${user.id},is_default.eq.true`)
        .order('is_default.desc,name.asc');

      if (error || !genericProducts || genericProducts.length === 0) {
        return { success: false, confidence: 0, reason: 'Nenhum produto genérico disponível' };
      }

      // Algoritmo de matching por similaridade
      let bestMatch: GenericProduct | null = null;
      let bestScore = 0;
      let matchReason = '';

      for (const generic of genericProducts) {
        let score = 0;
        let reasons: string[] = [];

        // 1. Matching exato por nome (peso 100)
        if (productInfo.name.toLowerCase().includes(generic.name.toLowerCase()) ||
            generic.name.toLowerCase().includes(productInfo.name.toLowerCase())) {
          score += 100;
          reasons.push('nome similar');
        }

        // 2. Matching por categoria (peso 50)
        if (productInfo.category && generic.category &&
            productInfo.category.toLowerCase() === generic.category.toLowerCase()) {
          score += 50;
          reasons.push('categoria igual');
        }

        // 3. Matching por palavras-chave (peso 30)
        const productWords = productInfo.name.toLowerCase().split(/\s+/);
        const genericWords = generic.name.toLowerCase().split(/\s+/);
        const commonWords = productWords.filter(word => 
          word.length > 2 && genericWords.some(gw => gw.includes(word) || word.includes(gw))
        );
        if (commonWords.length > 0) {
          score += commonWords.length * 30;
          reasons.push(`palavras comuns: ${commonWords.join(', ')}`);
        }

        // 4. Bonus para produtos padrão (peso 10)
        if (generic.is_default) {
          score += 10;
          reasons.push('produto padrão');
        }

        if (score > bestScore) {
          bestScore = score;
          bestMatch = generic;
          matchReason = reasons.join(', ');
        }
      }

      // Definir threshold mínimo para considerar um match válido
      const minThreshold = 50;
      if (bestScore >= minThreshold && bestMatch) {
        return {
          success: true,
          genericProduct: bestMatch,
          confidence: Math.min(bestScore / 100, 1.0),
          reason: `Vinculado a "${bestMatch.name}" (${matchReason})`
        };
      }

      // Se não encontrou match, sugerir criação de novo genérico
      return {
        success: false,
        confidence: 0,
        reason: `Nenhum produto genérico compatível encontrado (melhor score: ${bestScore})`
      };
    } catch (error) {
      console.error('Erro na vinculação automática:', error);
      return { success: false, confidence: 0, reason: 'Erro interno na vinculação' };
    }
  }

  /**
   * Valida dados obrigatórios para criação de produto específico
   */
  static validateProductData(productInfo: ProductInfo, genericProductId: string): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validações obrigatórias
    if (!productInfo.name || productInfo.name.trim().length === 0) {
      errors.push('Nome do produto é obrigatório');
    }

    if (!genericProductId || genericProductId.trim().length === 0) {
      errors.push('ID do produto genérico é obrigatório');
    }

    if (!productInfo.barcode || productInfo.barcode.trim().length === 0) {
      errors.push('Código de barras é obrigatório');
    }

    // Validações de formato
    if (productInfo.name && productInfo.name.length > 255) {
      errors.push('Nome do produto não pode ter mais de 255 caracteres');
    }

    if (productInfo.brand && productInfo.brand.length > 100) {
      errors.push('Nome da marca não pode ter mais de 100 caracteres');
    }

    if (productInfo.description && productInfo.description.length > 1000) {
      errors.push('Descrição não pode ter mais de 1000 caracteres');
    }

    // Validação do código de barras
    if (productInfo.barcode) {
      const barcodeResult = BarcodeValidator.validateBarcode(productInfo.barcode, 'ean13');
      if (!barcodeResult.isValid) {
        // Tentar outros formatos
        const formats = ['ean8', 'upc_a', 'upc_e'];
        const validFormat = formats.find(format => 
          BarcodeValidator.validateBarcode(productInfo.barcode, format).isValid
        );
        
        if (!validFormat) {
          warnings.push('Código de barras pode não ser válido');
        }
      }
    }

    // Validações de confiança
    if (productInfo.confidence < 0.3) {
      warnings.push('Dados do produto têm baixa confiança - verifique as informações');
    }

    // Validação de URL de imagem
    if (productInfo.image && !this.isValidImageUrl(productInfo.image)) {
      warnings.push('URL da imagem pode não ser válida');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Cria produto específico com validação completa e tratamento de erros
   */
  static async createSpecificProductWithValidation(
    productInfo: ProductInfo,
    genericProductId: string,
    options?: {
      skipDuplicateCheck?: boolean;
      autoCorrectData?: boolean;
      createGenericIfNotExists?: boolean;
    }
  ): Promise<{
    success: boolean;
    product?: SpecificProduct;
    errors: string[];
    warnings: string[];
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          success: false,
          errors: ['Usuário não autenticado'],
          warnings: []
        };
      }

      // 1. Validar dados
      const validation = this.validateProductData(productInfo, genericProductId);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors,
          warnings: validation.warnings
        };
      }

      // 2. Verificar se produto genérico existe
      const { data: genericProduct, error: genericError } = await ProductService.getGenericProductById(genericProductId);
      if (genericError || !genericProduct) {
        if (options?.createGenericIfNotExists) {
          // Tentar criar produto genérico automaticamente
          const newGenericResult = await this.createGenericProductFromProductInfo(productInfo);
          if (!newGenericResult.success) {
            return {
              success: false,
              errors: [`Produto genérico não encontrado: ${genericProductId}`, ...newGenericResult.errors],
              warnings: validation.warnings
            };
          }
          genericProductId = newGenericResult.product!.id;
        } else {
          return {
            success: false,
            errors: [`Produto genérico não encontrado: ${genericProductId}`],
            warnings: validation.warnings
          };
        }
      }

      // 3. Verificar duplicatas (se não for para pular)
      if (!options?.skipDuplicateCheck) {
        const duplicateCheck = await this.checkForDuplicates(productInfo.barcode, productInfo.name, user.id);
        if (duplicateCheck.hasDuplicate) {
          return {
            success: false,
            errors: [`Produto já existe: ${duplicateCheck.existingProduct?.name}`],
            warnings: validation.warnings
          };
        }
      }

      // 4. Auto-corrigir dados se solicitado
      let correctedProductInfo = productInfo;
      if (options?.autoCorrectData) {
        correctedProductInfo = this.autoCorrectProductData(productInfo);
      }

      // 5. Criar produto específico
      const createdProduct = await GenericProductMatcher.createSpecificProduct(correctedProductInfo, genericProductId);
      
      if (!createdProduct) {
        return {
          success: false,
          errors: ['Falha ao criar produto específico'],
          warnings: validation.warnings
        };
      }

      // 6. Fazer cache do produto para futuras buscas
      await BarcodeService.cacheProduct(productInfo.barcode, productInfo, user.id);

      return {
        success: true,
        product: createdProduct,
        errors: [],
        warnings: validation.warnings
      };
    } catch (error) {
      console.error('Erro ao criar produto específico:', error);
      return {
        success: false,
        errors: [`Erro interno: ${(error as Error).message}`],
        warnings: []
      };
    }
  }

  /**
   * Verifica se já existe produto com o mesmo código de barras ou nome similar
   */
  static async checkForDuplicates(
    barcode: string,
    productName: string,
    userId: string
  ): Promise<{
    hasDuplicate: boolean;
    existingProduct?: SpecificProduct;
    duplicateType: 'barcode' | 'name' | 'none';
  }> {
    try {
      // Verificar por código de barras
      const { data: barcodeMatch, error: barcodeError } = await supabase
        .from('specific_products')
        .select('*')
        .eq('barcode', barcode)
        .eq('user_id', userId)
        .single();

      if (!barcodeError && barcodeMatch) {
        return {
          hasDuplicate: true,
          existingProduct: barcodeMatch,
          duplicateType: 'barcode'
        };
      }

      // Verificar por nome similar
      const { data: nameMatches, error: nameError } = await supabase
        .from('specific_products')
        .select('*')
        .eq('user_id', userId);

      if (!nameError && nameMatches) {
        const normalizedTargetName = GenericProductMatcher['normalizeProductName'](productName);
        
        for (const product of nameMatches) {
          const normalizedProductName = GenericProductMatcher['normalizeProductName'](product.name);
          const similarity = GenericProductMatcher['calculateSimilarity'](normalizedTargetName, normalizedProductName);
          
          if (similarity > 0.9) { // 90% de similaridade
            return {
              hasDuplicate: true,
              existingProduct: product,
              duplicateType: 'name'
            };
          }
        }
      }

      return {
        hasDuplicate: false,
        duplicateType: 'none'
      };
    } catch (error) {
      console.error('Erro ao verificar duplicatas:', error);
      return {
        hasDuplicate: false,
        duplicateType: 'none'
      };
    }
  }

  /**
   * Auto-corrige dados do produto
   */
  private static autoCorrectProductData(productInfo: ProductInfo): ProductInfo {
    const corrected = { ...productInfo };

    // Corrigir nome (capitalizar primeira letra de cada palavra)
    if (corrected.name) {
      corrected.name = corrected.name
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
        .trim();
    }

    // Corrigir marca (capitalizar)
    if (corrected.brand) {
      corrected.brand = corrected.brand
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
        .trim();
    }

    // Limpar descrição
    if (corrected.description) {
      corrected.description = corrected.description.trim();
    }

    // Normalizar código de barras (remover espaços e caracteres especiais)
    if (corrected.barcode) {
      corrected.barcode = corrected.barcode.replace(/\D/g, '');
    }

    // Extrair informações adicionais do nome
    const extractedData = GenericProductMatcher['extractWeightAndVolume'](corrected.name);
    if (!corrected.metadata) {
      corrected.metadata = {};
    }
    
    if (extractedData.weight && !corrected.metadata.weight) {
      corrected.metadata.weight = extractedData.weight;
    }
    
    if (extractedData.volume && !corrected.metadata.volume) {
      corrected.metadata.volume = extractedData.volume;
    }
    
    if (extractedData.unit && !corrected.metadata.unit) {
      corrected.metadata.unit = extractedData.unit;
    }

    return corrected;
  }

  /**
   * Cria produto genérico automaticamente baseado nas informações do produto
   */
  static async createGenericProductFromProductInfo(productInfo: ProductInfo): Promise<{
    success: boolean;
    product?: GenericProduct;
    errors: string[];
  }> {
    try {
      let { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('Auth check result:', { user: user?.id, authError });
      
      if (authError || !user || !user.id) {
        console.error('Erro de autenticação:', authError);
        
        // Try to get session directly
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Session check:', { session: session?.user?.id });
        
        if (session?.user?.id) {
          // Use session user
          user = session.user;
          console.log('Using session user:', user.id);
        } else {
          // Try to refresh session
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          console.log('Refresh attempt:', { user: refreshData?.user?.id, error: refreshError });
          
          if (refreshData?.user?.id) {
            user = refreshData.user;
            console.log('Using refreshed user:', user.id);
          } else {
            return {
              success: false,
              errors: ['Usuário não autenticado. Faça login novamente.']
            };
          }
        }
      }

      // Extrair nome genérico do nome específico
      const genericName = this.extractGenericName(productInfo.name);
      
      // Determinar categoria
      const category = productInfo.category || this.inferCategoryFromName(productInfo.name);

      // Verificar se já existe produto genérico similar
      const { data: existingGenerics } = await ProductService.getGenericProducts();
      const existingSimilar = existingGenerics?.find(product => 
        GenericProductMatcher['normalizeProductName'](product.name) === 
        GenericProductMatcher['normalizeProductName'](genericName)
      );

      if (existingSimilar) {
        return {
          success: true,
          product: existingSimilar,
          errors: []
        };
      }

      // Criar novo produto genérico
      console.log('Criando produto genérico:', { 
        name: genericName, 
        category, 
        user_id: user.id,
        user_id_type: typeof user.id,
        user_id_length: user.id?.length 
      });
      
      const { data: newGeneric, error } = await ProductService.createGenericProduct({
        name: genericName,
        category,
        user_id: user.id
      });

      if (error || !newGeneric) {
        return {
          success: false,
          errors: [`Erro ao criar produto genérico: ${error?.message || 'Erro desconhecido'}`]
        };
      }

      return {
        success: true,
        product: newGeneric,
        errors: []
      };
    } catch (error) {
      console.error('Erro ao criar produto genérico automaticamente:', error);
      return {
        success: false,
        errors: [`Erro interno: ${(error as Error).message}`]
      };
    }
  }

  /**
   * Extrai nome genérico do nome específico do produto
   */
  private static extractGenericName(specificName: string): string {
    // Remover marca, peso, volume e outras especificações
    let genericName = specificName
      .toLowerCase()
      .replace(/\b\d+\s*(kg|g|l|ml|gramas?|quilos?|litros?|mililitros?)\b/gi, '') // Remover peso/volume
      .replace(/\b\d+\s*x\s*\d+\s*(kg|g|l|ml)\b/gi, '') // Remover quantidades
      .replace(/\b(tipo|sabor|cor)\s+\w+/gi, '') // Remover especificações
      .replace(/\b(com|sem)\s+\w+/gi, '') // Remover características
      .replace(/\s+/g, ' ')
      .trim();

    // Capitalizar primeira letra de cada palavra
    return genericName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Infere categoria baseada no nome do produto
   */
  private static inferCategoryFromName(productName: string): string {
    const normalizedName = GenericProductMatcher['normalizeProductName'](productName);
    
    // Verificar palavras-chave para categorias
    for (const [category, keywords] of Object.entries(GenericProductMatcher['CATEGORY_KEYWORDS'])) {
      if (keywords.some(keyword => normalizedName.includes(keyword.toLowerCase()))) {
        return category;
      }
    }

    // Verificar se é produto essencialmente genérico
    if (GenericProductMatcher['ESSENTIALLY_GENERIC_KEYWORDS'].some(keyword => 
      normalizedName.includes(keyword)
    )) {
      if (normalizedName.includes('fruta') || 
          ['banana', 'maçã', 'maca', 'laranja', 'uva', 'manga'].some(fruit => normalizedName.includes(fruit))) {
        return 'frutas';
      } else {
        return 'verduras';
      }
    }

    return 'outros';
  }

  /**
   * Valida se URL de imagem é válida
   */
  private static isValidImageUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol) &&
             /\.(jpg|jpeg|png|gif|webp)$/i.test(urlObj.pathname);
    } catch {
      return false;
    }
  }

  /**
   * Atualiza produto específico existente com novas informações
   */
  static async updateSpecificProduct(
    productId: string,
    updates: Partial<ProductInfo>,
    options?: {
      preserveUserData?: boolean;
      updateCache?: boolean;
    }
  ): Promise<{
    success: boolean;
    product?: SpecificProduct;
    errors: string[];
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          success: false,
          errors: ['Usuário não autenticado']
        };
      }

      // Buscar produto existente
      const { data: existingProduct, error: fetchError } = await ProductService.getSpecificProductById(productId);
      if (fetchError || !existingProduct) {
        return {
          success: false,
          errors: ['Produto não encontrado']
        };
      }

      // Preparar dados para atualização
      const updateData: Partial<SpecificProduct> = {};

      if (updates.name) updateData.name = updates.name;
      if (updates.brand) updateData.brand = updates.brand;
      if (updates.description) updateData.description = updates.description;
      if (updates.image) updateData.image_url = updates.image;
      if (updates.metadata?.unit) updateData.default_unit = updates.metadata.unit;
      
      // Atualizar dados de sincronização se não for para preservar dados do usuário
      if (!options?.preserveUserData) {
        if (updates.source) updateData.data_source = updates.source;
        if (updates.confidence !== undefined) updateData.confidence_score = updates.confidence;
        updateData.last_external_sync = new Date().toISOString();
      }

      // Atualizar no banco de dados
      const { data: updatedProduct, error: updateError } = await ProductService.updateSpecificProduct(productId, updateData);
      
      if (updateError || !updatedProduct) {
        return {
          success: false,
          errors: [`Erro ao atualizar produto: ${updateError?.message || 'Erro desconhecido'}`]
        };
      }

      // Atualizar cache se solicitado
      if (options?.updateCache && existingProduct.barcode) {
        const updatedProductInfo: ProductInfo = {
          barcode: existingProduct.barcode,
          name: updatedProduct.name,
          brand: updatedProduct.brand || undefined,
          description: updatedProduct.description || undefined,
          image: updatedProduct.image_url || undefined,
          source: (updatedProduct.data_source as any) || 'local',
          confidence: updatedProduct.confidence_score || 1.0,
          metadata: {
            unit: updatedProduct.default_unit || undefined
          }
        };
        
        await BarcodeService.cacheProduct(existingProduct.barcode, updatedProductInfo, user.id);
      }

      return {
        success: true,
        product: updatedProduct,
        errors: []
      };
    } catch (error) {
      console.error('Erro ao atualizar produto específico:', error);
      return {
        success: false,
        errors: [`Erro interno: ${(error as Error).message}`]
      };
    }
  }

  /**
   * Remove produto específico com validações de segurança
   */
  static async deleteSpecificProduct(productId: string): Promise<{
    success: boolean;
    errors: string[];
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          success: false,
          errors: ['Usuário não autenticado']
        };
      }

      // Verificar se produto existe e pertence ao usuário
      const { data: existingProduct, error: fetchError } = await ProductService.getSpecificProductById(productId);
      if (fetchError || !existingProduct) {
        return {
          success: false,
          errors: ['Produto não encontrado']
        };
      }

      // Verificar se produto está sendo usado em listas
      const { data: listItems, error: listError } = await supabase
        .from('list_item_products')
        .select('id')
        .eq('specific_product_id', productId)
        .limit(1);

      if (listError) {
        return {
          success: false,
          errors: ['Erro ao verificar uso do produto']
        };
      }

      if (listItems && listItems.length > 0) {
        return {
          success: false,
          errors: ['Produto não pode ser removido pois está sendo usado em listas']
        };
      }

      // Remover produto
      const { error: deleteError } = await ProductService.deleteSpecificProduct(productId);
      
      if (deleteError) {
        return {
          success: false,
          errors: [`Erro ao remover produto: ${deleteError.message}`]
        };
      }

      // Remover do cache se tiver código de barras
      if (existingProduct.barcode) {
        await supabase
          .from('barcode_cache')
          .delete()
          .eq('barcode', existingProduct.barcode)
          .eq('user_id', user.id);
      }

      return {
        success: true,
        errors: []
      };
    } catch (error) {
      console.error('Erro ao remover produto específico:', error);
      return {
        success: false,
        errors: [`Erro interno: ${(error as Error).message}`]
      };
    }
  }
}