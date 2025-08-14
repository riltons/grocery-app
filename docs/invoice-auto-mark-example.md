# Exemplo de Uso: Marcação Automática de Produtos

## Cenário de Teste

Vamos simular um cenário real onde um usuário:
1. Cria uma lista de compras
2. Vai ao supermercado
3. Compra alguns produtos da lista + alguns extras
4. Escaneia a nota fiscal
5. Os produtos são automaticamente marcados como comprados

## Passo a Passo

### 1. Lista Original
```
📋 Lista "Compras do Mês"
- [ ] Arroz 5kg (1 un)
- [ ] Feijão 1kg (2 un) 
- [ ] Leite 1L (3 un)
- [ ] Pão de açúcar (1 un)
- [ ] Banana (2 kg)
```

### 2. Compra Realizada (Nota Fiscal)
```
🧾 Nota Fiscal #123456
🏪 Supermercado ABC
📅 14/08/2025

Produtos:
- ARROZ BRANCO TIPO 1 5KG (1 un) - R$ 18,90
- FEIJAO PRETO 1KG (2 un) - R$ 7,50 cada
- LEITE INTEGRAL 1L (4 un) - R$ 4,75 cada  
- PAO DE ACUCAR 500G (1 un) - R$ 3,49
- BANANA PRATA KG (1,5 kg) - R$ 5,99/kg
- DETERGENTE LIQUIDO 500ML (1 un) - R$ 2,99  ← Extra
- CAFE TORRADO 500G (1 un) - R$ 12,90        ← Extra

Total: R$ 67,45
```

### 3. Processamento Automático

Quando o usuário escolhe "Salvar e Marcar como Comprado":

#### Correspondências Encontradas:
- ✅ "Arroz 5kg" ↔ "ARROZ BRANCO TIPO 1 5KG"
- ✅ "Feijão 1kg" ↔ "FEIJAO PRETO 1KG" 
- ✅ "Leite 1L" ↔ "LEITE INTEGRAL 1L"
- ✅ "Pão de açúcar" ↔ "PAO DE ACUCAR 500G"
- ✅ "Banana" ↔ "BANANA PRATA KG"

#### Produtos Extras Adicionados:
- ➕ "DETERGENTE LIQUIDO 500ML" (novo item)
- ➕ "CAFE TORRADO 500G" (novo item)

### 4. Lista Atualizada
```
📋 Lista "Compras do Mês" (Atualizada)
- [x] Arroz 5kg (1 un) - R$ 18,90 ✨
- [x] Feijão 1kg (2 un) - R$ 7,50 ✨
- [x] Leite 1L (4 un) - R$ 4,75 ✨  ← Quantidade atualizada
- [x] Pão de açúcar (1 un) - R$ 3,49 ✨
- [x] Banana (1,5 kg) - R$ 5,99 ✨  ← Quantidade atualizada
- [x] DETERGENTE LIQUIDO 500ML (1 un) - R$ 2,99 ✨  ← Novo
- [x] CAFE TORRADO 500G (1 un) - R$ 12,90 ✨        ← Novo

✨ = Marcado automaticamente pela nota fiscal
```

### 5. Resultado Final

```
📊 Resumo do Processamento:
✅ 5 produtos existentes marcados como comprados
➕ 2 novos produtos adicionados à lista
💰 Preços atualizados com valores reais da compra
🕒 Timestamps atualizados
```

## Código de Exemplo

### Usando a Interface
```typescript
// No componente InvoiceProcessModal
const handleSaveInvoice = async (markAsPurchased: boolean = false) => {
  const result = await InvoiceService.saveInvoice(invoiceData, {
    listId: selectedListId,
    linkToListAndMarkPurchased: markAsPurchased, // true = marcar como comprado
  });
};
```

### Usando o Serviço Diretamente
```typescript
// Salvar nota fiscal e marcar produtos como comprados
const { data, error } = await InvoiceService.saveInvoice(invoiceData, {
  listId: 'lista-uuid',
  linkToListAndMarkPurchased: true,
});

// Ou usar a função específica
const linkResult = await InvoiceService.linkInvoiceToListAndMarkPurchased(
  'invoice-uuid',
  'lista-uuid'
);

console.log(`${linkResult.data.updatedItemsCount} itens atualizados`);
console.log(`${linkResult.data.addedItemsCount} itens adicionados`);
```

### Usando a Função SQL Diretamente
```sql
SELECT * FROM mark_invoice_products_as_purchased(
  'invoice-uuid',
  'lista-uuid', 
  'user-uuid'
);
```

## Benefícios Demonstrados

1. **Automação Total**: Usuário não precisa marcar manualmente 7 produtos
2. **Inteligência**: Sistema encontrou correspondências mesmo com nomes diferentes
3. **Completude**: Produtos extras foram automaticamente adicionados
4. **Precisão**: Preços e quantidades foram atualizados com dados reais
5. **Eficiência**: Processo completo em uma única operação

## Casos Especiais

### Correspondência Parcial
- Lista: "Leite" → Nota: "LEITE INTEGRAL 1L" ✅
- Lista: "Arroz" → Nota: "ARROZ BRANCO TIPO 1 5KG" ✅

### Sem Correspondência
- Nota: "CHOCOLATE 100G" → Adicionado como novo item ➕

### Múltiplas Correspondências
- Se houver múltiplos itens similares na lista, apenas o primeiro é atualizado
- Os demais permanecem inalterados