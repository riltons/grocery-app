# Sistema de Histórico de Sessões

## Visão Geral

O sistema de histórico de sessões permite que os usuários consultem posteriormente as pesquisas de preços finalizadas, mantendo um registro completo de todas as atividades de pesquisa por loja.

## Funcionalidades Implementadas

### 1. Finalização de Sessão com Link
- **Modal de Confirmação**: Após finalizar uma pesquisa, o usuário vê um modal com opções
- **Link Direto**: Botão "Ver Resumo" leva diretamente para os detalhes da sessão
- **Toast Informativo**: Notificação com informações sobre a sessão finalizada

### 2. Página de Detalhes da Sessão (`/stores/session/[sessionId]`)
- **Informações Completas**: Data, hora, loja, endereço
- **Lista de Produtos**: Todos os produtos escaneados com preços
- **Estatísticas**: Total de produtos, produtos com preço, valor total, preço médio
- **Compartilhamento**: Função para compartilhar o resumo da pesquisa
- **Imagens**: Exibição das imagens dos produtos

### 3. Histórico de Sessões por Loja (`/stores/sessions/[storeId]`)
- **Lista Cronológica**: Todas as sessões da loja ordenadas por data
- **Estatísticas Rápidas**: Número de produtos e valor total por sessão
- **Status Visual**: Diferenciação entre sessões ativas e finalizadas
- **Navegação Fácil**: Toque para acessar detalhes de qualquer sessão

### 4. Integração na Página da Loja
- **Botão "Ver Histórico"**: Acesso direto ao histórico de sessões
- **Design Consistente**: Integração visual com o resto da aplicação

## Estrutura de Navegação

```
Loja → Ver Histórico → Lista de Sessões → Detalhes da Sessão
  ↓
Pesquisa de Preços → Finalizar → Modal → Ver Resumo → Detalhes da Sessão
```

## Rotas Implementadas

### `/stores/session/[sessionId]`
**Parâmetros**: `sessionId` - ID da sessão a ser visualizada
**Funcionalidades**:
- Exibição completa dos dados da sessão
- Lista de produtos com imagens e preços
- Estatísticas detalhadas
- Função de compartilhamento
- Navegação de volta

### `/stores/sessions/[storeId]`
**Parâmetros**: `storeId` - ID da loja para listar sessões
**Funcionalidades**:
- Lista de todas as sessões da loja
- Estatísticas resumidas por sessão
- Ordenação cronológica
- Pull-to-refresh
- Navegação para detalhes

## Componentes Criados

### SessionDetailScreen
- **Localização**: `app/stores/session/[sessionId].tsx`
- **Responsabilidade**: Exibir detalhes completos de uma sessão
- **Funcionalidades**: Visualização, estatísticas, compartilhamento

### StoreSessionsScreen
- **Localização**: `app/stores/sessions/[storeId].tsx`
- **Responsabilidade**: Listar histórico de sessões de uma loja
- **Funcionalidades**: Lista, filtros, navegação

### Modal de Sessão Finalizada
- **Localização**: Integrado em `app/stores/price-search.tsx`
- **Responsabilidade**: Confirmar finalização e oferecer navegação
- **Funcionalidades**: Confirmação visual, navegação direta

## Fluxo do Usuário

### 1. Finalização de Pesquisa
```
Pesquisa de Preços → Finalizar → Modal de Confirmação
                                      ↓
                              [Continuar] [Ver Resumo]
                                      ↓
                              Detalhes da Sessão
```

### 2. Consulta Posterior
```
Loja → Ver Histórico → Lista de Sessões → Selecionar Sessão → Detalhes
```

### 3. Compartilhamento
```
Detalhes da Sessão → Compartilhar → Apps do Sistema
```

## Dados Exibidos

### Na Lista de Sessões
- **Nome da Sessão**: Gerado automaticamente ou personalizado
- **Data e Hora**: Quando a sessão foi criada
- **Estatísticas**: Número de produtos, produtos com preço
- **Valor Total**: Soma de todos os preços informados
- **Status**: Ativa ou finalizada

### Nos Detalhes da Sessão
- **Informações da Sessão**: Nome, data, hora, loja
- **Endereço da Loja**: Se disponível
- **Resumo Estatístico**: Produtos, preços, total, média
- **Lista Completa**: Todos os produtos com imagens, preços, códigos
- **Timestamps**: Quando cada produto foi escaneado

## Funcionalidade de Compartilhamento

### Formato do Texto Compartilhado
```
📋 [Nome da Sessão]
🏪 [Nome da Loja]
📅 [Data da Pesquisa]

📦 Produtos ([Quantidade]):
• [Produto 1] - [Marca]: R$ [Preço]
• [Produto 2] - [Marca]: R$ [Preço]
...

💰 Total: R$ [Valor Total]

Criado com o app de Lista de Compras
```

### Plataformas Suportadas
- WhatsApp
- Email
- SMS
- Outras apps de compartilhamento do sistema

## Estados Visuais

### Ícones por Status
- **Sessão Ativa**: `time-outline` (laranja)
- **Sessão Finalizada**: `receipt-outline` (verde)
- **Produto com Preço**: Valor em verde
- **Produto sem Preço**: "Sem preço" em cinza

### Cores e Temas
- **Verde (#4CAF50)**: Valores, botões primários, status positivo
- **Laranja (#f59e0b)**: Sessões em andamento
- **Cinza (#64748b)**: Informações secundárias
- **Vermelho (#f44336)**: Erros (se houver)

## Performance e Otimizações

### Carregamento de Dados
- **Lazy Loading**: Estatísticas carregadas sob demanda
- **Cache Local**: Dados mantidos em estado durante navegação
- **Pull-to-Refresh**: Atualização manual disponível

### Limitações
- **Máximo de Sessões**: 50 por loja (configurável)
- **Timeout de Carregamento**: 10 segundos para operações
- **Imagens**: Cache automático do React Native

## Tratamento de Erros

### Cenários Cobertos
- **Sessão não encontrada**: Tela de erro com botão voltar
- **Erro de rede**: Toast com mensagem de erro
- **Dados corrompidos**: Fallback para valores padrão
- **Permissões**: Verificação de acesso do usuário

### Mensagens de Erro
- **Genéricas**: "Ocorreu um erro ao carregar..."
- **Específicas**: "Sessão não encontrada"
- **Ações**: Sempre oferecer uma ação (voltar, tentar novamente)

## Melhorias Futuras

### Funcionalidades Planejadas
- [ ] Filtros por data no histórico
- [ ] Busca por produto nas sessões
- [ ] Exportação para PDF/Excel
- [ ] Comparação entre sessões
- [ ] Gráficos de evolução de preços
- [ ] Notificações de variação de preços

### Otimizações Técnicas
- [ ] Paginação no histórico de sessões
- [ ] Cache mais inteligente
- [ ] Compressão de dados para compartilhamento
- [ ] Sincronização offline

## Exemplos de Uso

### Compartilhamento de Sessão
```typescript
const shareText = `📋 Pesquisa 15/01/2024
🏪 Supermercado ABC
📅 15/01/2024

📦 Produtos (5):
• Coca-Cola 350ml - Coca-Cola: R$ 3,50
• Pão de Açúcar - Wickbold: R$ 4,20
• Leite Integral - Parmalat: R$ 4,80
• Arroz Branco - Tio João: R$ 18,90
• Feijão Preto - Camil: R$ 7,60

💰 Total: R$ 39,00

Criado com o app de Lista de Compras`;
```

### Navegação Programática
```typescript
// Para detalhes de uma sessão
router.push(`/stores/session/${sessionId}`);

// Para histórico de uma loja
router.push(`/stores/sessions/${storeId}`);
```

## Testes Recomendados

### Cenários de Teste
1. **Finalizar sessão com produtos**: Verificar modal e navegação
2. **Finalizar sessão sem preços**: Verificar validação
3. **Visualizar sessão antiga**: Verificar dados e formatação
4. **Compartilhar sessão**: Verificar formato do texto
5. **Histórico vazio**: Verificar tela de estado vazio
6. **Erro de rede**: Verificar tratamento de erros

### Dados de Teste
- Criar sessões com diferentes quantidades de produtos
- Testar com produtos com e sem imagens
- Testar com diferentes valores de preços
- Testar compartilhamento em diferentes apps

O sistema de histórico de sessões está completo e pronto para uso, oferecendo uma experiência completa de consulta posterior às pesquisas de preços realizadas! 📋✨