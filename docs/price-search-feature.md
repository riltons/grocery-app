# Funcionalidade de Pesquisa de Preços

## Visão Geral

A funcionalidade de pesquisa de preços permite aos usuários criar listas específicas de uma loja, onde podem escanear produtos pelo código de barras e registrar seus preços. Esta funcionalidade é útil para:

- Comparar preços entre diferentes lojas
- Manter histórico de preços de produtos
- Criar listas de compras com preços reais
- Acompanhar variações de preços ao longo do tempo

## Estrutura de Arquivos

### Páginas
- `app/stores/index.tsx` - Lista de lojas cadastradas
- `app/stores/[id].tsx` - Detalhes de uma loja específica
- `app/stores/price-search.tsx` - Página principal de pesquisa de preços

### Serviços
- `lib/stores.ts` - Serviço para gerenciar operações com lojas
- `lib/priceSearch.ts` - Serviço para gerenciar sessões de pesquisa de preços
- `lib/products.ts` - Serviço para gerenciar produtos (já existente, com melhorias)
- `lib/barcode.ts` - Serviço para processamento de códigos de barras (já existente)

### Componentes
- `components/PriceInputModal.tsx` - Modal para entrada de preços (atualizado)
- `components/SimpleBarcodeScanner.tsx` - Scanner de código de barras (já existente)

## Fluxo de Uso

### 1. Gerenciamento de Lojas
1. Usuário acessa "Minhas Lojas" através do botão na tela inicial
2. Pode criar novas lojas informando nome e endereço (opcional)
3. Visualiza lista de lojas cadastradas
4. Pode excluir lojas não utilizadas

### 2. Pesquisa de Preços
1. Usuário seleciona uma loja da lista
2. Acessa a página de detalhes da loja
3. Clica em "Pesquisar Preços" para iniciar uma sessão de pesquisa
4. Sistema cria ou recupera sessão ativa da loja
5. Escaneia produtos usando o código de barras
6. Para cada produto escaneado:
   - Se o produto já existe no banco: é adicionado automaticamente à sessão
   - Se o produto não existe: é criado automaticamente usando dados das APIs externas
   - Modal de preço é aberto para o usuário informar o valor
7. Pode visualizar lista de produtos escaneados com seus preços (persistente)
8. Pode editar preços ou remover produtos da lista
9. Pode finalizar sessão (salva preços no histórico) ou limpar lista

### 3. Processamento de Códigos de Barras
O sistema segue uma sequência otimizada de busca:

1. **Banco de dados local** - Verifica se o produto já foi cadastrado pelo usuário
2. **Cache local** - Dados recentes de buscas anteriores
3. **Open Food Facts** - API gratuita e ilimitada
4. **UPC Item DB** - API gratuita com limite diário
5. **Cosmos API** - API limitada (usar apenas quando necessário)

### 4. Criação Automática de Produtos
Quando um produto não existe no banco:

1. Sistema busca informações nas APIs externas
2. Cria automaticamente um produto genérico
3. Cria um produto específico vinculado ao genérico
4. Adiciona à lista de preços
5. Abre modal para entrada do preço

## Estrutura de Dados

### Tabela `stores`
```sql
- id: UUID (PK)
- name: VARCHAR (nome da loja)
- address: VARCHAR (endereço opcional)
- user_id: UUID (FK para auth.users)
- created_at: TIMESTAMP
```

### Tabela `price_search_sessions`
```sql
- id: UUID (PK)
- store_id: UUID (FK para stores)
- name: VARCHAR (nome da sessão)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- user_id: UUID (FK para auth.users)
- is_active: BOOLEAN (apenas uma sessão ativa por loja/usuário)
```

### Tabela `price_search_items`
```sql
- id: UUID (PK)
- session_id: UUID (FK para price_search_sessions)
- specific_product_id: UUID (FK para specific_products)
- price: DECIMAL (preço informado, pode ser null)
- scanned: BOOLEAN (se foi escaneado ou manual)
- created_at: TIMESTAMP
- user_id: UUID (FK para auth.users)
```

### Tabela `price_history`
```sql
- id: UUID (PK)
- specific_product_id: UUID (FK para specific_products)
- store_id: UUID (FK para stores)
- price: DECIMAL (preço registrado)
- date: TIMESTAMP (data do registro)
- user_id: UUID (FK para auth.users)
- created_at: TIMESTAMP
```

## Funcionalidades Implementadas

### ✅ Gerenciamento de Lojas
- [x] Listar lojas do usuário
- [x] Criar nova loja
- [x] Excluir loja
- [x] Visualizar detalhes da loja
- [x] Estatísticas da loja (produtos, gastos, etc.)

### ✅ Pesquisa de Preços
- [x] Scanner de código de barras
- [x] Busca automática de produtos em APIs externas
- [x] Criação automática de produtos não encontrados
- [x] Modal para entrada de preços
- [x] Lista de produtos escaneados (persistente)
- [x] Edição de preços
- [x] Remoção de produtos da lista
- [x] Cálculo do total da lista
- [x] Sessões persistentes por loja
- [x] Finalização de sessão (salva no histórico)
- [x] Limpeza de sessão

### ✅ Integração com Sistema Existente
- [x] Reutilização do sistema de produtos genéricos/específicos
- [x] Integração com scanner de código de barras existente
- [x] Uso das APIs externas já configuradas
- [x] Compatibilidade com sistema de autenticação

## Melhorias Futuras

### 🔄 Funcionalidades Planejadas
- [ ] Comparação de preços entre lojas
- [ ] Gráficos de evolução de preços
- [ ] Alertas de variação de preços
- [ ] Exportação de listas de preços
- [ ] Compartilhamento de listas entre usuários
- [ ] Integração com listas de compras existentes
- [ ] Busca de produtos por nome (além do código de barras)
- [ ] Categorização automática de produtos
- [ ] Relatórios de gastos por categoria/loja

### 🎯 Otimizações
- [ ] Cache mais inteligente para produtos frequentes
- [ ] Busca offline de produtos já escaneados
- [ ] Sincronização em background
- [ ] Compressão de imagens de produtos
- [ ] Otimização de performance para listas grandes

## Configuração e Instalação

### Dependências
As seguintes dependências já estão configuradas no projeto:
- `@expo/vector-icons` - Ícones
- `expo-barcode-scanner` - Scanner de código de barras
- `@supabase/supabase-js` - Cliente Supabase
- `expo-router` - Navegação

### Configuração do Banco de Dados
As tabelas necessárias já estão criadas no Supabase:
- `stores` - Lojas
- `price_history` - Histórico de preços
- `specific_products` - Produtos específicos
- `generic_products` - Produtos genéricos

### Permissões
- Câmera: Necessária para o scanner de código de barras
- Internet: Para busca em APIs externas

## Uso da Funcionalidade

### Para Usuários
1. Acesse "Minhas Lojas" na tela inicial
2. Crie ou selecione uma loja
3. Clique em "Pesquisar Preços"
4. Escaneie produtos e informe os preços
5. Visualize sua lista de preços

### Para Desenvolvedores
```typescript
// Exemplo de uso do serviço de lojas
import { StoreService } from '../lib/stores';

// Criar nova loja
const { data: store } = await StoreService.createStore({
  name: 'Supermercado ABC',
  address: 'Rua das Flores, 123'
});

// Buscar produtos com preços de uma loja
const { data: products } = await StoreService.getStoreProducts(storeId);

// Adicionar preço a um produto
await ProductService.addProductPrice(productId, {
  store_id: storeId,
  price: 15.99,
  date: new Date().toISOString()
});
```

## Considerações Técnicas

### Performance
- Cache local para produtos frequentemente escaneados
- Busca otimizada priorizando fontes gratuitas
- Lazy loading para listas grandes

### Segurança
- Validação de entrada de preços
- Sanitização de dados de APIs externas
- Row Level Security (RLS) em todas as tabelas

### Usabilidade
- Interface intuitiva para scanner
- Feedback visual durante processamento
- Tratamento de erros amigável
- Suporte a diferentes formatos de código de barras

### Escalabilidade
- Estrutura modular para fácil extensão
- Separação clara entre serviços e componentes
- Preparado para funcionalidades futuras