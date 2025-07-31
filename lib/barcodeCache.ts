import { supabase } from './supabase';
import { BarcodeCache } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache configuration constants
const CACHE_CONFIG = {
  // TTL based on popularity (in hours)
  TTL_HIGH_POPULARITY: 24 * 7, // 1 week for popular items
  TTL_MEDIUM_POPULARITY: 24 * 3, // 3 days for medium popularity
  TTL_LOW_POPULARITY: 24, // 1 day for low popularity
  TTL_DEFAULT: 12, // 12 hours default
  
  // Popularity thresholds (access count)
  HIGH_POPULARITY_THRESHOLD: 10,
  MEDIUM_POPULARITY_THRESHOLD: 3,
  
  // Cache size limits
  MAX_LOCAL_CACHE_SIZE: 100, // Maximum items in local cache
  MAX_DB_CACHE_SIZE: 1000, // Maximum items in database cache
  
  // Compression settings
  COMPRESSION_THRESHOLD: 1024, // Compress data larger than 1KB
  
  // Cleanup intervals
  CLEANUP_INTERVAL_HOURS: 6, // Clean expired cache every 6 hours
  
  // Local cache keys
  LOCAL_CACHE_KEY: 'barcode_cache_local',
  CACHE_STATS_KEY: 'barcode_cache_stats',
  LAST_CLEANUP_KEY: 'barcode_cache_last_cleanup'
};

// Types for enhanced cache
interface CacheStats {
  accessCount: number;
  lastAccessed: string;
  popularity: 'high' | 'medium' | 'low';
}

interface LocalCacheItem {
  barcode: string;
  data: any;
  source: string;
  confidence: number;
  expiresAt: string;
  stats: CacheStats;
  compressed: boolean;
}

interface CacheMetrics {
  totalItems: number;
  compressedItems: number;
  hitRate: number;
  averageAccessCount: number;
  lastCleanup: string;
}

/**
 * Utilities for data compression
 */
const CompressionUtils = {
  /**
   * Simple JSON compression using string replacement
   */
  compress: (data: any): string => {
    const jsonString = JSON.stringify(data);
    
    if (jsonString.length < CACHE_CONFIG.COMPRESSION_THRESHOLD) {
      return jsonString;
    }
    
    // Simple compression: replace common patterns
    return jsonString
      .replace(/{"([^"]+)":/g, '{$1:') // Remove quotes from keys
      .replace(/,"([^"]+)":/g, ',$1:') // Remove quotes from subsequent keys
      .replace(/:\s*"/g, ':"') // Remove spaces after colons
      .replace(/,\s*"/g, ',"') // Remove spaces after commas
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  },

  /**
   * Decompress data
   */
  decompress: (compressedData: string): any => {
    try {
      // Try to parse as-is first (might not be compressed)
      return JSON.parse(compressedData);
    } catch {
      try {
        // Try to restore quotes to keys
        const restored = compressedData
          .replace(/{([^:]+):/g, '{"$1":') // Add quotes to first key
          .replace(/,([^:]+):/g, ',"$1":'); // Add quotes to subsequent keys
        
        return JSON.parse(restored);
      } catch (error) {
        console.error('Failed to decompress data:', error);
        return null;
      }
    }
  },

  /**
   * Calculate compression ratio
   */
  getCompressionRatio: (original: string, compressed: string): number => {
    return compressed.length / original.length;
  }
};

/**
 * Local cache management utilities
 */
const LocalCacheUtils = {
  /**
   * Get local cache
   */
  getLocalCache: async (): Promise<LocalCacheItem[]> => {
    try {
      const cacheData = await AsyncStorage.getItem(CACHE_CONFIG.LOCAL_CACHE_KEY);
      return cacheData ? JSON.parse(cacheData) : [];
    } catch (error) {
      console.error('Error reading local cache:', error);
      return [];
    }
  },

  /**
   * Save local cache
   */
  saveLocalCache: async (cache: LocalCacheItem[]): Promise<void> => {
    try {
      // Limit cache size
      const limitedCache = cache
        .sort((a, b) => new Date(b.stats.lastAccessed).getTime() - new Date(a.stats.lastAccessed).getTime())
        .slice(0, CACHE_CONFIG.MAX_LOCAL_CACHE_SIZE);
      
      await AsyncStorage.setItem(CACHE_CONFIG.LOCAL_CACHE_KEY, JSON.stringify(limitedCache));
    } catch (error) {
      console.error('Error saving local cache:', error);
    }
  },

  /**
   * Get cache metrics
   */
  getCacheMetrics: async (): Promise<CacheMetrics | null> => {
    try {
      const metricsData = await AsyncStorage.getItem(CACHE_CONFIG.CACHE_STATS_KEY);
      return metricsData ? JSON.parse(metricsData) : null;
    } catch (error) {
      console.error('Error reading cache metrics:', error);
      return null;
    }
  },

  /**
   * Update cache metrics
   */
  updateCacheMetrics: async (metrics: Partial<CacheMetrics>): Promise<void> => {
    try {
      const currentMetrics = await LocalCacheUtils.getCacheMetrics() || {
        totalItems: 0,
        compressedItems: 0,
        hitRate: 0,
        averageAccessCount: 0,
        lastCleanup: new Date().toISOString()
      };

      const updatedMetrics = { ...currentMetrics, ...metrics };
      await AsyncStorage.setItem(CACHE_CONFIG.CACHE_STATS_KEY, JSON.stringify(updatedMetrics));
    } catch (error) {
      console.error('Error updating cache metrics:', error);
    }
  }
};

/**
 * Enhanced barcode cache service with intelligent features
 */
export const BarcodeCacheService = {
  /**
   * Normalize brand and category data to ensure they're strings, not objects
   */
  normalizeBrandData: (data: any): any => {
    if (data && typeof data === 'object') {
      // If brand is an object with name property, extract the name
      if (data.brand && typeof data.brand === 'object' && data.brand.name) {
        data.brand = data.brand.name;
      }
      
      // If category is an object with description property, extract the description
      if (data.category && typeof data.category === 'object' && data.category.description) {
        data.category = data.category.description;
      }
      
      // Also check product_data if it exists
      if (data.product_data && typeof data.product_data === 'object') {
        if (data.product_data.brand && typeof data.product_data.brand === 'object' && data.product_data.brand.name) {
          data.product_data.brand = data.product_data.brand.name;
        }
        if (data.product_data.category && typeof data.product_data.category === 'object' && data.product_data.category.description) {
          data.product_data.category = data.product_data.category.description;
        }
      }
    }
    return data;
  },

  /**
   * Busca dados de código de barras no cache (local primeiro, depois remoto)
   */
  getCachedBarcode: async (barcode: string) => {
    try {
      // 1. Check local cache first (fastest)
      const localResult = await this.getFromLocalCache(barcode);
      if (localResult) {
        console.log('Cache hit: local cache');
        // Normalize brand data before returning
        const normalizedResult = this.normalizeBrandData(localResult);
        await this.updateAccessStats(barcode, 'local');
        return { data: normalizedResult, error: null };
      }

      // 2. Check remote database cache
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('barcode_cache')
        .select('*')
        .eq('barcode', barcode)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      // Verificar se o cache não expirou
      if (data && data.expires_at) {
        const expirationDate = new Date(data.expires_at);
        if (expirationDate < new Date()) {
          // Cache expirado, remover
          await this.removeCachedBarcode(data.id);
          return { data: null, error: null };
        }
      }

      if (data) {
        console.log('Cache hit: database cache');
        // Normalize brand data before returning
        const normalizedData = this.normalizeBrandData(data);
        // Add to local cache for faster future access
        await this.addToLocalCache(normalizedData);
        await this.updateAccessStats(barcode, 'database');
        return { data: normalizedData, error: null };
      }

      return { data: data || null, error: null };
    } catch (error) {
      console.error('Erro ao buscar código de barras no cache:', error);
      return { data: null, error };
    }
  },

  /**
   * Get item from local cache
   */
  getFromLocalCache: async (barcode: string): Promise<any | null> => {
    try {
      const localCache = await LocalCacheUtils.getLocalCache();
      const item = localCache.find(item => item.barcode === barcode);
      
      if (!item) return null;
      
      // Check if expired
      if (new Date(item.expiresAt) < new Date()) {
        // Remove expired item
        const updatedCache = localCache.filter(i => i.barcode !== barcode);
        await LocalCacheUtils.saveLocalCache(updatedCache);
        return null;
      }
      
      // Decompress data if needed
      const data = item.compressed 
        ? CompressionUtils.decompress(item.data)
        : item.data;
      
      return {
        id: `local_${barcode}`,
        barcode: item.barcode,
        product_data: data,
        source: item.source,
        confidence_score: item.confidence,
        expires_at: item.expiresAt,
        created_at: item.stats.lastAccessed
      };
    } catch (error) {
      console.error('Error getting from local cache:', error);
      return null;
    }
  },

  /**
   * Add item to local cache
   */
  addToLocalCache: async (cacheItem: BarcodeCache): Promise<void> => {
    try {
      const localCache = await LocalCacheUtils.getLocalCache();
      
      // Remove existing item if present
      const filteredCache = localCache.filter(item => item.barcode !== cacheItem.barcode);
      
      // Prepare data for compression
      const dataString = JSON.stringify(cacheItem.product_data);
      const shouldCompress = dataString.length > CACHE_CONFIG.COMPRESSION_THRESHOLD;
      
      const newItem: LocalCacheItem = {
        barcode: cacheItem.barcode,
        data: shouldCompress ? CompressionUtils.compress(cacheItem.product_data) : cacheItem.product_data,
        source: cacheItem.source,
        confidence: cacheItem.confidence_score || 0,
        expiresAt: cacheItem.expires_at || new Date(Date.now() + CACHE_CONFIG.TTL_DEFAULT * 60 * 60 * 1000).toISOString(),
        compressed: shouldCompress,
        stats: {
          accessCount: 1,
          lastAccessed: new Date().toISOString(),
          popularity: 'low'
        }
      };
      
      filteredCache.push(newItem);
      await LocalCacheUtils.saveLocalCache(filteredCache);
      
      // Update metrics
      await LocalCacheUtils.updateCacheMetrics({
        totalItems: filteredCache.length,
        compressedItems: filteredCache.filter(item => item.compressed).length
      });
    } catch (error) {
      console.error('Error adding to local cache:', error);
    }
  },

  /**
   * Update access statistics for popularity-based TTL
   */
  updateAccessStats: async (barcode: string, source: 'local' | 'database'): Promise<void> => {
    try {
      if (source === 'local') {
        const localCache = await LocalCacheUtils.getLocalCache();
        const itemIndex = localCache.findIndex(item => item.barcode === barcode);
        
        if (itemIndex !== -1) {
          localCache[itemIndex].stats.accessCount += 1;
          localCache[itemIndex].stats.lastAccessed = new Date().toISOString();
          
          // Update popularity based on access count
          const accessCount = localCache[itemIndex].stats.accessCount;
          if (accessCount >= CACHE_CONFIG.HIGH_POPULARITY_THRESHOLD) {
            localCache[itemIndex].stats.popularity = 'high';
          } else if (accessCount >= CACHE_CONFIG.MEDIUM_POPULARITY_THRESHOLD) {
            localCache[itemIndex].stats.popularity = 'medium';
          }
          
          await LocalCacheUtils.saveLocalCache(localCache);
        }
      }
      
      // Update hit rate metrics
      const metrics = await LocalCacheUtils.getCacheMetrics();
      if (metrics) {
        // Simple hit rate calculation (this could be more sophisticated)
        const newHitRate = Math.min(metrics.hitRate + 0.1, 1.0);
        await LocalCacheUtils.updateCacheMetrics({ hitRate: newHitRate });
      }
    } catch (error) {
      console.error('Error updating access stats:', error);
    }
  },

  /**
   * Salva dados de código de barras no cache com TTL inteligente
   */
  cacheBarcode: async (barcodeData: Omit<BarcodeCache, 'id' | 'created_at' | 'user_id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Calculate intelligent TTL based on data quality and source
      const intelligentTTL = this.calculateIntelligentTTL(barcodeData);
      const expiresAt = new Date(Date.now() + intelligentTTL * 60 * 60 * 1000).toISOString();

      // Prepare data with compression if needed
      const dataString = JSON.stringify(barcodeData.product_data);
      const shouldCompress = dataString.length > CACHE_CONFIG.COMPRESSION_THRESHOLD;
      const processedData = shouldCompress 
        ? CompressionUtils.compress(barcodeData.product_data)
        : barcodeData.product_data;

      const cacheEntry = {
        ...barcodeData,
        product_data: processedData,
        expires_at: expiresAt,
        user_id: user.id
      };

      // Verificar se já existe cache para este código de barras
      const existing = await this.getCachedBarcode(barcodeData.barcode);
      
      if (existing.data && !existing.data.id.startsWith('local_')) {
        // Atualizar cache existente no banco
        const { data, error } = await supabase
          .from('barcode_cache')
          .update({
            product_data: processedData,
            source: barcodeData.source,
            confidence_score: barcodeData.confidence_score,
            expires_at: expiresAt,
            created_at: new Date().toISOString()
          })
          .eq('id', existing.data.id)
          .select()
          .single();

        if (error) throw error;
        
        // Also update local cache
        await this.addToLocalCache(data);
        
        return { data, error: null };
      } else {
        // Criar novo cache no banco
        const { data, error } = await supabase
          .from('barcode_cache')
          .insert(cacheEntry)
          .select()
          .single();

        if (error) throw error;
        
        // Add to local cache for faster access
        await this.addToLocalCache(data);
        
        // Check if we need to clean up old cache entries
        await this.performMaintenanceIfNeeded();
        
        return { data, error: null };
      }
    } catch (error) {
      console.error('Erro ao salvar código de barras no cache:', error);
      return { data: null, error };
    }
  },

  /**
   * Calculate intelligent TTL based on data quality, source, and popularity
   */
  calculateIntelligentTTL: (barcodeData: Omit<BarcodeCache, 'id' | 'created_at' | 'user_id'>): number => {
    let baseTTL = CACHE_CONFIG.TTL_DEFAULT;
    
    // Adjust based on confidence score
    const confidence = barcodeData.confidence_score || 0;
    if (confidence >= 0.9) {
      baseTTL = CACHE_CONFIG.TTL_HIGH_POPULARITY; // High confidence = longer cache
    } else if (confidence >= 0.7) {
      baseTTL = CACHE_CONFIG.TTL_MEDIUM_POPULARITY;
    } else if (confidence >= 0.5) {
      baseTTL = CACHE_CONFIG.TTL_LOW_POPULARITY;
    }
    
    // Adjust based on data source reliability
    switch (barcodeData.source) {
      case 'cosmos':
        baseTTL *= 1.5; // Cosmos is reliable, cache longer
        break;
      case 'openfoodfacts':
        baseTTL *= 1.2; // OpenFoodFacts is good, cache a bit longer
        break;
      case 'manual':
        baseTTL *= 0.8; // Manual entry might need updates sooner
        break;
      default:
        break;
    }
    
    // Adjust based on data completeness
    const productData = barcodeData.product_data;
    if (productData && typeof productData === 'object') {
      const completenessScore = this.calculateDataCompleteness(productData);
      baseTTL *= (0.5 + completenessScore * 0.5); // 50% to 100% of base TTL
    }
    
    return Math.max(baseTTL, 1); // Minimum 1 hour
  },

  /**
   * Calculate data completeness score (0-1)
   */
  calculateDataCompleteness: (productData: any): number => {
    if (!productData || typeof productData !== 'object') return 0;
    
    const importantFields = ['name', 'brand', 'category', 'image'];
    const optionalFields = ['description', 'nutritionalInfo', 'weight', 'volume'];
    
    let score = 0;
    let totalWeight = 0;
    
    // Important fields have higher weight
    importantFields.forEach(field => {
      totalWeight += 2;
      if (productData[field] && productData[field].toString().trim()) {
        score += 2;
      }
    });
    
    // Optional fields have lower weight
    optionalFields.forEach(field => {
      totalWeight += 1;
      if (productData[field] && productData[field].toString().trim()) {
        score += 1;
      }
    });
    
    return totalWeight > 0 ? score / totalWeight : 0;
  },

  /**
   * Remove entrada do cache
   */
  removeCachedBarcode: async (cacheId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await supabase
        .from('barcode_cache')
        .delete()
        .eq('id', cacheId)
        .eq('user_id', user.id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Erro ao remover código de barras do cache:', error);
      return { error };
    }
  },

  /**
   * Perform maintenance if needed (cleanup, optimization)
   */
  performMaintenanceIfNeeded: async (): Promise<void> => {
    try {
      const lastCleanup = await AsyncStorage.getItem(CACHE_CONFIG.LAST_CLEANUP_KEY);
      const lastCleanupTime = lastCleanup ? new Date(lastCleanup) : new Date(0);
      const now = new Date();
      
      const hoursSinceLastCleanup = (now.getTime() - lastCleanupTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastCleanup >= CACHE_CONFIG.CLEANUP_INTERVAL_HOURS) {
        console.log('Performing cache maintenance...');
        
        // Clean expired cache
        await this.cleanExpiredCache();
        
        // Clean local cache
        await this.cleanLocalCache();
        
        // Clean invalid brand data (one-time cleanup)
        await this.cleanInvalidBrandData();
        
        // Optimize database cache size
        await this.optimizeDatabaseCache();
        
        // Update last cleanup time
        await AsyncStorage.setItem(CACHE_CONFIG.LAST_CLEANUP_KEY, now.toISOString());
        
        console.log('Cache maintenance completed');
      }
    } catch (error) {
      console.error('Error during cache maintenance:', error);
    }
  },

  /**
   * Limpa cache expirado do usuário (both local and database)
   */
  cleanExpiredCache: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Clean database cache
      const { error: dbError } = await supabase
        .from('barcode_cache')
        .delete()
        .eq('user_id', user.id)
        .not('expires_at', 'is', null)
        .lt('expires_at', new Date().toISOString());

      if (dbError) throw dbError;

      // Clean local cache
      await this.cleanLocalCache();

      return { error: null };
    } catch (error) {
      console.error('Erro ao limpar cache expirado:', error);
      return { error };
    }
  },

  /**
   * Clean expired items from local cache
   */
  cleanLocalCache: async (): Promise<void> => {
    try {
      const localCache = await LocalCacheUtils.getLocalCache();
      const now = new Date();
      
      const validItems = localCache.filter(item => new Date(item.expiresAt) > now);
      
      if (validItems.length !== localCache.length) {
        await LocalCacheUtils.saveLocalCache(validItems);
        console.log(`Cleaned ${localCache.length - validItems.length} expired items from local cache`);
      }
    } catch (error) {
      console.error('Error cleaning local cache:', error);
    }
  },

  /**
   * Optimize database cache by removing least popular items if over limit
   */
  optimizeDatabaseCache: async (): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Count total cache items
      const { count, error: countError } = await supabase
        .from('barcode_cache')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (countError) throw countError;

      if (count && count > CACHE_CONFIG.MAX_DB_CACHE_SIZE) {
        // Get oldest items to remove
        const itemsToRemove = count - CACHE_CONFIG.MAX_DB_CACHE_SIZE;
        
        const { data: oldestItems, error: selectError } = await supabase
          .from('barcode_cache')
          .select('id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(itemsToRemove);

        if (selectError) throw selectError;

        if (oldestItems && oldestItems.length > 0) {
          const idsToRemove = oldestItems.map(item => item.id);
          
          const { error: deleteError } = await supabase
            .from('barcode_cache')
            .delete()
            .in('id', idsToRemove);

          if (deleteError) throw deleteError;
          
          console.log(`Removed ${idsToRemove.length} old cache items to optimize database`);
        }
      }
    } catch (error) {
      console.error('Error optimizing database cache:', error);
    }
  },

  /**
   * Busca estatísticas detalhadas do cache do usuário
   */
  getCacheStats: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Database cache stats
      const { count: totalCount, error: totalError } = await supabase
        .from('barcode_cache')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (totalError) throw totalError;

      const { count: expiredCount, error: expiredError } = await supabase
        .from('barcode_cache')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .not('expires_at', 'is', null)
        .lt('expires_at', new Date().toISOString());

      if (expiredError) throw expiredError;

      // Source distribution
      const { data: sourceStats, error: sourceError } = await supabase
        .from('barcode_cache')
        .select('source, confidence_score, created_at')
        .eq('user_id', user.id);

      if (sourceError) throw sourceError;

      const sourceCounts = sourceStats?.reduce((acc, item) => {
        acc[item.source] = (acc[item.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Calculate average confidence by source
      const confidenceBySource = sourceStats?.reduce((acc, item) => {
        if (!acc[item.source]) {
          acc[item.source] = { total: 0, count: 0 };
        }
        acc[item.source].total += item.confidence_score || 0;
        acc[item.source].count += 1;
        return acc;
      }, {} as Record<string, { total: number; count: number }>) || {};

      const avgConfidenceBySource = Object.keys(confidenceBySource).reduce((acc, source) => {
        const data = confidenceBySource[source];
        acc[source] = data.count > 0 ? data.total / data.count : 0;
        return acc;
      }, {} as Record<string, number>);

      // Local cache stats
      const localCache = await LocalCacheUtils.getLocalCache();
      const localMetrics = await LocalCacheUtils.getCacheMetrics();
      
      const popularityDistribution = localCache.reduce((acc, item) => {
        acc[item.stats.popularity] = (acc[item.stats.popularity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Compression stats
      const compressionStats = localCache.reduce((acc, item) => {
        if (item.compressed) {
          acc.compressedItems += 1;
          // Estimate compression ratio (simplified)
          const originalSize = JSON.stringify(item.data).length;
          const compressedSize = typeof item.data === 'string' ? item.data.length : originalSize;
          acc.totalCompressionRatio += compressedSize / originalSize;
        }
        return acc;
      }, { compressedItems: 0, totalCompressionRatio: 0 });

      const avgCompressionRatio = compressionStats.compressedItems > 0 
        ? compressionStats.totalCompressionRatio / compressionStats.compressedItems 
        : 1;

      return {
        data: {
          database: {
            total: totalCount || 0,
            expired: expiredCount || 0,
            active: (totalCount || 0) - (expiredCount || 0),
            bySource: sourceCounts,
            avgConfidenceBySource
          },
          local: {
            total: localCache.length,
            popularityDistribution,
            hitRate: localMetrics?.hitRate || 0,
            averageAccessCount: localMetrics?.averageAccessCount || 0
          },
          compression: {
            compressedItems: compressionStats.compressedItems,
            totalItems: localCache.length,
            compressionRatio: avgCompressionRatio,
            spaceSaved: Math.round((1 - avgCompressionRatio) * 100)
          },
          maintenance: {
            lastCleanup: localMetrics?.lastCleanup || 'Never',
            cacheHealth: this.calculateCacheHealth(totalCount || 0, expiredCount || 0, localCache.length)
          }
        },
        error: null
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas do cache:', error);
      return { data: null, error };
    }
  },

  /**
   * Calculate overall cache health score (0-100)
   */
  calculateCacheHealth: (totalDb: number, expiredDb: number, localCount: number): number => {
    let score = 100;
    
    // Penalize high expired ratio
    if (totalDb > 0) {
      const expiredRatio = expiredDb / totalDb;
      score -= expiredRatio * 30; // Up to 30 points penalty
    }
    
    // Penalize if local cache is too small (inefficient)
    if (localCount < 10 && totalDb > 20) {
      score -= 20;
    }
    
    // Penalize if local cache is too large (memory usage)
    if (localCount > CACHE_CONFIG.MAX_LOCAL_CACHE_SIZE * 0.9) {
      score -= 15;
    }
    
    return Math.max(0, Math.round(score));
  },

  /**
   * Clean cache entries with invalid brand data structure
   */
  cleanInvalidBrandData: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Get all cache entries
      const { data: cacheEntries, error } = await supabase
        .from('barcode_cache')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      if (cacheEntries) {
        const entriesToUpdate = cacheEntries.filter(entry => {
          try {
            const productData = typeof entry.product_data === 'string' 
              ? JSON.parse(entry.product_data) 
              : entry.product_data;
            
            // Check if brand or category are objects instead of strings
            const hasBrandObject = productData && 
                                 productData.brand && 
                                 typeof productData.brand === 'object' && 
                                 productData.brand.name;
            
            const hasCategoryObject = productData && 
                                    productData.category && 
                                    typeof productData.category === 'object' && 
                                    productData.category.description;
            
            return hasBrandObject || hasCategoryObject;
          } catch {
            return false;
          }
        });

        console.log(`Found ${entriesToUpdate.length} cache entries with invalid brand data`);

        // Update entries with normalized brand data
        for (const entry of entriesToUpdate) {
          try {
            const productData = typeof entry.product_data === 'string' 
              ? JSON.parse(entry.product_data) 
              : entry.product_data;
            
            let updated = false;
            
            if (productData.brand && typeof productData.brand === 'object' && productData.brand.name) {
              productData.brand = productData.brand.name;
              updated = true;
            }
            
            if (productData.category && typeof productData.category === 'object' && productData.category.description) {
              productData.category = productData.category.description;
              updated = true;
            }
            
            if (updated) {
              await supabase
                .from('barcode_cache')
                .update({ product_data: productData })
                .eq('id', entry.id);
              
              console.log(`Updated cache entry ${entry.id} with normalized data`);
            }
          } catch (error) {
            console.error(`Error updating cache entry ${entry.id}:`, error);
          }
        }
      }

      // Also clean local cache
      const localCache = await LocalCacheUtils.getLocalCache();
      const updatedLocalCache = localCache.map(item => {
        if (item.data && typeof item.data === 'object') {
          if (item.data.brand && typeof item.data.brand === 'object' && item.data.brand.name) {
            item.data.brand = item.data.brand.name;
          }
          if (item.data.category && typeof item.data.category === 'object' && item.data.category.description) {
            item.data.category = item.data.category.description;
          }
        }
        return item;
      });
      
      await LocalCacheUtils.saveLocalCache(updatedLocalCache);
      
    } catch (error) {
      console.error('Error cleaning invalid brand data:', error);
    }
  },

  /**
   * Get cache performance metrics for debugging
   */
  getPerformanceMetrics: async () => {
    try {
      const localCache = await LocalCacheUtils.getLocalCache();
      const metrics = await LocalCacheUtils.getCacheMetrics();
      
      // Calculate cache efficiency
      const totalAccesses = localCache.reduce((sum, item) => sum + item.stats.accessCount, 0);
      const avgAccessesPerItem = localCache.length > 0 ? totalAccesses / localCache.length : 0;
      
      // Memory usage estimation
      const estimatedMemoryUsage = localCache.reduce((sum, item) => {
        const itemSize = JSON.stringify(item).length;
        return sum + itemSize;
      }, 0);
      
      return {
        cacheSize: localCache.length,
        totalAccesses,
        avgAccessesPerItem: Math.round(avgAccessesPerItem * 100) / 100,
        estimatedMemoryUsage: Math.round(estimatedMemoryUsage / 1024), // KB
        hitRate: metrics?.hitRate || 0,
        compressionRatio: metrics?.compressedItems || 0
      };
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      return null;
    }
  }
};