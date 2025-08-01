# Implementation Plan

- [-] 1. Executar migração do banco de dados para adicionar coluna price

  - Criar e executar migração SQL para adicionar coluna price DECIMAL(10,2) NULL na tabela list_items
  - Criar índice para performance em consultas de preço
  - Verificar que a migração foi aplicada corretamente
  - _Requirements: 3.1, 3.2, 3.3_



- [ ] 2. Atualizar tipos TypeScript para incluir price
  - Modificar tipo ListItem em lib/supabase.ts para incluir propriedade price opcional
  - Atualizar interfaces relacionadas que usam ListItem
  - Verificar que não há erros de TypeScript no projeto



  - _Requirements: 3.4_

- [ ] 3. Atualizar ListsService para persistir preços
  - Modificar método updateListItem para aceitar e salvar campo price


  - Atualizar método getListItems para retornar preços salvos
  - Adicionar validação de preço no service layer
  - Escrever testes unitários para as operações de preço
  - _Requirements: 1.1, 1.3, 4.2_



- [ ] 4. Modificar componente de lista para exibir preços persistidos
  - Atualizar app/list/[id].tsx para usar preços do banco de dados
  - Modificar função handleConfirmPurchase para salvar preço no banco
  - Atualizar função handleToggleItem para remover preço ao desmarcar
  - Garantir que o cálculo do total use preços persistidos
  - _Requirements: 1.1, 1.2, 1.4_

- [ ] 5. Implementar funcionalidade de edição de preços
  - Criar componente PriceEditModal para editar preços de produtos comprados
  - Adicionar funcionalidade de toque em produto comprado para editar preço
  - Implementar lógica para atualizar preço no banco de dados
  - Adicionar validação de entrada de preço
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 6. Adicionar tratamento de erros e validações
  - Implementar validação de preço (não negativo, máximo 999999.99)
  - Adicionar tratamento de erros de rede ao salvar preços
  - Implementar fallback behavior quando preços não podem ser carregados
  - Adicionar feedback visual para operações de preço
  - _Requirements: 1.1, 2.2_

- [ ] 7. Testar compatibilidade com listas existentes
  - Verificar que listas criadas antes da migração funcionam corretamente
  - Testar adição de preços a itens existentes sem preço
  - Verificar que o cálculo de total funciona com mix de itens com e sem preço
  - Testar cenários de carregamento de listas antigas
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 8. Implementar testes de integração
  - Criar testes end-to-end para fluxo completo de adicionar preço
  - Testar persistência de preços após fechar e reabrir app
  - Testar edição de preços existentes
  - Verificar cálculo correto de totais com múltiplos itens
  - _Requirements: 1.1, 1.2, 2.1, 2.2_