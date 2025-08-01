# Requirements Document

## Introduction

O sistema atual permite que o usuário insira preços ao marcar produtos como comprados na lista de compras, mas esses preços não estão sendo persistidos no banco de dados. Quando o usuário fecha e reabre a lista, os preços são perdidos. Esta funcionalidade é essencial para que o usuário possa acompanhar seus gastos e ter um histórico de preços dos produtos.

## Requirements

### Requirement 1

**User Story:** Como usuário, eu quero que os preços dos produtos que marco como comprados sejam salvos permanentemente, para que eu possa ver o valor total gasto mesmo depois de fechar e reabrir a lista.

#### Acceptance Criteria

1. WHEN o usuário marca um produto como comprado e informa um preço THEN o sistema SHALL salvar o preço no banco de dados
2. WHEN o usuário reabre uma lista de compras THEN o sistema SHALL exibir os preços salvos dos produtos comprados
3. WHEN o usuário visualiza o total da lista THEN o sistema SHALL calcular corretamente baseado nos preços persistidos
4. WHEN o usuário desmarca um produto comprado THEN o sistema SHALL remover o preço salvo do banco de dados

### Requirement 2

**User Story:** Como usuário, eu quero poder editar o preço de um produto já comprado, para que eu possa corrigir valores inseridos incorretamente.

#### Acceptance Criteria

1. WHEN o usuário toca em um produto comprado que tem preço THEN o sistema SHALL permitir editar o preço
2. WHEN o usuário salva um novo preço THEN o sistema SHALL atualizar o valor no banco de dados
3. WHEN o usuário cancela a edição THEN o sistema SHALL manter o preço original

### Requirement 3

**User Story:** Como desenvolvedor, eu quero que a estrutura do banco de dados suporte o armazenamento de preços nos itens da lista, para que os dados sejam persistidos corretamente.

#### Acceptance Criteria

1. WHEN a migração é executada THEN a tabela list_items SHALL ter uma coluna price do tipo DECIMAL
2. WHEN um item é criado sem preço THEN a coluna price SHALL aceitar valores NULL
3. WHEN um preço é salvo THEN o valor SHALL ser armazenado com precisão de 2 casas decimais
4. WHEN os tipos TypeScript são atualizados THEN eles SHALL refletir a nova estrutura da tabela

### Requirement 4

**User Story:** Como usuário, eu quero que o sistema mantenha compatibilidade com listas existentes, para que minhas listas atuais continuem funcionando normalmente após a atualização.

#### Acceptance Criteria

1. WHEN a migração é aplicada THEN as listas existentes SHALL continuar funcionando
2. WHEN itens existentes são carregados THEN eles SHALL funcionar mesmo sem preços salvos
3. WHEN novos preços são adicionados a itens antigos THEN eles SHALL ser salvos corretamente