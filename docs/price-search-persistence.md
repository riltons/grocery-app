# Sistema de Persistência - Pesquisa de Preços

## Visão Geral

O sistema de pesquisa de preços agora possui persistência completa, permitindo que os usuários mantenham suas listas de produtos escaneados mesmo após sair e retornar à aplicação.

## Conceitos Principais

### Sessões de Pesquisa
- **Uma sessão ativa por loja/usuário**: Cada usuário pode ter apenas uma sessão ativa por loja
- **Persistência automática**: Todos os produtos escaneados são salvos automaticamente
- **Recuperação de sessão**: Ao retornar à loja, a sessão anterior é recuperada
- **Finalização opcional**: Usuário pode finalizar a sessão para salvar preços no histórico

### Estados da Sessão
1. **Ativa**: Sessão em andamento, produtos podem ser adicionados/removidos
2. **Finalizada**: Preços salvos no histórico, sessão marcada como inativa
3. **Limpa**: Todos os itens removidos, mas sessão continua ativa

## Fluxo de Dados

### 1. Início da Pesquisa
```
Usuário acessa pesquisa de preços
↓
Sistema verifica se existe sessão ativa
↓
Se existe: Carrega sessão e itens
Se não existe: Cria nova sessão
↓
Exibe lista de produtos (vazia ou com itens anteriores)
```

### 2. Escaneamento de Produto
```
Produto escaneado
↓
Sistema verifica se produto existe
↓
Se não existe: Cria produto automaticamente
↓
Adiciona item à sessão no banco de dados
↓
Atualiza lista local
↓
Abre modal para entrada de preço
```

### 3. Entrada de Preço
```
Usuário informa preço
↓
Atualiza item na sessão (banco)
↓
Salva preço no histórico
↓
Atualiza lista local
```

### 4. Finalização da Sessão
```
Usuário clica "Finalizar"
↓
Sistema coleta todos os itens com preço
↓
Salva preços no histórico (se ainda não salvos)
↓
Marca sessão como inativa
↓
Cria nova sessão ativa
↓
Limpa lista local
```

## Estrutura do Banco de Dados

### Tabela `price_search_sessions`
```sql
CREATE TABLE price_search_sessions (
  id UUID PRIMARY KEY,
  store_id UUID REFERENCES stores(id),
  name VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  user_id UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true
);
```

**Campos:**
- `id`: Identificador único da sessão
- `store_id`: Loja associada à sessão
- `name`: Nome da sessão (ex: "Pesquisa 15/01/2024")
- `is_active`: Apenas uma sessão ativa por loja/usuário
- `updated_at`: Atualizado a cada modificação

### Tabela `price_search_items`
```sql
CREATE TABLE price_search_items (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES price_search_sessions(id),
  specific_product_id UUID REFERENCES specific_products(id),
  price DECIMAL(10,2),
  scanned BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  user_id UUID REFERENCES auth.users(id)
);
```

**Campos:**
- `session_id`: Sessão à qual o item pertence
- `specific_product_id`: Produto escaneado
- `price`: Preço informado (pode ser null)
- `scanned`: Se foi escaneado ou adicionado manualmente

## Serviços Implementados

### PriceSearchService (`lib/priceSearch.ts`)

#### Gerenciamento de Sessões
```typescript
// Criar nova sessão
createSession(storeId: string, name?: string)

// Buscar sessão ativa
getActiveSession(storeId: string)

// Buscar todas as sessões de uma loja
getStoreSessions(storeId: string, limit?: number)
```

#### Gerenciamento de Itens
```typescript
// Adicionar produto à sessão
addItemToSession(sessionId: string, productId: string, scanned: boolean)

// Atualizar preço do item
updateItemPrice(itemId: string, price: number)

// Remover item da sessão
removeItemFromSession(itemId: string)

// Buscar itens da sessão
getSessionItems(sessionId: string)
```

#### Operações de Sessão
```typescript
// Finalizar sessão (salvar no histórico)
finalizeSession(sessionId: string)

// Limpar sessão (remover todos os itens)
clearSession(sessionId: string)

// Excluir sessão completamente
deleteSession(sessionId: string)
```

## Integração com Interface

### Componente PriceSearchScreen

#### Estado Local
```typescript
const [currentSession, setCurrentSession] = useState<PriceSearchSession | null>(null);
const [priceList, setPriceList] = useState<PriceListItem[]>([]);
```

#### Carregamento Inicial
```typescript
// Ao carregar a tela
loadStoreData() {
  // 1. Carregar dados da loja
  // 2. Buscar sessão ativa ou criar nova
  // 3. Carregar itens da sessão
  // 4. Atualizar estado local
}
```

#### Sincronização
- **Adição de produto**: Salva no banco → Atualiza estado local
- **Atualização de preço**: Salva no banco → Atualiza estado local
- **Remoção de item**: Remove do banco → Atualiza estado local

## Benefícios da Persistência

### Para o Usuário
- **Continuidade**: Lista não se perde ao sair da tela
- **Flexibilidade**: Pode pausar e retomar a pesquisa
- **Histórico**: Sessões anteriores ficam disponíveis
- **Confiabilidade**: Dados não se perdem por falhas

### Para o Sistema
- **Dados estruturados**: Informações organizadas no banco
- **Auditoria**: Histórico completo de ações
- **Performance**: Carregamento otimizado
- **Escalabilidade**: Suporte a múltiplas sessões

## Casos de Uso

### 1. Pesquisa Interrompida
```
Usuário inicia pesquisa → Escaneia alguns produtos → Sai do app
↓
Retorna ao app → Acessa mesma loja → Lista anterior é recuperada
```

### 2. Múltiplas Visitas
```
Usuário finaliza sessão → Preços salvos no histórico
↓
Nova visita à loja → Nova sessão criada → Lista limpa
```

### 3. Comparação de Preços
```
Usuário pesquisa em Loja A → Finaliza sessão
↓
Pesquisa em Loja B → Compara preços no histórico
```

## Configurações e Otimizações

### Limpeza Automática
```sql
-- Função para limpar sessões antigas
CREATE FUNCTION cleanup_old_sessions() AS $$
BEGIN
    -- Inativar sessões com +7 dias sem atualização
    UPDATE price_search_sessions 
    SET is_active = false 
    WHERE updated_at < NOW() - INTERVAL '7 days';
    
    -- Deletar sessões inativas com +30 dias
    DELETE FROM price_search_sessions 
    WHERE is_active = false 
    AND updated_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;
```

### Índices para Performance
```sql
-- Índices otimizados
CREATE INDEX idx_price_search_sessions_store_user ON price_search_sessions(store_id, user_id);
CREATE INDEX idx_price_search_sessions_active ON price_search_sessions(user_id, is_active);
CREATE INDEX idx_price_search_items_session ON price_search_items(session_id);
```

### Row Level Security (RLS)
```sql
-- Políticas de segurança
CREATE POLICY "Users can view their own sessions" ON price_search_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own items" ON price_search_items
    FOR SELECT USING (auth.uid() = user_id);
```

## Monitoramento e Métricas

### Métricas Úteis
- Número de sessões ativas por usuário
- Tempo médio de duração das sessões
- Produtos mais escaneados
- Taxa de finalização de sessões

### Queries de Monitoramento
```sql
-- Sessões ativas por usuário
SELECT user_id, COUNT(*) as active_sessions
FROM price_search_sessions 
WHERE is_active = true 
GROUP BY user_id;

-- Produtos mais escaneados
SELECT sp.name, COUNT(*) as scan_count
FROM price_search_items psi
JOIN specific_products sp ON psi.specific_product_id = sp.id
GROUP BY sp.id, sp.name
ORDER BY scan_count DESC;
```

## Troubleshooting

### Problemas Comuns

#### Sessão não carrega
- Verificar se usuário está autenticado
- Verificar políticas RLS
- Verificar se store_id é válido

#### Itens duplicados
- Constraint UNIQUE previne duplicatas
- Verificar lógica de verificação antes da inserção

#### Performance lenta
- Verificar índices
- Otimizar queries com LIMIT
- Implementar paginação se necessário

### Logs Úteis
```typescript
console.log('Sessão carregada:', session);
console.log('Itens da sessão:', items.length);
console.log('Produto adicionado:', productId);
```

## Próximos Passos

### Melhorias Planejadas
- [ ] Sincronização offline
- [ ] Backup automático de sessões
- [ ] Compartilhamento de sessões entre usuários
- [ ] Histórico detalhado de modificações
- [ ] Exportação de sessões
- [ ] Templates de sessões frequentes