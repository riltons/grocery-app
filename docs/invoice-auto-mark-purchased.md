# Marcação Automática de Produtos Comprados

## Funcionalidade

Quando uma nota fiscal é vinculada a uma lista de compras, o sistema pode automaticamente marcar os produtos correspondentes como comprados na lista.

## Como Funciona

### 1. Interface do Usuário

No modal de processamento de nota fiscal (`InvoiceProcessModal`), quando há uma lista vinculada, o usuário vê duas opções:

- **"Salvar e Marcar como Comprado"** - Salva a nota fiscal e marca automaticamente os produtos como comprados na lista
- **"Salvar sem Marcar"** - Apenas salva a nota fiscal sem afetar a lista

### 2. Processo Automático

Quando o usuário escolhe "Salvar e Marcar como Comprado":

1. A nota fiscal é salva no banco de dados
2. Os itens da nota fiscal são salvos
3. A função SQL `mark_invoice_products_as_purchased` é executada
4. A função compara os produtos da nota com os itens da lista
5. Produtos correspondentes são marcados como comprados
6. Produtos não encontrados na lista são adicionados automaticamente (já marcados como comprados)

### 3. Algoritmo de Correspondência

A função SQL usa os seguintes critérios para encontrar correspondências:

```sql
LOWER(TRIM(product_name)) = LOWER(TRIM(invoice_item.name))
OR LOWER(TRIM(product_name)) LIKE '%' || LOWER(TRIM(invoice_item.name)) || '%'
OR LOWER(TRIM(invoice_item.name)) LIKE '%' || LOWER(TRIM(product_name)) || '%'
```

Isso permite correspondências:
- Exatas (ignorando maiúsculas/minúsculas e espaços)
- Parciais (nome do produto contém o nome da nota fiscal)
- Inversas (nome da nota fiscal contém o nome do produto)

### 4. Atualizações Realizadas

Para produtos encontrados na lista:
- ✅ Marca como comprado (`checked = true`)
- 💰 Atualiza o preço (se disponível na nota fiscal)
- 🕒 Atualiza timestamp (`updated_at`)

Para produtos não encontrados:
- ➕ Adiciona novo item à lista
- ✅ Já marca como comprado
- 💰 Define preço da nota fiscal
- 📊 Define quantidade e unidade da nota fiscal

## Implementação Técnica

### Função SQL

```sql
mark_invoice_products_as_purchased(
    p_invoice_id UUID,
    p_list_id UUID,
    p_user_id UUID
)
```

**Retorna:**
- `updated_items_count`: Número de itens existentes atualizados
- `added_items_count`: Número de novos itens adicionados
- `matched_products`: JSON com detalhes das correspondências

### Serviço JavaScript

```typescript
InvoiceService.linkInvoiceToListAndMarkPurchased(
    invoiceId: string,
    listId: string
)
```

### Opções do Modal

```typescript
handleSaveInvoice(markAsPurchased: boolean = false)
```

## Benefícios

1. **Automação**: Elimina a necessidade de marcar manualmente cada produto
2. **Precisão**: Usa algoritmo inteligente de correspondência
3. **Completude**: Adiciona produtos não previstos na lista original
4. **Preços**: Atualiza preços com valores reais da compra
5. **Performance**: Função SQL otimizada processa todos os itens de uma vez

## Casos de Uso

### Cenário 1: Lista Completa
- Usuário cria lista com 10 produtos
- Compra todos os 10 produtos
- Escaneia nota fiscal
- Todos os 10 produtos são marcados como comprados automaticamente

### Cenário 2: Compras Extras
- Usuário cria lista com 8 produtos
- Compra os 8 produtos + 3 extras não planejados
- Escaneia nota fiscal
- 8 produtos são marcados como comprados
- 3 produtos extras são adicionados à lista (já marcados como comprados)

### Cenário 3: Compra Parcial
- Usuário cria lista com 15 produtos
- Compra apenas 10 produtos
- Escaneia nota fiscal
- 10 produtos são marcados como comprados
- 5 produtos permanecem pendentes na lista

## Segurança

- ✅ Verificação de permissões do usuário
- ✅ Validação de acesso à nota fiscal e lista
- ✅ Função SQL com `SECURITY DEFINER`
- ✅ Prevenção de SQL injection via parâmetros tipados

## Monitoramento

O sistema registra logs detalhados:
- Número de produtos atualizados
- Número de produtos adicionados
- Detalhes das correspondências encontradas
- Erros e avisos durante o processo