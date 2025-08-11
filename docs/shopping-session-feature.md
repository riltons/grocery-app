# Funcionalidade de Sessão de Compras

## Visão Geral

Esta funcionalidade implementa um sistema de sessão de compras que melhora a experiência do usuário ao marcar produtos como comprados em uma lista. O sistema funciona da seguinte forma:

## Como Funciona

### 1. Seleção de Loja no Primeiro Produto
- Quando o usuário marca o **primeiro produto** como comprado em uma lista, um modal é exibido para selecionar a loja onde está fazendo as compras
- Esta seleção fica ativa durante toda a sessão de compras
- A loja selecionada é exibida no cabeçalho da lista como indicador visual

### 2. Produtos Subsequentes
- Após selecionar a loja, todos os próximos produtos marcados como comprados **não perguntam mais a loja**
- O sistema usa automaticamente a loja já selecionada
- O usuário pode trocar de loja clicando no indicador no cabeçalho

### 3. Preços Automáticos
- Se o usuário não informar um preço ao marcar um produto como comprado
- E se houver um preço anterior registrado para aquele produto
- O sistema automaticamente usa o **último preço registrado**

### 4. Histórico de Preços
- Quando um preço é informado (ou usado automaticamente), ele é salvo no histórico
- O histórico associa: produto + loja + preço + data
- Isso permite comparações de preços entre lojas e ao longo do tempo

## Componentes Implementados

### StoreSelectionModal
- Modal para seleção de loja
- Lista todas as lojas cadastradas pelo usuário
- Permite pular a seleção se necessário
- Sugere cadastrar lojas se não houver nenhuma

### Modificações no PriceInputModal
- Agora mostra a loja selecionada no cabeçalho
- Interface mais clara sobre onde o preço está sendo registrado

### Modificações na Lista de Compras
- Estado para armazenar a loja selecionada na sessão
- Indicador visual da loja no cabeçalho
- Lógica para determinar quando mostrar seleção de loja vs. preço

## Fluxo de Uso

1. **Usuário abre uma lista de compras**
2. **Marca o primeiro produto como comprado**
   - Modal de seleção de loja aparece
   - Usuário seleciona uma loja
3. **Modal de preço aparece**
   - Mostra a loja selecionada
   - Usuário pode informar preço ou pular
4. **Próximos produtos**
   - Apenas modal de preço (loja já selecionada)
   - Se não informar preço, usa o último registrado
5. **Preços são salvos no histórico**
   - Associados à loja selecionada
   - Disponíveis para uso futuro

## Benefícios

- **Menos cliques**: Não precisa selecionar loja a cada produto
- **Preços automáticos**: Reutiliza preços anteriores quando não informado
- **Contexto visual**: Sempre sabe em qual loja está comprando
- **Histórico rico**: Dados para comparação de preços
- **Flexibilidade**: Pode trocar de loja durante a compra se necessário

## Casos de Uso

### Compra Normal
1. Seleciona loja no primeiro produto
2. Informa preços conforme compra
3. Alguns produtos podem usar preços automáticos

### Compra Rápida
1. Seleciona loja no primeiro produto
2. Pula todos os preços (usa automáticos quando disponível)
3. Foco na marcação rápida dos produtos

### Comparação de Preços
1. Compra na Loja A
2. Depois compra na Loja B
3. Histórico permite comparar preços entre as lojas

## Implementação Técnica

### Estados Adicionados
- `selectedStore`: Loja selecionada na sessão
- `storeSelectionModalVisible`: Controle do modal de loja

### Funções Principais
- `handleStoreSelection()`: Processa seleção de loja
- `handleToggleItem()`: Modificada para detectar primeiro produto
- `handleConfirmPurchase()`: Modificada para usar preços automáticos
- `ProductService.getLastProductPrice()`: Nova função para buscar último preço

### Integração com Banco
- Salva preços no `price_history`
- Associa com `store_id` da sessão
- Busca último preço por `specific_product_id`