# UPC Item DB API Integration

## Visão Geral

A UPC Item DB é uma API gratuita que fornece informações sobre produtos baseadas em códigos de barras UPC/EAN. Foi integrada como uma fonte adicional de dados no sistema de busca de produtos.

## Características da API

### Vantagens
- **Gratuita**: Não requer chave de API
- **Cobertura global**: Base de dados internacional
- **Informações detalhadas**: Inclui preços, imagens, descrições
- **Múltiplas fontes**: Agrega dados de vários varejistas

### Limitações
- **Limite diário**: Aproximadamente 100 requisições por IP por dia
- **Rate limiting**: Pode retornar 429 se exceder limites
- **Qualidade variável**: Dados dependem da disponibilidade nos varejistas
- **Foco em produtos comerciais**: Melhor para produtos vendidos online

## Posição na Sequência de Busca

A UPC Item DB foi posicionada estrategicamente na sequência de busca:

1. **Banco de dados local** (produtos já cadastrados)
2. **Cache local** (dados recentes)
3. **Open Food Facts** (API gratuita ilimitada)
4. **UPC Item DB** (API gratuita com limite) ← **NOVA**
5. **Cosmos API** (API paga limitada)

## Implementação

### Classe UPCItemDBService

```typescript
export class UPCItemDBService {
  private static readonly BASE_URL = 'https://api.upcitemdb.com/prod/trial/lookup';
  private static readonly TIMEOUT_MS = 10000;

  static async getProduct(barcode: string): Promise<ProductInfo | null>
}
```

### Mapeamento de Dados

A API retorna dados que são mapeados para a interface `ProductInfo`:

- **Nome**: `title` (limpo e normalizado)
- **Marca**: `brand`
- **Categoria**: `category` (mapeada para categorias do sistema)
- **Imagem**: Primeira imagem válida do array `images`
- **Descrição**: Combinação de `description`, `size`, `weight`, etc.
- **Metadados**: Unidade extraída do título/tamanho

### Tratamento de Erros

- **Timeout**: 10 segundos
- **Rate limiting**: Detecta status 429 e continua para próxima API
- **Dados inválidos**: Valida e limpa dados antes de retornar
- **Fallback**: Continua para Cosmos API se não encontrar

## Configuração de Cache

- **TTL**: 10-20 horas baseado na confiança
- **Confiança base**: 60%
- **Fatores de confiança**:
  - +10% se tem marca
  - +10% se tem descrição
  - +10% se tem imagens
  - +5% se tem categoria
  - +5% se tem tamanho/peso

## Monitoramento

### Logs Importantes

```
Buscando no UPC Item DB (API gratuita com limite)...
UPC Item DB: Produto encontrado: [nome do produto]
UPC Item DB: Limite de requisições atingido
UPC Item DB: Produto não encontrado
UPC Item DB: Timeout na requisição
```

### Métricas a Acompanhar

- Taxa de sucesso da UPC Item DB
- Frequência de rate limiting (429)
- Tempo de resposta médio
- Qualidade dos dados retornados

## Otimizações Futuras

1. **Cache inteligente**: Priorizar cache para códigos que frequentemente retornam 429
2. **Retry logic**: Implementar retry com backoff para timeouts
3. **Qualidade de dados**: Melhorar algoritmo de confiança baseado em feedback
4. **Fallback regional**: Usar APIs regionais quando UPC Item DB falhar

## Exemplo de Uso

```typescript
// Busca automática com fallback
const result = await BarcodeService.searchWithFallback('1234567890123');

if (result.found && result.product?.source === 'upcitemdb') {
  console.log('Produto encontrado na UPC Item DB:', result.product.name);
}
```

## Considerações de Produção

- **Monitorar limites**: Acompanhar uso diário para evitar bloqueios
- **Backup de dados**: Cache agressivo para reduzir dependência da API
- **Qualidade**: Validar dados antes de apresentar ao usuário
- **Performance**: API pode ser mais lenta que outras fontes