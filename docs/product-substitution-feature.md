# Funcionalidade de Substituição de Produtos

## Visão Geral

A funcionalidade de substituição de produtos permite que os usuários substituam produtos genéricos por produtos específicos em suas listas de compras. Esta funcionalidade foi implementada para melhorar a experiência do usuário, permitindo um preenchimento rápido da lista com produtos genéricos e posterior refinamento com produtos específicos.

## Como Funciona

### 1. Produtos Genéricos vs Específicos

**Produtos Genéricos:**
- Servem como ferramentas de preenchimento rápido da lista
- Contêm apenas nome e categoria básica
- Não possuem marca, código de barras ou histórico de preços
- Ideais para planejamento inicial da lista

**Produtos Específicos:**
- Contêm informações detalhadas (marca, código de barras, preços)
- Vinculados a um produto genérico (relação many-to-one)
- Permitem rastreamento de preços e comparação entre lojas
- Ideais para compras precisas

### 2. Fluxo de Uso

1. **Criação Rápida da Lista:**
   - Usuário adiciona produtos genéricos rapidamente
   - Lista é preenchida com itens básicos como "Arroz", "Leite", "Pão"

2. **Refinamento da Lista:**
   - Durante a edição da lista, usuário pode substituir produtos genéricos
   - Botão de substituição (ícone de troca) aparece apenas em produtos genéricos
   - Modal mostra produtos específicos disponíveis para aquele genérico

3. **Substituição:**
   - Usuário seleciona um produto específico da lista
   - Sistema atualiza o item da lista com as informações detalhadas
   - Produto deixa de ser genérico e ganha funcionalidades avançadas

### 3. Indicadores Visuais

- **Badge "Genérico":** Produtos genéricos exibem um badge laranja
- **Botão de Substituição:** Ícone de troca (swap-horizontal) em produtos genéricos
- **Informações Detalhadas:** Produtos específicos mostram marca, código de barras, etc.

## Implementação Técnica

### Componentes Principais

1. **ProductSubstitutionModal:** Modal para seleção de produto específico
2. **Lista de Itens:** Atualizada para mostrar indicadores e botões de substituição
3. **Serviços:** Funções para buscar e atualizar relações entre produtos

### Estrutura de Dados

```typescript
type ListItem = {
  id: string;
  product_name: string;
  product_id?: string; // ID do produto específico (se houver)
  generic_product_id?: string; // ID do produto genérico
  is_generic?: boolean; // Indica se é genérico
  // ... outros campos
};
```

### Fluxo de Substituição

1. Usuário clica no botão de substituição
2. Sistema busca o produto genérico associado
3. Modal carrega produtos específicos vinculados ao genérico
4. Usuário seleciona produto específico
5. Sistema atualiza a relação na tabela `list_item_products`
6. Interface é atualizada com as novas informações

## Benefícios

1. **Velocidade:** Preenchimento rápido inicial com produtos genéricos
2. **Precisão:** Refinamento posterior com produtos específicos
3. **Flexibilidade:** Usuário escolhe o nível de detalhe desejado
4. **Organização:** Hierarquia clara entre genérico e específico
5. **Funcionalidades:** Produtos específicos desbloqueiam recursos avançados

## Casos de Uso

### Planejamento Semanal
- Usuário cria lista rapidamente com produtos genéricos
- Durante a semana, refina itens importantes com produtos específicos
- Mantém itens básicos como genéricos para flexibilidade

### Comparação de Preços
- Produtos genéricos para itens onde marca não importa
- Produtos específicos para itens com preferência de marca
- Histórico de preços apenas para produtos específicos

### Compartilhamento de Listas
- Lista genérica pode ser compartilhada facilmente
- Cada usuário pode personalizar com seus produtos específicos preferidos

## Próximos Passos

1. **Criação de Produtos Específicos:** Implementar criação direta no modal
2. **Sugestões Inteligentes:** IA para sugerir produtos específicos baseado no histórico
3. **Importação de Listas:** Converter listas genéricas em específicas automaticamente
4. **Analytics:** Métricas sobre uso de produtos genéricos vs específicos