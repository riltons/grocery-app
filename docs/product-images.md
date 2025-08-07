# Sistema de Imagens de Produtos

## Visão Geral

O sistema agora exibe imagens dos produtos em várias partes da aplicação, melhorando a experiência visual e facilitando a identificação dos produtos.

## Locais onde as Imagens Aparecem

### 1. Modal de Entrada de Preço (`PriceInputModal`)
- **Tamanho**: Large (60x60px)
- **Localização**: Ao lado das informações do produto
- **Funcionalidades**: 
  - Loading indicator durante carregamento
  - Placeholder com ícone quando não há imagem
  - Fallback automático em caso de erro

### 2. Lista de Produtos na Pesquisa de Preços
- **Tamanho**: Medium (50x50px)
- **Localização**: À esquerda de cada item da lista
- **Funcionalidades**:
  - Carregamento assíncrono
  - Placeholder consistente
  - Performance otimizada

### 3. Lista de Produtos na Página da Loja
- **Tamanho**: Medium (50x50px)
- **Localização**: À esquerda de cada produto no histórico
- **Funcionalidades**:
  - Integração com dados do histórico de preços
  - Exibição consistente com outras listas

## Componente ProductImage

### Características
- **Componente reutilizável** para todas as imagens de produtos
- **Três tamanhos**: small (40x40), medium (50x50), large (60x60)
- **Estados visuais**: loading, error, placeholder
- **Performance otimizada** com lazy loading

### Props
```typescript
interface ProductImageProps {
  imageUrl?: string;        // URL da imagem do produto
  size?: 'small' | 'medium' | 'large';  // Tamanho da imagem
  style?: any;             // Estilos customizados
}
```

### Uso
```typescript
import ProductImage from '../components/ProductImage';

// Exemplo básico
<ProductImage imageUrl={product.image_url} />

// Com tamanho específico
<ProductImage 
  imageUrl={product.image_url} 
  size="large" 
/>

// Com estilo customizado
<ProductImage 
  imageUrl={product.image_url} 
  size="medium"
  style={{ marginRight: 12 }}
/>
```

## Fontes de Imagens

### APIs Externas
As imagens são obtidas automaticamente quando produtos são criados via scanner:

1. **Open Food Facts**
   - Campo: `image_url` ou `image_front_url`
   - Qualidade: Boa para produtos alimentícios
   - Disponibilidade: Alta para produtos brasileiros

2. **Cosmos API**
   - Campo: `image` ou `thumbnail`
   - Qualidade: Variável
   - Disponibilidade: Média

3. **UPC Item DB**
   - Campo: `images` array
   - Qualidade: Variável
   - Disponibilidade: Baixa

### Produtos Manuais
- Produtos criados manualmente não têm imagem inicialmente
- Placeholder com ícone de cubo é exibido
- Futuras versões podem permitir upload de imagens

## Tratamento de Erros

### Estados de Erro
1. **URL inválida**: Exibe placeholder
2. **Imagem não carrega**: Fallback para placeholder após timeout
3. **Sem URL**: Exibe placeholder imediatamente

### Placeholder
- **Ícone**: `cube-outline` do Ionicons
- **Cor**: `#94a3b8` (cinza suave)
- **Fundo**: `#f1f5f9` com borda `#e2e8f0`
- **Tamanho**: Adapta-se ao tamanho solicitado

## Performance

### Otimizações Implementadas
- **Lazy Loading**: Imagens carregam apenas quando necessário
- **Cache Automático**: React Native faz cache das imagens
- **Resize Mode**: `cover` para melhor apresentação
- **Loading States**: Indicadores visuais durante carregamento

### Recomendações
- Imagens são redimensionadas automaticamente
- Não há necessidade de pré-processamento
- Cache é gerenciado automaticamente pelo sistema

## Exemplos de Uso

### No Modal de Preço
```typescript
<PriceInputModal
  visible={showModal}
  productName="Coca-Cola 350ml"
  productBrand="Coca-Cola"
  productImage="https://example.com/coca-cola.jpg"
  onConfirm={handlePriceConfirm}
  onClose={handleClose}
/>
```

### Na Lista de Produtos
```typescript
const renderProduct = ({ item }) => (
  <View style={styles.productItem}>
    <ProductImage 
      imageUrl={item.image_url}
      size="medium"
    />
    <View style={styles.productInfo}>
      <Text>{item.name}</Text>
      <Text>{item.brand}</Text>
    </View>
  </View>
);
```

## Melhorias Futuras

### Funcionalidades Planejadas
- [ ] Upload de imagens personalizadas
- [ ] Edição de imagens dos produtos
- [ ] Cache mais inteligente com expiração
- [ ] Compressão automática de imagens
- [ ] Suporte a múltiplas imagens por produto
- [ ] Zoom nas imagens (modal expandido)

### Otimizações Técnicas
- [ ] Lazy loading mais avançado
- [ ] Preload de imagens críticas
- [ ] Otimização de tamanho baseada na tela
- [ ] Suporte a WebP quando disponível

## Troubleshooting

### Problemas Comuns

#### Imagens não aparecem
- **Causa**: URL inválida ou inacessível
- **Solução**: Verificar se a URL está correta e acessível
- **Fallback**: Placeholder é exibido automaticamente

#### Loading muito lento
- **Causa**: Imagens muito grandes ou conexão lenta
- **Solução**: Sistema já otimiza automaticamente
- **Indicador**: Loading spinner é exibido

#### Placeholder sempre aparece
- **Causa**: Campo `image_url` vazio ou null
- **Solução**: Verificar se o produto tem imagem no banco
- **Comportamento**: Normal para produtos manuais

### Debug
```typescript
// Para debug, adicione logs no componente ProductImage
console.log('Loading image:', imageUrl);
console.log('Image error:', error);
console.log('Image loaded successfully');
```

## Estrutura de Dados

### Banco de Dados
```sql
-- Campo image_url na tabela specific_products
ALTER TABLE specific_products 
ADD COLUMN IF NOT EXISTS image_url TEXT;
```

### Tipo TypeScript
```typescript
type SpecificProduct = {
  id: string;
  name: string;
  brand?: string;
  image_url?: string;  // URL da imagem do produto
  // ... outros campos
};
```

## Testes

### Cenários de Teste
1. **Produto com imagem válida**: Deve exibir a imagem
2. **Produto sem imagem**: Deve exibir placeholder
3. **URL inválida**: Deve fazer fallback para placeholder
4. **Conexão lenta**: Deve exibir loading indicator
5. **Diferentes tamanhos**: Deve adaptar corretamente

### URLs de Teste
```
// Imagem válida
https://images.openfoodfacts.org/images/products/789/100/010/0103/front_pt.jpg

// URL inválida (para testar fallback)
https://invalid-url.com/image.jpg

// Imagem muito grande (para testar loading)
https://example.com/very-large-image.jpg
```

O sistema de imagens está totalmente integrado e pronto para uso! 🎨✨