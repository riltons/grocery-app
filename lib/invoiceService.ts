import { XMLParser } from 'fast-xml-parser';
import { supabase } from './supabase';
import { ProductService } from './products';
import { ListsService } from './lists';

/**
 * Interface para representar um produto da nota fiscal
 */
export interface InvoiceProduct {
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  barcode?: string;
  brand?: string;
  category?: string;
}

/**
 * Interface para representar dados da nota fiscal
 */
export interface InvoiceData {
  number: string;
  date: string;
  storeName: string;
  storeDocument: string;
  products: InvoiceProduct[];
  totalAmount: number;
}

/**
 * Serviço para processar notas fiscais eletrônicas
 */
export const InvoiceService = {
  /**
   * Faz o download do XML da nota fiscal a partir da URL do QR Code
   */
  downloadInvoiceXML: async (qrCodeUrl: string): Promise<{ data: string | null; error: any }> => {
    try {
      console.log('📄 Fazendo download do XML da nota fiscal:', qrCodeUrl);
      
      const response = await fetch(qrCodeUrl);
      
      if (!response.ok) {
        throw new Error(`Erro ao baixar XML: ${response.status} ${response.statusText}`);
      }
      
      const xmlContent = await response.text();
      
      if (!xmlContent || xmlContent.trim().length === 0) {
        throw new Error('XML vazio ou inválido');
      }
      
      return { data: xmlContent, error: null };
    } catch (error) {
      console.error('Erro ao baixar XML da nota fiscal:', error);
      return { data: null, error };
    }
  },

  /**
   * Gera dados de exemplo para demonstração quando não conseguir processar XML real
   */
  generateDemoInvoiceData: (): InvoiceData => {
    console.log('📄 Gerando dados de demonstração...');
    
    return {
      number: "000000123",
      date: new Date().toISOString(),
      storeName: "Supermercado Demo LTDA",
      storeDocument: "12.345.678/0001-90",
      totalAmount: 67.45,
      products: [
        {
          name: "ARROZ BRANCO TIPO 1 5KG",
          quantity: 1,
          unit: "un",
          unitPrice: 18.90,
          totalPrice: 18.90,
          barcode: "7891234567890",
          brand: "Marca Demo",
          category: "Mercearia"
        },
        {
          name: "LEITE INTEGRAL 1L",
          quantity: 2,
          unit: "un",
          unitPrice: 4.75,
          totalPrice: 9.50,
          barcode: "7890123456789",
          brand: "Laticínios Demo",
          category: "Laticínios"
        },
        {
          name: "BANANA PRATA KG",
          quantity: 1.5,
          unit: "kg",
          unitPrice: 5.99,
          totalPrice: 8.99,
          category: "Frutas"
        },
        {
          name: "PÃO DE AÇÚCAR 500G",
          quantity: 1,
          unit: "un",
          unitPrice: 3.49,
          totalPrice: 3.49,
          barcode: "7892345678901",
          brand: "Padaria Demo",
          category: "Padaria"
        },
        {
          name: "DETERGENTE LÍQUIDO 500ML",
          quantity: 2,
          unit: "un",
          unitPrice: 2.99,
          totalPrice: 5.98,
          barcode: "7893456789012",
          brand: "Limpeza Demo",
          category: "Limpeza"
        },
        {
          name: "TOMATE KG",
          quantity: 0.8,
          unit: "kg",
          unitPrice: 7.99,
          totalPrice: 6.39,
          category: "Vegetais"
        },
        {
          name: "CAFÉ TORRADO 500G",
          quantity: 1,
          unit: "un",
          unitPrice: 12.90,
          totalPrice: 12.90,
          barcode: "7894567890123",
          brand: "Café Demo",
          category: "Bebidas"
        },
        {
          name: "PAPEL HIGIÊNICO 4 ROLOS",
          quantity: 1,
          unit: "un",
          unitPrice: 8.49,
          totalPrice: 8.49,
          barcode: "7895678901234",
          brand: "Higiene Demo",
          category: "Higiene"
        }
      ]
    };
  },

  /**
   * Processa o XML da nota fiscal e extrai os produtos
   */
  parseInvoiceXML: async (xmlContent: string): Promise<{ data: InvoiceData | null; error: any }> => {
    try {
      console.log('📄 Processando XML da nota fiscal...');
      
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        textNodeName: '#text',
        parseAttributeValue: true,
        parseTagValue: true,
        trimValues: true,
      });
      
      const xmlData = parser.parse(xmlContent);
      console.log('📄 Estrutura XML inicial:', JSON.stringify(xmlData, null, 2).substring(0, 500) + '...');
      
      // Função auxiliar para buscar recursivamente por uma chave
      const findInObject = (obj: any, key: string): any => {
        if (!obj || typeof obj !== 'object') return null;
        
        if (obj[key]) return obj[key];
        
        for (const k in obj) {
          if (typeof obj[k] === 'object') {
            const found = findInObject(obj[k], key);
            if (found) return found;
          }
        }
        return null;
      };
      
      // Buscar estruturas principais de forma mais flexível
      let infNFe = findInObject(xmlData, 'infNFe') || findInObject(xmlData, 'infNfe');
      
      if (!infNFe) {
        console.log('📄 Tentando estruturas alternativas...');
        // Tentar outras estruturas possíveis
        const possiblePaths = [
          xmlData.nfeProc?.NFe?.infNFe,
          xmlData.NFe?.infNFe,
          xmlData.nfe?.infNfe,
          xmlData.infNFe,
          xmlData.infNfe,
        ];
        
        for (const path of possiblePaths) {
          if (path) {
            infNFe = path;
            break;
          }
        }
      }
      
      if (!infNFe) {
        console.error('📄 Estrutura XML não reconhecida. Chaves disponíveis:', Object.keys(xmlData));
        throw new Error('Estrutura XML inválida - não foi possível encontrar dados da nota fiscal');
      }
      
      console.log('📄 Estrutura infNFe encontrada:', Object.keys(infNFe));
      
      // Extrair dados da nota fiscal com busca flexível
      const ide = infNFe.ide || findInObject(infNFe, 'ide');
      const emit = infNFe.emit || findInObject(infNFe, 'emit');
      const det = infNFe.det || findInObject(infNFe, 'det');
      const total = infNFe.total || findInObject(infNFe, 'total');
      
      console.log('📄 Elementos encontrados:', {
        ide: !!ide,
        emit: !!emit,
        det: !!det,
        total: !!total
      });
      
      if (!ide && !emit && !det) {
        console.error('📄 Nenhum dado essencial encontrado. Estrutura infNFe:', Object.keys(infNFe));
        throw new Error('Dados essenciais da nota fiscal não encontrados');
      }
      
      // Processar produtos
      const products: InvoiceProduct[] = [];
      
      if (det) {
        // Garantir que det seja um array
        const detArray = Array.isArray(det) ? det : [det];
        console.log('📄 Processando', detArray.length, 'produtos...');
        
        for (const item of detArray) {
          const prod = item.prod || item.produto || item;
          
          if (!prod) {
            console.log('📄 Item sem dados de produto:', Object.keys(item));
            continue;
          }
          
          console.log('📄 Processando produto:', Object.keys(prod));
          
          // Extrair informações do produto com múltiplas tentativas
          const name = prod.xProd || prod.desc || prod.descricao || prod.nome || 'Produto sem nome';
          const quantity = parseFloat(prod.qCom || prod.qtd || prod.quantidade || '1');
          const unit = prod.uCom || prod.unid || prod.unidade || 'un';
          const unitPrice = parseFloat(prod.vUnCom || prod.vUnit || prod.valorUnitario || '0');
          const totalPrice = parseFloat(prod.vProd || prod.vTotal || prod.valorTotal || '0');
          // Tentar extrair código de barras de diferentes campos possíveis
          let barcode = prod.cEAN || prod.cEANTrib || prod.gtin || prod.codigoBarras || 
                       prod.cEAN13 || prod.ean || prod.EAN || prod.GTIN || undefined;
          
          // Filtrar códigos inválidos comuns
          if (barcode && (
            barcode === 'SEM GTIN' || 
            barcode === '0000000000000' || 
            barcode === '' || 
            barcode.length < 8
          )) {
            barcode = undefined;
          }
          
          // Tentar extrair marca/fabricante
          let brand = prod.xMarca || prod.marca || prod.fabricante || undefined;
        
          // Tentar categorizar o produto baseado no nome
          const category = InvoiceService.categorizeProduct(name);
        
          products.push({
            name: name.trim(),
            quantity,
            unit: unit.toLowerCase(),
            unitPrice,
            totalPrice,
            barcode: barcode,
            brand: brand?.trim(),
            category,
          });
        }
      }
      
      // Extrair dados da loja com busca flexível
      let storeName = 'Loja desconhecida';
      let storeDocument = '';
      
      if (emit) {
        storeName = emit.xNome || emit.xFant || emit.razaoSocial || emit.nome || 'Loja desconhecida';
        storeDocument = emit.CNPJ || emit.CPF || emit.documento || '';
      }
      
      // Extrair total da nota com busca flexível
      let totalAmount = 0;
      
      if (total) {
        totalAmount = parseFloat(
          total.ICMSTot?.vNF || 
          total.vNF || 
          total.valorTotal || 
          total.total || 
          '0'
        );
      }
      
      // Se não encontrou total, calcular pela soma dos produtos
      if (totalAmount === 0 && products.length > 0) {
        totalAmount = products.reduce((sum, product) => sum + product.totalPrice, 0);
      }
      
      // Extrair dados da nota com busca flexível
      let invoiceNumber = 'N/A';
      let invoiceDate = new Date().toISOString();
      
      if (ide) {
        invoiceNumber = ide.nNF || ide.numero || ide.number || 'N/A';
        invoiceDate = ide.dhEmi || ide.dEmi || ide.dataEmissao || new Date().toISOString();
      }
      
      const invoiceData: InvoiceData = {
        number: invoiceNumber,
        date: invoiceDate,
        storeName: storeName.trim(),
        storeDocument,
        products,
        totalAmount,
      };
      
      console.log('📄 XML processado com sucesso:', {
        products: products.length,
        storeName: invoiceData.storeName,
        totalAmount: invoiceData.totalAmount,
      });
      
      return { data: invoiceData, error: null };
    } catch (error) {
      console.error('Erro ao processar XML da nota fiscal:', error);
      return { data: null, error };
    }
  },

  /**
   * Categoriza um produto baseado no seu nome
   */
  categorizeProduct: (productName: string): string => {
    const name = productName.toLowerCase();
    
    // Mapeamento de palavras-chave para categorias
    const categoryMap: { [key: string]: string[] } = {
      'Frutas': ['banana', 'maçã', 'laranja', 'uva', 'pêra', 'abacaxi', 'manga', 'mamão', 'melancia', 'melão', 'morango', 'kiwi', 'limão'],
      'Vegetais': ['alface', 'tomate', 'cebola', 'batata', 'cenoura', 'abobrinha', 'pepino', 'pimentão', 'brócolis', 'couve', 'espinafre', 'rúcula'],
      'Carnes': ['carne', 'frango', 'peixe', 'porco', 'boi', 'linguiça', 'salsicha', 'presunto', 'mortadela', 'bacon', 'costela', 'filé'],
      'Laticínios': ['leite', 'queijo', 'iogurte', 'manteiga', 'margarina', 'creme', 'nata', 'requeijão', 'mussarela', 'parmesão'],
      'Bebidas': ['água', 'refrigerante', 'suco', 'cerveja', 'vinho', 'café', 'chá', 'energético', 'isotônico', 'leite'],
      'Mercearia': ['arroz', 'feijão', 'açúcar', 'sal', 'óleo', 'vinagre', 'farinha', 'macarrão', 'biscoito', 'bolacha', 'pão'],
      'Limpeza': ['detergente', 'sabão', 'amaciante', 'desinfetante', 'álcool', 'água sanitária', 'esponja', 'papel higiênico'],
      'Higiene': ['shampoo', 'condicionador', 'sabonete', 'pasta de dente', 'escova', 'desodorante', 'perfume', 'creme'],
    };
    
    for (const [category, keywords] of Object.entries(categoryMap)) {
      if (keywords.some(keyword => name.includes(keyword))) {
        return category;
      }
    }
    
    return 'Outros';
  },

  /**
   * Processa uma nota fiscal e adiciona produtos ao banco de dados
   */
  processInvoice: async (invoiceData: InvoiceData): Promise<{ 
    data: { 
      addedProducts: any[]; 
      existingProducts: any[]; 
    } | null; 
    error: any 
  }> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }
      
      console.log('📄 Processando produtos da nota fiscal...');
      
      const addedProducts: any[] = [];
      const existingProducts: any[] = [];
      
      for (const invoiceProduct of invoiceData.products) {
        // Verificar se já existe um produto com o mesmo código de barras
        let existingProduct = null;
        
        if (invoiceProduct.barcode) {
          const { data: productByBarcode } = await ProductService.getSpecificProductByBarcode(invoiceProduct.barcode);
          existingProduct = productByBarcode;
        }
        
        // Se não encontrou por código de barras, verificar por nome
        if (!existingProduct) {
          const { data: productByName } = await ProductService.getSpecificProducts();
          existingProduct = productByName?.find(p => 
            p.name.toLowerCase().trim() === invoiceProduct.name.toLowerCase().trim()
          );
        }
        
        if (existingProduct) {
          existingProducts.push({
            ...existingProduct,
            invoiceQuantity: invoiceProduct.quantity,
            invoiceUnitPrice: invoiceProduct.unitPrice,
            invoiceTotalPrice: invoiceProduct.totalPrice,
          });
        } else {
          // Criar produto genérico se necessário
          const { data: genericProducts } = await ProductService.getGenericProducts();
          let genericProduct = genericProducts?.find(gp => 
            gp.name.toLowerCase().trim() === invoiceProduct.name.toLowerCase().trim()
          );
          
          if (!genericProduct) {
            // Buscar categoria por nome
            const { data: categories } = await supabase
              .from('categories')
              .select('*')
              .ilike('name', invoiceProduct.category || 'Outros')
              .limit(1);
            
            const categoryId = categories?.[0]?.id || null;
            
            // Criar produto genérico
            const { data: newGenericProduct } = await ProductService.createGenericProduct({
              name: invoiceProduct.name,
              category_id: categoryId,
              user_id: user.id,
            });
            
            genericProduct = newGenericProduct;
          }
          
          if (genericProduct) {
            // Criar produto específico
            const { data: newSpecificProduct } = await ProductService.createSpecificProduct({
              name: invoiceProduct.name,
              brand: invoiceProduct.brand || null,
              barcode: invoiceProduct.barcode || null,
              barcode_type: invoiceProduct.barcode ? 'EAN13' : null,
              generic_product_id: genericProduct.id,
              user_id: user.id,
            });
            
            if (newSpecificProduct) {
              // Adicionar preço ao histórico
              await ProductService.addProductPrice(newSpecificProduct.id, {
                price: invoiceProduct.unitPrice,
                date: invoiceData.date,
                store_id: null, // TODO: Implementar busca/criação de loja
                notes: `Importado da nota fiscal ${invoiceData.number}`,
              });
              
              addedProducts.push({
                ...newSpecificProduct,
                invoiceQuantity: invoiceProduct.quantity,
                invoiceUnitPrice: invoiceProduct.unitPrice,
                invoiceTotalPrice: invoiceProduct.totalPrice,
              });
            }
          }
        }
      }
      
      console.log('📄 Processamento concluído:', {
        addedProducts: addedProducts.length,
        existingProducts: existingProducts.length,
      });
      
      return { 
        data: { 
          addedProducts, 
          existingProducts 
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Erro ao processar nota fiscal:', error);
      return { data: null, error };
    }
  },

  /**
   * Compara produtos da nota fiscal com uma lista de compras
   */
  compareWithShoppingList: async (
    invoiceData: InvoiceData, 
    listId: string
  ): Promise<{ 
    data: {
      matchedItems: any[];
      unmatchedItems: any[];
      newProducts: InvoiceProduct[];
    } | null; 
    error: any 
  }> => {
    try {
      console.log('📄 Comparando produtos da nota fiscal com a lista...');
      
      // Buscar itens da lista
      const { data: listItems, error: listError } = await ListsService.getListItems(listId);
      
      if (listError || !listItems) {
        throw new Error('Erro ao buscar itens da lista');
      }
      
      const matchedItems: any[] = [];
      const unmatchedItems: any[] = [];
      const newProducts: InvoiceProduct[] = [];
      
      // Para cada produto da nota fiscal
      for (const invoiceProduct of invoiceData.products) {
        // Tentar encontrar correspondência na lista
        const matchedItem = listItems.find(item => {
          // Comparar por nome (normalizado)
          const itemName = item.product_name.toLowerCase().trim();
          const invoiceName = invoiceProduct.name.toLowerCase().trim();
          
          return itemName === invoiceName || 
                 itemName.includes(invoiceName) || 
                 invoiceName.includes(itemName);
        });
        
        if (matchedItem) {
          matchedItems.push({
            listItem: matchedItem,
            invoiceProduct,
            quantityDifference: invoiceProduct.quantity - matchedItem.quantity,
          });
        } else {
          newProducts.push(invoiceProduct);
        }
      }
      
      // Itens da lista que não foram encontrados na nota fiscal
      for (const listItem of listItems) {
        const found = matchedItems.some(match => match.listItem.id === listItem.id);
        if (!found) {
          unmatchedItems.push(listItem);
        }
      }
      
      console.log('📄 Comparação concluída:', {
        matchedItems: matchedItems.length,
        unmatchedItems: unmatchedItems.length,
        newProducts: newProducts.length,
      });
      
      return {
        data: {
          matchedItems,
          unmatchedItems,
          newProducts,
        },
        error: null,
      };
    } catch (error) {
      console.error('Erro ao comparar com lista de compras:', error);
      return { data: null, error };
    }
  },

  /**
   * Atualiza uma lista de compras com base na nota fiscal
   */
  updateShoppingListFromInvoice: async (
    listId: string,
    invoiceData: InvoiceData,
    options: {
      updateQuantities: boolean;
      updatePrices: boolean;
      addNewProducts: boolean;
      markAsPurchased: boolean;
    }
  ): Promise<{ data: any; error: any }> => {
    try {
      console.log('📄 Atualizando lista de compras com dados da nota fiscal...');
      
      // Comparar produtos
      const { data: comparison, error: comparisonError } = await InvoiceService.compareWithShoppingList(invoiceData, listId);
      
      if (comparisonError || !comparison) {
        throw new Error('Erro ao comparar produtos');
      }
      
      const updatedItems: any[] = [];
      const addedItems: any[] = [];
      
      // Atualizar itens correspondentes
      for (const match of comparison.matchedItems) {
        const updates: any = {};
        
        if (options.updateQuantities) {
          updates.quantity = match.invoiceProduct.quantity;
        }
        
        if (options.updatePrices) {
          updates.price = match.invoiceProduct.unitPrice;
        }
        
        if (options.markAsPurchased) {
          updates.checked = true;
        }
        
        if (Object.keys(updates).length > 0) {
          const { data: updatedItem } = await ListsService.updateListItem(
            listId,
            match.listItem.id,
            updates
          );
          
          if (updatedItem) {
            updatedItems.push(updatedItem);
          }
        }
      }
      
      // Adicionar novos produtos se solicitado
      if (options.addNewProducts) {
        for (const newProduct of comparison.newProducts) {
          const { data: addedItem } = await ListsService.addListItem(listId, {
            product_name: newProduct.name,
            quantity: newProduct.quantity,
            unit: newProduct.unit,
            checked: options.markAsPurchased,
          });
          
          if (addedItem) {
            addedItems.push(addedItem);
          }
        }
      }
      
      console.log('📄 Lista atualizada com sucesso:', {
        updatedItems: updatedItems.length,
        addedItems: addedItems.length,
      });
      
      return {
        data: {
          updatedItems,
          addedItems,
          unmatchedItems: comparison.unmatchedItems,
        },
        error: null,
      };
    } catch (error) {
      console.error('Erro ao atualizar lista de compras:', error);
      return { data: null, error };
    }
  },

  /**
   * Extrai URL do XML a partir do QR Code da nota fiscal
   */
  extractXMLUrlFromQRCode: (qrCodeData: string): string | null => {
    try {
      // QR Code da NFCe geralmente contém uma URL direta para o XML
      // ou dados estruturados que incluem a chave da nota
      
      // Se já é uma URL, retornar diretamente
      if (qrCodeData.startsWith('http')) {
        return qrCodeData;
      }
      
      // Tentar extrair chave da nota fiscal do QR Code
      // Formato comum: chave|data|valor|cnpj|hash
      const parts = qrCodeData.split('|');
      
      if (parts.length >= 1) {
        const chaveNota = parts[0];
        
        // Construir URL baseada na chave (exemplo genérico)
        // Na prática, cada estado tem seu próprio formato de URL
        if (chaveNota.length === 44) {
          // Extrair código do estado (posições 0-1)
          const codigoEstado = chaveNota.substring(0, 2);
          
          // URLs por estado (exemplos - podem variar)
          const urlsByState: { [key: string]: string } = {
            '35': 'https://www.fazenda.sp.gov.br/nfce/qrcode', // SP
            '33': 'https://www.fazenda.rj.gov.br/nfce/qrcode', // RJ
            '53': 'https://www.sefaz.rs.gov.br/nfce/qrcode',   // RS
            // Adicionar outros estados conforme necessário
          };
          
          const baseUrl = urlsByState[codigoEstado];
          
          if (baseUrl) {
            return `${baseUrl}?chNFe=${chaveNota}`;
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao extrair URL do QR Code:', error);
      return null;
    }
  },
};