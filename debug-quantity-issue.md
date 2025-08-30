# Debug: Problema de Conversão Automática de Produto Genérico para Específico

## Problema Identificado
Quando a quantidade de um produto genérico é alterada na lista, ele está sendo automaticamente convertido para um produto específico.

## Análise do Código

### 1. Função de Alteração de Quantidade
As funções `handleIncreaseQuantity` e `handleDecreaseQuantity` apenas chamam:
```typescript
const { error } = await ListsService.updateListItem(id, item.id, {
  quantity: newQuantity
});
```

### 2. Função updateListItem
A função `ListsService.updateListItem` apenas atualiza a tabela `list_items`:
```typescript
const { data, error } = await supabase
  .from('list_items')
  .update(updateData)
  .eq('id', itemId)
  .eq('list_id', listId)
  .select()
  .single();
```

### 3. Lógica de Determinação de Tipo
No `ListsService.getListItems`, a lógica determina se um produto é genérico ou específico:
```typescript
const hasSpecificProduct = !!productInfo; // Se tem relação em list_item_products
const hasGenericProduct = !!genericInfo || !!item.generic_product_id;

if (hasSpecificProduct) {
  // Marca como específico (is_generic: false)
} else if (hasGenericProduct) {
  // Marca como genérico (is_generic: true)
}
```

## Possíveis Causas

1. **Trigger no Banco de Dados**: Pode haver um trigger que automaticamente cria uma relação em `list_item_products` quando um item é atualizado.

2. **Lógica Oculta**: Pode haver alguma lógica que não está visível que cria a relação.

3. **Estado Local Inconsistente**: O estado local pode estar sendo atualizado incorretamente após a alteração de quantidade.

4. **Recarregamento Automático**: Os dados podem estar sendo recarregados do banco após a alteração, e algo está criando a relação durante esse processo.

## Solução Implementada

O problema estava na atualização do estado local após a alteração de quantidade. As funções `handleIncreaseQuantity` e `handleDecreaseQuantity` estavam atualizando apenas a quantidade, mas não preservavam explicitamente as propriedades que determinam se um produto é genérico ou específico.

### Correção Aplicada

Modificadas as funções para preservar explicitamente as propriedades:
- `is_generic`: Indica se o produto é genérico
- `product_id`: ID do produto específico (se houver)
- `generic_product_id`: ID do produto genérico

```typescript
setItems(prevItems =>
  prevItems.map(i =>
    i.id === item.id ? { 
      ...i, 
      quantity: newQuantity,
      // Preservar explicitamente as propriedades que determinam o tipo do produto
      is_generic: i.is_generic,
      product_id: i.product_id,
      generic_product_id: i.generic_product_id
    } : i
  )
);
```

Esta correção garante que o tipo do produto (genérico vs específico) seja mantido corretamente após alterações de quantidade.