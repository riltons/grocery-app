# Guia de Teste - Seleção Múltipla de Produtos

## Como Testar a Nova Funcionalidade

### Pré-requisitos
1. Ter alguns produtos já cadastrados no sistema
2. Estar em uma lista de compras existente
3. App rodando em desenvolvimento

### Cenários de Teste

#### 1. Teste Básico - Seleção Múltipla (Produtos Genéricos)
**Objetivo**: Verificar se a seleção múltipla de produtos genéricos funciona corretamente

**Passos**:
1. Abra uma lista de compras
2. Na interface de adicionar produtos, clique no botão laranja (📋) 
3. Verifique se o modal abre já em modo múltiplo com o título "Selecionados (0)"
4. Toque em alguns produtos da lista
5. Verifique se os produtos ficam destacados com borda verde
6. Observe o contador no título aumentando
7. Clique em "Adicionar X produtos"
8. Verifique se todos os produtos foram adicionados à lista

**Resultado Esperado**: Produtos genéricos selecionados são adicionados com sucesso

#### 1b. Teste Básico - Seleção Múltipla (Produtos Específicos)
**Objetivo**: Verificar se a seleção múltipla de produtos específicos funciona corretamente

**Passos**:
1. Abra uma lista de compras
2. Na interface de adicionar produtos, clique no botão roxo (☑️) 
3. Verifique se o modal abre com o título "Selecionar Produto"
4. Clique no ícone de checkbox no cabeçalho para ativar modo múltiplo
5. Observe que o título muda para "Selecionados (0)"
6. Toque em alguns produtos da lista
7. Verifique se os produtos ficam destacados com borda verde
8. Observe o contador no título aumentando
9. Clique em "Adicionar X produtos"
10. Verifique se todos os produtos foram adicionados à lista

**Resultado Esperado**: Produtos específicos selecionados são adicionados com sucesso

#### 2. Teste - Selecionar Todos
**Objetivo**: Verificar funcionalidade de selecionar/desmarcar todos

**Passos**:
1. Abra o seletor em modo múltiplo
2. Clique em "Selecionar todos"
3. Verifique se todos os produtos visíveis ficam selecionados
4. Clique novamente em "Selecionar todos" (agora "Desmarcar todos")
5. Verifique se todos os produtos ficam desmarcados

**Resultado Esperado**: Seleção/deseleção em massa funciona corretamente

#### 3. Teste - Filtros com Seleção Múltipla
**Objetivo**: Verificar se filtros funcionam no modo múltiplo

**Passos**:
1. Abra o seletor em modo múltiplo
2. Digite algo no campo de busca
3. Verifique se a lista é filtrada
4. Selecione alguns produtos filtrados
5. Limpe a busca
6. Verifique se os produtos selecionados continuam marcados
7. Aplique filtros por tipo (Escaneados/Manuais)
8. Verifique se a seleção é mantida

**Resultado Esperado**: Filtros não afetam a seleção atual

#### 4. Teste - Alternância de Modos
**Objetivo**: Verificar transição entre modo único e múltiplo

**Passos**:
1. Abra o seletor normalmente (botão azul 🧊)
2. Toque em um produto
3. Verifique se é adicionado imediatamente (modo único)
4. Abra o seletor em modo múltiplo (botão roxo ☑️)
5. Alterne para modo único usando o botão do cabeçalho
6. Toque em um produto
7. Verifique se é adicionado imediatamente

**Resultado Esperado**: Alternância entre modos funciona corretamente

#### 5. Teste - Estados Visuais
**Objetivo**: Verificar feedback visual adequado

**Passos**:
1. Abra o seletor em modo múltiplo
2. Selecione alguns produtos
3. Verifique se têm borda verde e checkbox marcado
4. Verifique se produtos não selecionados têm checkbox vazio
5. Observe o botão "Adicionar X produtos" aparecer
6. Verifique se o contador no título está correto

**Resultado Esperado**: Interface visual clara e consistente

#### 6. Teste - Produtos Duplicados
**Objetivo**: Verificar comportamento com produtos já na lista

**Passos**:
1. Adicione alguns produtos à lista normalmente
2. Abra o seletor múltiplo
3. Tente selecionar produtos que já estão na lista
4. Confirme a seleção
5. Verifique se aparece o diálogo de produto duplicado
6. Teste as opções "Cancelar" e "Aumentar Quantidade"

**Resultado Esperado**: Sistema detecta e trata duplicatas adequadamente

#### 7. Teste - Seleção Persistente (NOVO)
**Objetivo**: Verificar se produtos já na lista permanecem selecionados

**Passos**:
1. Adicione alguns produtos à lista normalmente
2. Abra o seletor múltiplo (botão roxo ☑️)
3. Verifique se produtos já na lista aparecem pré-selecionados
4. Observe o fundo laranja e ícone de "já na lista"
5. Verifique se o contador no título inclui produtos pré-selecionados
6. Adicione mais produtos à seleção
7. Confirme e verifique se todos foram adicionados

**Resultado Esperado**: Produtos da lista atual ficam automaticamente selecionados

#### 8. Teste - Indicadores Visuais (NOVO)
**Objetivo**: Verificar indicadores visuais para produtos já na lista

**Passos**:
1. Tenha alguns produtos já na lista
2. Abra o seletor múltiplo
3. Verifique se produtos da lista têm:
   - Fundo laranja claro
   - Ícone de checkmark laranja
   - Texto "Já na lista"
   - Borda laranja
4. Compare com produtos não adicionados

**Resultado Esperado**: Distinção visual clara entre produtos na lista e disponíveis

#### 9. Teste - Performance
**Objetivo**: Verificar performance com muitos produtos

**Passos**:
1. Certifique-se de ter muitos produtos cadastrados (20+)
2. Abra o seletor múltiplo
3. Selecione muitos produtos (10+)
4. Confirme a seleção
5. Observe o tempo de processamento

**Resultado Esperado**: Interface responsiva mesmo com muitos produtos

### Casos Extremos para Testar

#### 1. Lista Vazia de Produtos
- Abrir seletor quando não há produtos cadastrados
- Verificar mensagem de estado vazio

#### 2. Seleção Vazia
- Ativar modo múltiplo mas não selecionar nada
- Verificar se botão de confirmação não aparece

#### 3. Busca Sem Resultados
- Buscar por produto inexistente
- Verificar se opção "Criar" aparece
- Testar criação de produto via seletor múltiplo

#### 4. Interrupção do Processo
- Selecionar produtos e fechar modal sem confirmar
- Reabrir e verificar se seleção foi limpa

### Problemas Conhecidos a Observar

1. **Performance**: Com muitos produtos, a interface pode ficar lenta
2. **Memória**: Seleção de muitos produtos pode consumir memória
3. **Sincronização**: Estado de seleção deve ser limpo ao fechar modal
4. **Duplicatas**: Sistema deve detectar produtos já na lista

### Melhorias Futuras Sugeridas

1. **Persistir modo preferido**: Lembrar se usuário prefere modo múltiplo
2. **Seleção por categoria**: Botão para selecionar todos de uma categoria
3. **Quantidades individuais**: Permitir quantidade diferente por produto
4. **Arrastar para selecionar**: Gesto para seleção rápida
5. **Feedback tátil**: Vibração ao selecionar produtos

### Relatório de Bugs

Se encontrar problemas, documente:
- **Passos para reproduzir**
- **Comportamento esperado vs atual**
- **Screenshots/vídeos se possível**
- **Dispositivo e versão do sistema**
- **Logs do console se disponíveis**