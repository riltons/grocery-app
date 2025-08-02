# Debug do Filtro do Modal

## Problema Identificado
O modal não está filtrando corretamente os produtos já na lista atual.

## Análise dos Dados Passados

### No app/list/[id].tsx (linha ~750):
```typescript
<AddProductInterface
  // ... outras props
  currentListProductIds={items.filter(item => item.product_id).map(item => item.product_id!)}
  currentListProductNames={items.map(item => item.product_name)}
/>
```

### Dados que chegam ao ProductSelector:
- `currentListProductIds`: Array de IDs dos produtos específicos na lista
- `currentListProductNames`: Array de nomes de todos os produtos na lista

## Possíveis Problemas

1. **Timing**: O modal pode estar carregando produtos antes dos dados da lista atual estarem disponíveis
2. **Filtro por nome**: Pode haver diferenças de case ou espaços nos nomes
3. **Logs não estão aparecendo**: Os console.log podem não estar sendo executados

## Próximos Passos
1. Adicionar logs mais detalhados
2. Verificar se os dados chegam corretamente
3. Testar o filtro manualmente