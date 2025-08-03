/**
 * Teste para verificar a sequência otimizada de busca de códigos de barras
 * Verifica se Open Food Facts é chamado antes da API Cosmos
 */

import { BarcodeService } from '../barcode';

// Mock das APIs para testar a sequência
jest.mock('../barcode', () => {
  const originalModule = jest.requireActual('../barcode');
  
  return {
    ...originalModule,
    CosmosService: {
      ...originalModule.CosmosService,
      isValidGTIN: jest.fn(() => true),
      normalizeGTIN: jest.fn((gtin: string) => gtin),
      getProductByGTIN: jest.fn(() => Promise.resolve(null))
    },
    OpenFoodFactsService: {
      ...originalModule.OpenFoodFactsService,
      getProduct: jest.fn(() => Promise.resolve(null))
    }
  };
});

describe('BarcodeService - Sequência de Busca Otimizada', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.log para verificar a ordem das chamadas
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve buscar no Open Food Facts antes da API Cosmos', async () => {
    const testBarcode = '7891234567890';
    
    // Mock das funções para rastrear a ordem das chamadas
    const openFoodSpy = jest.spyOn(require('../barcode').OpenFoodFactsService, 'getProduct');
    const cosmosSpy = jest.spyOn(require('../barcode').CosmosService, 'getProductByGTIN');
    
    // Simular que não encontrou em nenhuma fonte
    openFoodSpy.mockResolvedValue(null);
    cosmosSpy.mockResolvedValue(null);
    
    await BarcodeService.searchWithFallback(testBarcode);
    
    // Verificar que Open Food Facts foi chamado
    expect(openFoodSpy).toHaveBeenCalledWith(testBarcode);
    
    // Verificar que Cosmos foi chamado após Open Food Facts
    expect(cosmosSpy).toHaveBeenCalledWith(testBarcode);
    
    // Verificar a ordem das chamadas através dos logs
    const consoleLogs = (console.log as jest.Mock).mock.calls.map(call => call[0]);
    
    const openFoodLogIndex = consoleLogs.findIndex(log => 
      log.includes('Buscando no Open Food Facts')
    );
    const cosmosLogIndex = consoleLogs.findIndex(log => 
      log.includes('Buscando na API Cosmos')
    );
    
    expect(openFoodLogIndex).toBeLessThan(cosmosLogIndex);
  });

  it('deve parar na primeira API que encontrar o produto', async () => {
    const testBarcode = '7891234567890';
    const mockProduct = {
      barcode: testBarcode,
      name: 'Produto Teste',
      source: 'openfoodfacts' as const,
      confidence: 0.8
    };
    
    const openFoodSpy = jest.spyOn(require('../barcode').OpenFoodFactsService, 'getProduct');
    const cosmosSpy = jest.spyOn(require('../barcode').CosmosService, 'getProductByGTIN');
    
    // Simular que encontrou no Open Food Facts
    openFoodSpy.mockResolvedValue(mockProduct);
    cosmosSpy.mockResolvedValue(null);
    
    const result = await BarcodeService.searchWithFallback(testBarcode);
    
    // Verificar que encontrou o produto
    expect(result.found).toBe(true);
    expect(result.product?.source).toBe('openfoodfacts');
    
    // Verificar que Open Food Facts foi chamado
    expect(openFoodSpy).toHaveBeenCalledWith(testBarcode);
    
    // Verificar que Cosmos NÃO foi chamado (pois já encontrou no Open Food Facts)
    expect(cosmosSpy).not.toHaveBeenCalled();
  });

  it('deve usar Cosmos apenas se Open Food Facts não encontrar', async () => {
    const testBarcode = '7891234567890';
    const mockCosmosProduct = {
      barcode: testBarcode,
      name: 'Produto Cosmos',
      source: 'cosmos' as const,
      confidence: 0.9
    };
    
    const openFoodSpy = jest.spyOn(require('../barcode').OpenFoodFactsService, 'getProduct');
    const cosmosSpy = jest.spyOn(require('../barcode').CosmosService, 'getProductByGTIN');
    
    // Simular que não encontrou no Open Food Facts, mas encontrou na Cosmos
    openFoodSpy.mockResolvedValue(null);
    cosmosSpy.mockResolvedValue(mockCosmosProduct);
    
    const result = await BarcodeService.searchWithFallback(testBarcode);
    
    // Verificar que encontrou o produto
    expect(result.found).toBe(true);
    expect(result.product?.source).toBe('cosmos');
    
    // Verificar que ambas as APIs foram chamadas na ordem correta
    expect(openFoodSpy).toHaveBeenCalledWith(testBarcode);
    expect(cosmosSpy).toHaveBeenCalledWith(testBarcode);
  });
});