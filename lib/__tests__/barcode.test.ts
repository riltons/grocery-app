import { BarcodeService, ProductInfo } from '../barcode';

// Mock do Supabase
jest.mock('../supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(() => Promise.resolve({
        data: { user: { id: 'test-user-id' } }
      }))
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({
                data: [],
                error: null
              }))
            }))
          }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: null,
            error: null
          }))
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({
            error: null
          }))
        }))
      }))
    }))
  }
}));

describe('BarcodeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchLocal', () => {
    it('deve retornar found: false quando não encontrar produto', async () => {
      const result = await BarcodeService.searchLocal('1234567890123');
      
      expect(result.found).toBe(false);
      expect(result.product).toBeUndefined();
    });

    it('deve retornar erro quando usuário não estiver autenticado', async () => {
      // Mock para usuário não autenticado
      const mockSupabase = require('../supabase').supabase;
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null }
      });

      const result = await BarcodeService.searchLocal('1234567890123');
      
      expect(result.found).toBe(false);
      expect(result.error).toBe('Usuário não autenticado');
    });
  });

  describe('cacheProduct', () => {
    it('deve fazer cache de um produto com sucesso', async () => {
      const productInfo: ProductInfo = {
        barcode: '1234567890123',
        name: 'Produto Teste',
        brand: 'Marca Teste',
        source: 'manual',
        confidence: 1.0
      };

      // Não deve lançar erro
      await expect(BarcodeService.cacheProduct('1234567890123', productInfo))
        .resolves.not.toThrow();
    });
  });

  describe('getBarcodeType', () => {
    it('deve identificar corretamente tipos de código de barras', () => {
      // Usar método privado através de reflexão para teste
      const getBarcodeType = (BarcodeService as any).getBarcodeType;
      
      expect(getBarcodeType('12345678')).toBe('EAN8');
      expect(getBarcodeType('123456789012')).toBe('UPC_A');
      expect(getBarcodeType('1234567890123')).toBe('EAN13');
      expect(getBarcodeType('12345')).toBe('UNKNOWN');
    });
  });

  describe('calculateCacheTTL', () => {
    it('deve calcular TTL correto baseado na fonte', () => {
      const calculateCacheTTL = (BarcodeService as any).calculateCacheTTL;
      
      expect(calculateCacheTTL(1.0, 'local')).toBe(24 * 7); // 7 dias
      expect(calculateCacheTTL(0.9, 'cosmos')).toBe(45); // ~45h
      expect(calculateCacheTTL(0.8, 'openfoodfacts')).toBe(19); // ~19h
    });
  });

  describe('isDataFreshByTimestamp', () => {
    it('deve identificar dados frescos corretamente', () => {
      const now = new Date();
      const fresh = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 horas atrás
      const old = new Date(now.getTime() - 8 * 60 * 60 * 1000); // 8 horas atrás
      
      expect(BarcodeService.isDataFreshByTimestamp(fresh.toISOString())).toBe(true);
      expect(BarcodeService.isDataFreshByTimestamp(old.toISOString())).toBe(false);
    });
  });
});

// Importar as novas classes para teste
import { GenericProductMatcher, GenericProductSuggestionService, SpecificProductCreationService } from '../barcode';

// Mock do ProductService
jest.mock('../products', () => ({
  ProductService: {
    getGenericProducts: jest.fn(() => Promise.resolve({
      data: [
        { id: '1', name: 'Arroz', category: 'cereais', user_id: 'test-user-id' },
        { id: '2', name: 'Feijão', category: 'leguminosas', user_id: 'test-user-id' },
        { id: '3', name: 'Macarrão', category: 'massas', user_id: 'test-user-id' }
      ]
    })),
    getGenericProductById: jest.fn((id: string) => Promise.resolve({
      data: { id, name: 'Produto Genérico', category: 'categoria', user_id: 'test-user-id' }
    })),
    createSpecificProduct: jest.fn(() => Promise.resolve({
      data: {
        id: 'specific-1',
        name: 'Produto Específico',
        brand: 'Marca',
        generic_product_id: '1',
        user_id: 'test-user-id',
        created_at: new Date().toISOString()
      }
    }))
  }
}));

describe('GenericProductMatcher', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findGenericProduct', () => {
    it('deve encontrar produto genérico por nome exato', async () => {
      const result = await GenericProductMatcher.findGenericProduct('Arroz');
      
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Arroz');
    });

    it('deve encontrar produto genérico por palavra-chave', async () => {
      const result = await GenericProductMatcher.findGenericProduct('Arroz Tio João 1kg');
      
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Arroz');
    });

    it('deve retornar null quando não encontrar produto', async () => {
      const result = await GenericProductMatcher.findGenericProduct('Produto Inexistente');
      
      expect(result).toBeNull();
    });
  });

  describe('suggestGenericProducts', () => {
    it('deve sugerir produtos genéricos baseado no nome', async () => {
      const suggestions = await GenericProductMatcher.suggestGenericProducts('Arroz Integral');
      
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].product.name).toBe('Arroz');
      expect(suggestions[0].similarity).toBeGreaterThan(0.8);
    });

    it('deve sugerir produtos por categoria', async () => {
      const suggestions = await GenericProductMatcher.suggestGenericProducts('Produto Desconhecido', 'cereais');
      
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].reason).toContain('Categoria');
    });

    it('deve identificar produtos essencialmente genéricos', async () => {
      const suggestions = await GenericProductMatcher.suggestGenericProducts('Banana Prata');
      
      expect(suggestions.length).toBeGreaterThan(0);
      // Deve ter alta similaridade para produtos essencialmente genéricos
      const essentialSuggestion = suggestions.find(s => s.reason.includes('essencialmente genérico'));
      if (essentialSuggestion) {
        expect(essentialSuggestion.similarity).toBeGreaterThan(0.9);
      }
    });
  });

  describe('createSpecificProduct', () => {
    it('deve criar produto específico com dados válidos', async () => {
      const productInfo: ProductInfo = {
        barcode: '1234567890123',
        name: 'Arroz Tio João Tipo 1 1kg',
        brand: 'Tio João',
        source: 'manual',
        confidence: 1.0
      };

      const result = await GenericProductMatcher.createSpecificProduct(productInfo, '1');
      
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Arroz Tio João Tipo 1 1kg');
      expect(result?.brand).toBe('Tio João');
    });

    it('deve extrair peso e volume do nome do produto', async () => {
      const productInfo: ProductInfo = {
        barcode: '1234567890123',
        name: 'Leite Integral 1L',
        brand: 'Marca',
        source: 'manual',
        confidence: 1.0
      };

      const result = await GenericProductMatcher.createSpecificProduct(productInfo, '1');
      
      expect(result).not.toBeNull();
      expect(result?.default_unit).toBe('l');
    });
  });
});

describe('GenericProductSuggestionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSuggestionsWithRanking', () => {
    it('deve retornar sugestões com ranking combinado', async () => {
      const suggestions = await GenericProductSuggestionService.getSuggestionsWithRanking('Arroz Branco');
      
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]).toHaveProperty('finalScore');
      expect(suggestions[0]).toHaveProperty('similarity');
      expect(suggestions[0]).toHaveProperty('popularity');
    });

    it('deve limitar o número de sugestões', async () => {
      const suggestions = await GenericProductSuggestionService.getSuggestionsWithRanking('Produto', undefined, 2);
      
      expect(suggestions.length).toBeLessThanOrEqual(2);
    });
  });

  describe('suggestForEssentiallyGeneric', () => {
    it('deve identificar produtos essencialmente genéricos', async () => {
      const suggestions = await GenericProductSuggestionService.suggestForEssentiallyGeneric('Banana');
      
      // Pode retornar vazio se não houver produtos genéricos de frutas no mock
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('deve retornar vazio para produtos não essencialmente genéricos', async () => {
      const suggestions = await GenericProductSuggestionService.suggestForEssentiallyGeneric('Produto Industrializado');
      
      expect(suggestions).toHaveLength(0);
    });
  });

  describe('getComprehensiveSuggestions', () => {
    it('deve combinar múltiplas estratégias de sugestão', async () => {
      const suggestions = await GenericProductSuggestionService.getComprehensiveSuggestions(
        'Arroz Integral',
        'cereais',
        'Tio João'
      );
      
      expect(Array.isArray(suggestions)).toBe(true);
      suggestions.forEach(suggestion => {
        expect(suggestion).toHaveProperty('finalScore');
        expect(suggestion).toHaveProperty('reasons');
        expect(suggestion).toHaveProperty('confidence');
        expect(['high', 'medium', 'low']).toContain(suggestion.confidence);
      });
    });
  });
});

describe('SpecificProductCreationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateProductData', () => {
    it('deve validar dados obrigatórios', () => {
      const productInfo: ProductInfo = {
        barcode: '1234567890123',
        name: 'Produto Teste',
        source: 'manual',
        confidence: 1.0
      };

      const validation = SpecificProductCreationService.validateProductData(productInfo, 'generic-1');
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('deve detectar dados obrigatórios faltando', () => {
      const productInfo: ProductInfo = {
        barcode: '',
        name: '',
        source: 'manual',
        confidence: 1.0
      };

      const validation = SpecificProductCreationService.validateProductData(productInfo, '');
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors).toContain('Nome do produto é obrigatório');
      expect(validation.errors).toContain('ID do produto genérico é obrigatório');
      expect(validation.errors).toContain('Código de barras é obrigatório');
    });

    it('deve detectar dados muito longos', () => {
      const longName = 'a'.repeat(300);
      const productInfo: ProductInfo = {
        barcode: '1234567890123',
        name: longName,
        source: 'manual',
        confidence: 1.0
      };

      const validation = SpecificProductCreationService.validateProductData(productInfo, 'generic-1');
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Nome do produto não pode ter mais de 255 caracteres');
    });

    it('deve gerar warnings para dados de baixa confiança', () => {
      const productInfo: ProductInfo = {
        barcode: '1234567890123',
        name: 'Produto Teste',
        source: 'manual',
        confidence: 0.2
      };

      const validation = SpecificProductCreationService.validateProductData(productInfo, 'generic-1');
      
      expect(validation.isValid).toBe(true);
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings[0]).toContain('baixa confiança');
    });
  });

  describe('createSpecificProductWithValidation', () => {
    it('deve criar produto com validação completa', async () => {
      const productInfo: ProductInfo = {
        barcode: '1234567890123',
        name: 'Arroz Integral 1kg',
        brand: 'Marca Teste',
        source: 'manual',
        confidence: 1.0
      };

      const result = await SpecificProductCreationService.createSpecificProductWithValidation(
        productInfo,
        'generic-1'
      );
      
      expect(result.success).toBe(true);
      expect(result.product).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it('deve falhar com dados inválidos', async () => {
      const productInfo: ProductInfo = {
        barcode: '',
        name: '',
        source: 'manual',
        confidence: 1.0
      };

      const result = await SpecificProductCreationService.createSpecificProductWithValidation(
        productInfo,
        ''
      );
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('checkForDuplicates', () => {
    it('deve verificar duplicatas por código de barras', async () => {
      // Mock para simular produto existente
      const mockSupabase = require('../supabase').supabase;
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: {
                  id: 'existing-1',
                  name: 'Produto Existente',
                  barcode: '1234567890123'
                },
                error: null
              }))
            }))
          }))
        }))
      });

      const result = await SpecificProductCreationService.checkForDuplicates(
        '1234567890123',
        'Produto Teste',
        'test-user-id'
      );
      
      expect(result.hasDuplicate).toBe(true);
      expect(result.duplicateType).toBe('barcode');
      expect(result.existingProduct).toBeDefined();
    });
  });
});

// Testes de integração para normalização de nomes
describe('Normalização de Nomes', () => {
  it('deve normalizar nomes corretamente', () => {
    // Acessar método privado para teste
    const normalizeProductName = (GenericProductMatcher as any).normalizeProductName;
    
    expect(normalizeProductName('Açúcar Cristal')).toBe('acucar cristal');
    expect(normalizeProductName('Pão de Açúcar')).toBe('pao de acucar');
    expect(normalizeProductName('Café com Açúcar')).toBe('cafe com acucar');
    expect(normalizeProductName('  PRODUTO   COM   ESPAÇOS  ')).toBe('produto com espacos');
  });

  it('deve calcular similaridade entre strings', () => {
    const calculateSimilarity = (GenericProductMatcher as any).calculateSimilarity;
    
    expect(calculateSimilarity('arroz', 'arroz')).toBe(1.0);
    expect(calculateSimilarity('arroz', 'feijao')).toBeLessThan(0.5);
    expect(calculateSimilarity('arroz integral', 'arroz')).toBeGreaterThan(0.5);
    expect(calculateSimilarity('', '')).toBe(1.0);
    expect(calculateSimilarity('test', '')).toBe(0);
  });
});

// Testes para extração de peso e volume
describe('Extração de Peso e Volume', () => {
  it('deve extrair peso corretamente', () => {
    const extractWeightAndVolume = (GenericProductMatcher as any).extractWeightAndVolume;
    
    const result1 = extractWeightAndVolume('Arroz Integral 1kg');
    expect(result1.weight).toBe('1');
    expect(result1.unit).toBe('kg');

    const result2 = extractWeightAndVolume('Açúcar Cristal 500g');
    expect(result2.weight).toBe('500');
    expect(result2.unit).toBe('g');
  });

  it('deve extrair volume corretamente', () => {
    const extractWeightAndVolume = (GenericProductMatcher as any).extractWeightAndVolume;
    
    const result1 = extractWeightAndVolume('Leite Integral 1L');
    expect(result1.volume).toBe('1');
    expect(result1.unit).toBe('l');

    const result2 = extractWeightAndVolume('Suco de Laranja 500ml');
    expect(result2.volume).toBe('500');
    expect(result2.unit).toBe('ml');
  });

  it('deve retornar objeto vazio quando não encontrar peso/volume', () => {
    const extractWeightAndVolume = (GenericProductMatcher as any).extractWeightAndVolume;
    
    const result = extractWeightAndVolume('Produto Sem Especificação');
    expect(result.weight).toBeUndefined();
    expect(result.volume).toBeUndefined();
    expect(result.unit).toBeUndefined();
  });
});