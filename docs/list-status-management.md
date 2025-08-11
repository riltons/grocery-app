# Gerenciamento de Status de Listas

## Visão Geral

Implementação de um sistema completo de gerenciamento de status para listas de compras, incluindo finalização, bloqueio de edição e separação visual entre listas pendentes e finalizadas.

## Funcionalidades Implementadas

### 🏁 Status de Listas

#### Estados Possíveis
- **`pending`**: Lista ativa, pode ser editada
- **`finished`**: Lista finalizada, somente leitura

#### Migração de Banco
```sql
-- Adicionar coluna status
ALTER TABLE lists 
ADD COLUMN status VARCHAR(20) DEFAULT 'pending' 
CHECK (status IN ('pending', 'finished'));

-- Índice para performance
CREATE INDEX idx_lists_status ON lists(status);
```

### 🔒 Bloqueio de Edição

#### Listas Finalizadas
- **Interface bloqueada**: AddProductInterface não é exibido
- **Mensagem informativa**: Indica que a lista foi finalizada
- **Indicador visual**: Badge "Finalizada" no cabeçalho
- **Ações bloqueadas**: Todas as funções de edição verificam status

#### Verificações Implementadas
```typescript
const isListFinished = list?.status === 'finished';

// Exemplo de bloqueio
const handleAddProduct = async (productName: string, quantity: number, unit: string) => {
  if (isListFinished) {
    Alert.alert('Lista Finalizada', 'Esta lista foi finalizada e não pode mais ser editada.');
    return;
  }
  // ... resto da função
};
```

### 📱 Interface Adaptativa

#### Cabeçalho da Lista
- **Lista Pendente**: Mostra indicador de loja selecionada
- **Lista Finalizada**: Mostra badge "Finalizada" em verde
- **Botão de finalizar**: Sempre visível (permite finalizar listas pendentes)

#### Área de Adição
- **Lista Pendente**: AddProductInterface completo
- **Lista Finalizada**: Mensagem explicativa com ícone

### 🏠 Página Inicial Reformulada

#### Separação por Abas
- **Aba "Pendentes"**: Listas ativas com contador
- **Aba "Finalizadas"**: Listas concluídas com contador
- **Navegação intuitiva**: Toque para alternar entre abas

#### Estados Vazios Diferenciados
- **Pendentes vazias**: Incentiva criação de nova lista
- **Finalizadas vazias**: Explica como finalizar listas

### ⚙️ Botões de Ação

#### ListCard Melhorado
- **Modo visualização**: Seta para navegar (comportamento padrão)
- **Modo ação**: Botões de editar e excluir
- **Badge de status**: Indica listas finalizadas visualmente

#### Ações Disponíveis
- **Editar**: Modal para alterar nome da lista
- **Excluir**: Confirmação antes de remover permanentemente
- **Navegar**: Abrir lista para visualização/edição

## Serviços Implementados

### ListsService - Novas Funções

#### `markListAsFinished(listId: string)`
```typescript
// Marca uma lista como finalizada
const { data, error } = await ListsService.markListAsFinished(listId);
```

#### `getPendingLists()`
```typescript
// Busca apenas listas pendentes
const { data, error } = await ListsService.getPendingLists();
```

#### `getFinishedLists()`
```typescript
// Busca apenas listas finalizadas
const { data, error } = await ListsService.getFinishedLists();
```

#### `isListFinished(list: List)`
```typescript
// Verifica se uma lista está finalizada
const isFinished = ListsService.isListFinished(list);
```

## Componentes Criados

### EditListModal
- **Funcionalidade**: Editar nome de listas existentes
- **Validação**: Nome obrigatório, máximo 100 caracteres
- **Estados**: Loading durante salvamento
- **UX**: Foco automático no campo, botões responsivos

### ListCard Aprimorado
- **Props adicionais**: `showActions`, `onEdit`, `onDelete`
- **Layout flexível**: Adapta-se ao modo de exibição
- **Indicadores visuais**: Badge para listas finalizadas
- **Ações contextuais**: Botões de edição e exclusão

## Fluxos de Uso

### Finalização de Lista
1. **Usuário acessa lista pendente**
2. **Clica no botão de finalizar (✓✓)**
3. **Sistema marca como finalizada**
4. **Interface muda para modo somente leitura**
5. **Lista aparece na aba "Finalizadas"**

### Edição de Lista
1. **Usuário vai para página inicial**
2. **Vê botões de ação nos cards**
3. **Clica no botão de editar (✏️)**
4. **Modal abre com nome atual**
5. **Salva alterações**

### Exclusão de Lista
1. **Usuário clica no botão excluir (🗑️)**
2. **Confirmação com nome da lista**
3. **Sistema remove permanentemente**
4. **Lista desaparece da interface**

## Benefícios

### Para o Usuário
- **Organização clara**: Separação visual entre ativas e finalizadas
- **Proteção de dados**: Listas finalizadas não podem ser alteradas acidentalmente
- **Gestão completa**: Pode editar nomes e excluir listas desnecessárias
- **Feedback visual**: Sempre sabe o status de cada lista

### Para o Sistema
- **Integridade**: Dados históricos preservados
- **Performance**: Consultas otimizadas por status
- **Escalabilidade**: Estrutura preparada para mais estados
- **Manutenibilidade**: Código organizado e reutilizável

## Estados da Interface

### Lista Pendente
```
┌─────────────────────────────┐
│ [←] Lista de Compras    [✓✓]│
│     🏪 Loja Selecionada     │
└─────────────────────────────┘
│ [Adicionar Produto...]      │
│ ┌─────────────────────────┐ │
│ │ ☐ Produto 1             │ │
│ │ ☐ Produto 2             │ │
│ └─────────────────────────┘ │
```

### Lista Finalizada
```
┌─────────────────────────────┐
│ [←] Lista de Compras    [✓✓]│
│     ✅ Finalizada           │
└─────────────────────────────┘
│ ✅ Esta lista foi finalizada │
│    Não é possível fazer     │
│    mais alterações          │
│ ┌─────────────────────────┐ │
│ │ ☑ Produto 1             │ │
│ │ ☑ Produto 2             │ │
│ └─────────────────────────┘ │
```

### Página Inicial
```
┌─────────────────────────────┐
│ Minhas Listas          [☰] │
│ Olá, usuário               │
└─────────────────────────────┘
│ [Pendentes (2)] [Finalizadas (1)] │
│ ┌─────────────────────────┐ │
│ │ Lista 1            [✏️🗑️]│ │
│ │ Lista 2            [✏️🗑️]│ │
│ └─────────────────────────┘ │
│                        [+] │
```

## Considerações Técnicas

### Migração Segura
- **Coluna com default**: Listas existentes ficam como 'pending'
- **Constraint check**: Apenas valores válidos aceitos
- **Índice otimizado**: Consultas por status são rápidas

### Compatibilidade
- **Backward compatible**: Código antigo continua funcionando
- **Graceful degradation**: Se status for null, trata como pending
- **Type safety**: TypeScript garante tipos corretos

### Performance
- **Consultas separadas**: Pendentes e finalizadas buscadas independentemente
- **Índices apropriados**: Consultas por status otimizadas
- **Cache local**: Estados mantidos em memória durante navegação