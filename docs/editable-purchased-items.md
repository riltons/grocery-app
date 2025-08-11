# Funcionalidade de Edição de Itens Comprados

## Visão Geral

Esta funcionalidade permite aos usuários editar tanto a quantidade quanto o preço dos produtos após marcá-los como comprados, proporcionando maior flexibilidade durante as compras.

## Funcionalidades Implementadas

### 1. Edição de Quantidade no Modal de Preço
- Ao marcar um produto como comprado, o modal de preço agora inclui controles para ajustar a quantidade
- Usuário pode aumentar/diminuir a quantidade antes de confirmar a compra
- A quantidade é atualizada junto com o preço no banco de dados

### 2. Edição de Itens Comprados
- Produtos já marcados como comprados podem ser editados clicando na quantidade ou no preço
- Interface visual diferenciada para itens comprados:
  - Quantidade exibida em um container verde com ícone de edição
  - Preço exibido em um container verde com ícone de edição
- Modal de edição permite alterar tanto quantidade quanto preço

### 3. Interface Melhorada
- **Itens Pendentes**: Mantêm os controles de quantidade tradicionais (+ e -)
- **Itens Comprados**: Exibem quantidade e preço como botões editáveis
- Indicadores visuais claros para elementos editáveis
- Feedback visual consistente com o design do app

## Componentes Modificados

### PriceInputModal
- **Nova prop**: `onConfirm` agora recebe `(price: number, quantity: number)`
- **Controles de quantidade**: Botões + e - para ajustar quantidade
- **Layout melhorado**: Seção dedicada para quantidade antes do preço
- **Validação**: Impede quantidade menor que 1

### PriceEditModal
- **Nova prop**: `onConfirm` agora recebe `(price: number | null, quantity: number)`
- **Controles de quantidade**: Botões + e - para ajustar quantidade
- **Cálculo dinâmico**: Total atualizado automaticamente com mudanças
- **Funcionalidade completa**: Permite editar, remover preço e alterar quantidade

### Lista de Compras (app/list/[id].tsx)
- **Renderização condicional**: Interface diferente para itens comprados vs pendentes
- **Funções atualizadas**: Todas as funções de confirmação agora lidam com quantidade
- **Integração com histórico**: Preços editados são salvos no histórico quando aplicável

## Fluxo de Uso

### Marcando Produto como Comprado
1. Usuário clica no checkbox do produto
2. Se é o primeiro produto, seleciona a loja
3. Modal de preço aparece com:
   - Controles de quantidade (padrão: quantidade atual)
   - Campo de preço (opcional)
4. Usuário pode ajustar quantidade e/ou preço
5. Confirma e o produto é marcado como comprado

### Editando Produto Comprado
1. Usuário clica na quantidade ou preço de um item comprado
2. Modal de edição aparece com:
   - Controles de quantidade (valor atual)
   - Campo de preço (valor atual ou vazio)
   - Opção de remover preço
3. Usuário faz as alterações desejadas
4. Confirma e as mudanças são salvas

## Benefícios

### Para o Usuário
- **Flexibilidade**: Pode corrigir quantidade ou preço após marcar como comprado
- **Precisão**: Não precisa desmarcar e remarcar para fazer ajustes
- **Eficiência**: Interface intuitiva com indicadores visuais claros
- **Controle**: Pode remover preços se necessário

### Para o Sistema
- **Consistência**: Todas as operações mantêm integridade dos dados
- **Histórico**: Preços editados são salvos no histórico para análise futura
- **Flexibilidade**: Suporte a diferentes cenários de uso
- **Manutenibilidade**: Código organizado e reutilizável

## Casos de Uso

### Correção Durante Compras
- Usuário marca produto como comprado com quantidade errada
- Clica na quantidade e corrige sem desmarcar o item
- Preço total é recalculado automaticamente

### Ajuste de Preço Posterior
- Usuário marca produto sem informar preço
- Depois da compra, clica no preço e adiciona o valor correto
- Preço é salvo no histórico para uso futuro

### Compra de Quantidade Diferente
- Lista tinha 2 unidades, mas usuário comprou 3
- Clica na quantidade e ajusta para 3
- Total da compra é atualizado automaticamente

## Implementação Técnica

### Estados Modificados
- Modais agora lidam com quantidade além do preço
- Funções de confirmação recebem parâmetros adicionais
- Renderização condicional baseada no status do item

### Validações
- Quantidade mínima: 1
- Preço mínimo: 0 (pode ser nulo)
- Validação de tipos numéricos

### Integração
- Histórico de preços mantido
- Totais recalculados automaticamente
- Interface responsiva e acessível