# Guia de Teste - Funcionalidade de Substituição de Produtos

## Objetivo
Verificar se os badges "Genérico" e botões de substituição estão persistindo corretamente quando a lista é fechada e reaberta.

## Cenários de Teste

### 1. Teste de Persistência de Produtos Genéricos

#### Passos:
1. **Abrir uma lista existente ou criar nova**
2. **Adicionar produto genérico:**
   - Clicar no botão laranja (ícone de lista) na interface de adição
   - Selecionar um produto genérico existente (ex: "Arroz", "Leite")
   - Confirmar adição
3. **Verificar indicadores visuais:**
   - Badge laranja "Genérico" deve aparecer
   - Botão de substituição (ícone de troca) deve estar visível
4. **Fechar e reabrir a lista:**
   - Voltar para tela inicial
   - Reabrir a mesma lista
5. **Verificar persistência:**
   - Badge "Genérico" deve continuar visível
   - Botão de substituição deve continuar disponível

#### Resultado Esperado:
✅ Badge e botão persistem após reabrir a lista

### 2. Teste de Substituição de Produto

#### Passos:
1. **Com produto genérico na lista:**
   - Clicar no botão de substituição (ícone de troca)
2. **No modal de substituição:**
   - Verificar se produtos específicos são listados
   - Selecionar um produto específico
3. **Após substituição:**
   - Badge "Genérico" deve desaparecer
   - Informações do produto específico devem aparecer
   - Botão de informações (ícone i) deve ficar disponível
4. **Fechar e reabrir lista:**
   - Verificar se produto continua como específico

#### Resultado Esperado:
✅ Produto substituído permanece específico após reabrir

### 3. Teste de Criação de Produto Genérico

#### Passos:
1. **Criar novo produto genérico:**
   - Clicar no botão laranja (produtos genéricos)
   - Clicar em "Criar novo produto"
   - Preencher nome e categoria
   - Confirmar criação
2. **Verificar na lista:**
   - Produto deve aparecer com badge "Genérico"
   - Botão de substituição deve estar disponível
3. **Testar persistência:**
   - Fechar e reabrir lista
   - Verificar se mantém características genéricas

#### Resultado Esperado:
✅ Produto genérico criado persiste corretamente

## Problemas Conhecidos e Soluções

### Problema: Badge não persiste
**Causa:** Dados não estão sendo salvos corretamente no banco
**Solução:** Verificar se `generic_product_id` está sendo passado na função `addListItem`

### Problema: Botão de substituição não aparece
**Causa:** Campo `is_generic` não está sendo calculado corretamente
**Solução:** Verificar lógica na função `getListItems` do serviço

### Problema: Erro ao carregar produtos específicos
**Causa:** Relação entre produtos genéricos e específicos não está correta
**Solução:** Verificar se produtos específicos têm `generic_product_id` válido

## Estrutura de Dados Esperada

### Item de Lista Genérico:
```json
{
  "id": "uuid",
  "product_name": "Arroz",
  "generic_product_id": "uuid-do-produto-generico",
  "product_id": null,
  "is_generic": true,
  "category": "Alimentos"
}
```

### Item de Lista Específico:
```json
{
  "id": "uuid",
  "product_name": "Arroz Tio João 1kg",
  "generic_product_id": "uuid-do-produto-generico",
  "product_id": "uuid-do-produto-especifico",
  "is_generic": false,
  "product_brand": "Tio João"
}
```

## Verificações no Banco de Dados

### Consulta para verificar estrutura:
```sql
SELECT 
  li.id,
  li.product_name,
  li.generic_product_id,
  gp.name as generic_name,
  lip.specific_product_id,
  sp.name as specific_name,
  sp.brand
FROM list_items li
LEFT JOIN generic_products gp ON li.generic_product_id = gp.id
LEFT JOIN list_item_products lip ON li.id = lip.list_item_id
LEFT JOIN specific_products sp ON lip.specific_product_id = sp.id
WHERE li.list_id = 'uuid-da-lista'
ORDER BY li.created_at DESC;
```

## Logs para Debug

### Verificar no console:
1. **Ao carregar lista:** Logs de `getListItems`
2. **Ao adicionar produto genérico:** Logs de `addListItem`
3. **Ao substituir produto:** Logs de substituição

### Pontos de verificação:
- [ ] `generic_product_id` está sendo salvo
- [ ] `is_generic` está sendo calculado corretamente
- [ ] Relações na tabela `list_item_products` estão corretas
- [ ] Interface está reagindo aos dados corretamente

## Status da Implementação

- ✅ Migração do banco aplicada
- ✅ Serviço de listas atualizado
- ✅ Interface de usuário implementada
- ✅ Modal de substituição criado
- 🔄 **Testando persistência dos badges**

## Próximos Passos

1. Executar testes manuais
2. Verificar logs de erro
3. Ajustar lógica se necessário
4. Documentar bugs encontrados
5. Implementar correções