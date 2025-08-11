# Persistência da Loja Selecionada

## Problema Identificado

A loja selecionada durante uma sessão de compras não persistia quando o usuário saía e voltava na lista. Isso causava uma experiência inconsistente, forçando o usuário a selecionar a loja novamente a cada vez que acessava a lista.

## Solução Implementada

### 1. Persistência com AsyncStorage
- **Chave única por lista**: `selectedStore_${listId}`
- **Armazenamento automático**: Loja é salva sempre que selecionada
- **Carregamento automático**: Loja é restaurada ao abrir a lista
- **Limpeza automática**: Loja é removida quando limpa

### 2. Funções de Persistência

#### `saveSelectedStore(store: Store | null)`
- Salva a loja selecionada no AsyncStorage
- Usa chave única baseada no ID da lista
- Remove a entrada se `store` for `null`

#### `loadSelectedStore()`
- Carrega a loja selecionada do AsyncStorage
- Restaura o estado `selectedStore`
- Executada automaticamente ao montar o componente

#### `clearSelectedStore()`
- Limpa a loja selecionada do estado e AsyncStorage
- Útil quando usuário quer trocar de loja

### 3. Melhorias na Interface

#### Botão de Limpar Loja
- Aparece no modal de seleção quando há loja selecionada
- Permite limpar a loja atual sem selecionar outra
- Interface intuitiva com ícone e texto explicativo

#### Indicador Persistente
- Loja selecionada aparece no cabeçalho
- Clicável para trocar de loja
- Mantém-se visível entre sessões

## Implementação Técnica

### Estados e Hooks
```typescript
const [selectedStore, setSelectedStore] = useState<Store | null>(null);

// Carrega loja ao montar componente
useEffect(() => {
  fetchListDetails();
  loadSuggestions();
  loadSelectedStore(); // Nova linha
}, [id]);
```

### Funções de Persistência
```typescript
const saveSelectedStore = async (store: Store | null) => {
  try {
    const key = `selectedStore_${id}`;
    if (store) {
      await AsyncStorage.setItem(key, JSON.stringify(store));
    } else {
      await AsyncStorage.removeItem(key);
    }
  } catch (error) {
    console.error('Erro ao salvar loja selecionada:', error);
  }
};

const loadSelectedStore = async () => {
  try {
    const key = `selectedStore_${id}`;
    const storedStore = await AsyncStorage.getItem(key);
    if (storedStore) {
      const store = JSON.parse(storedStore) as Store;
      setSelectedStore(store);
    }
  } catch (error) {
    console.error('Erro ao carregar loja selecionada:', error);
  }
};
```

### Integração com Seleção
```typescript
const handleStoreSelection = (store: Store) => {
  setSelectedStore(store);
  saveSelectedStore(store); // Salva automaticamente
  setStoreSelectionModalVisible(false);
  
  if (selectedItem) {
    setPriceModalVisible(true);
  }
};
```

## Benefícios

### Para o Usuário
- **Continuidade**: Loja permanece selecionada entre sessões
- **Eficiência**: Não precisa reselecionar a loja constantemente
- **Flexibilidade**: Pode trocar ou limpar a loja quando necessário
- **Feedback visual**: Sempre sabe qual loja está selecionada

### Para o Sistema
- **Consistência**: Dados persistem corretamente
- **Performance**: Carregamento rápido da loja salva
- **Manutenibilidade**: Código organizado e reutilizável
- **Escalabilidade**: Cada lista tem sua própria loja selecionada

## Casos de Uso

### Compra Contínua
1. Usuário seleciona loja A na lista de compras
2. Sai do app ou navega para outra tela
3. Volta na lista → loja A ainda está selecionada
4. Continua comprando sem reselecionar

### Múltiplas Listas
1. Lista 1: seleciona loja A
2. Lista 2: seleciona loja B
3. Volta na Lista 1 → loja A está selecionada
4. Volta na Lista 2 → loja B está selecionada

### Troca de Loja
1. Usuário está comprando na loja A
2. Decide trocar para loja B
3. Clica no indicador de loja no cabeçalho
4. Seleciona loja B → nova loja é salva automaticamente

### Limpeza de Loja
1. Usuário quer remover a loja selecionada
2. Clica no indicador de loja
3. Clica em "Limpar Loja"
4. Loja é removida e próximo produto perguntará a loja novamente

## Considerações Técnicas

### Chave de Armazenamento
- Formato: `selectedStore_${listId}`
- Garante que cada lista tenha sua própria loja
- Evita conflitos entre diferentes listas

### Tratamento de Erros
- Try/catch em todas as operações de AsyncStorage
- Logs de erro para debugging
- Falha silenciosa para não interromper o fluxo

### Limpeza de Dados
- Dados são removidos quando loja é limpa
- Não há acúmulo desnecessário de dados
- Chaves específicas por lista evitam conflitos

### Performance
- Operações assíncronas não bloqueiam a UI
- Carregamento rápido ao abrir a lista
- Salvamento automático sem impacto na experiência