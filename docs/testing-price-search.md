# Testando a Funcionalidade de Pesquisa de Preços

## Pré-requisitos

1. Aplicativo instalado e funcionando
2. Usuário autenticado
3. Permissão de câmera concedida
4. Conexão com internet para APIs externas

## Cenários de Teste

### 1. Criação de Loja

**Objetivo**: Verificar se o usuário consegue criar uma nova loja

**Passos**:
1. Na tela inicial, toque no ícone de loja (storefront)
2. Toque no botão "+" no canto superior direito
3. Preencha o nome da loja (ex: "Supermercado Teste")
4. Opcionalmente, preencha o endereço
5. Toque em "Salvar"

**Resultado Esperado**:
- Loja criada com sucesso
- Mensagem de confirmação exibida
- Loja aparece na lista de lojas

### 2. Acesso à Pesquisa de Preços

**Objetivo**: Verificar navegação para a tela de pesquisa de preços

**Passos**:
1. Na lista de lojas, toque em uma loja
2. Na tela de detalhes, toque em "Pesquisar Preços"

**Resultado Esperado**:
- Tela de pesquisa de preços é aberta
- Nome da loja aparece no cabeçalho
- Botão "Escanear Produto" está visível

### 3. Escaneamento de Produto Existente

**Objetivo**: Testar escaneamento de produto já cadastrado

**Códigos de Teste**:
- `7891000100103` (Coca-Cola 350ml)
- `7891000053508` (Guaraná Antarctica 350ml)
- `7891000315507` (Fanta Laranja 350ml)

**Passos**:
1. Toque em "Escanear Produto"
2. Aponte a câmera para um código de barras conhecido
3. Aguarde o reconhecimento automático

**Resultado Esperado**:
- Produto é reconhecido automaticamente
- Se já existe no banco: é adicionado à lista e modal de preço abre
- Se não existe: produto é criado e modal de preço abre

### 4. Entrada de Preço

**Objetivo**: Verificar funcionalidade de entrada de preços

**Passos**:
1. Após escanear um produto, o modal de preço deve abrir
2. Digite um preço (ex: "3,50")
3. Toque em "Confirmar"

**Resultado Esperado**:
- Preço é salvo no histórico
- Produto aparece na lista com o preço informado
- Total da lista é atualizado

### 5. Produto Não Encontrado

**Objetivo**: Testar comportamento com códigos desconhecidos

**Códigos de Teste** (códigos fictícios):
- `1234567890123`
- `9876543210987`

**Passos**:
1. Escaneie um código de barras fictício
2. Sistema deve buscar nas APIs externas
3. Se não encontrado, deve criar produto básico

**Resultado Esperado**:
- Produto é criado com nome genérico
- Modal de preço é aberto
- Usuário pode informar o preço

### 6. Edição de Preço

**Objetivo**: Verificar se é possível editar preços já informados

**Passos**:
1. Na lista de produtos escaneados, toque no preço de um produto
2. Altere o valor no modal
3. Toque em "Atualizar"

**Resultado Esperado**:
- Preço é atualizado na lista
- Total da lista é recalculado
- Histórico de preços é atualizado

### 7. Remoção de Produto

**Objetivo**: Verificar remoção de produtos da lista

**Passos**:
1. Na lista de produtos, toque no ícone de lixeira
2. Confirme a remoção

**Resultado Esperado**:
- Produto é removido da lista
- Total é recalculado
- Lista é atualizada

### 8. Visualização de Estatísticas

**Objetivo**: Verificar cálculo de estatísticas da loja

**Passos**:
1. Após registrar alguns preços, volte para a tela de detalhes da loja
2. Verifique as estatísticas exibidas

**Resultado Esperado**:
- Número correto de produtos
- Total gasto calculado corretamente
- Preço médio calculado corretamente
- Data da última visita atualizada

## Códigos de Barras para Teste

### Produtos Reais (podem ser encontrados nas APIs)
```
7891000100103 - Coca-Cola 350ml
7891000053508 - Guaraná Antarctica 350ml  
7891000315507 - Fanta Laranja 350ml
7891000244203 - Sprite 350ml
7891000100110 - Coca-Cola 600ml
7891118000104 - Leite Ninho 400g
7891000100127 - Coca-Cola 2L
7891000053515 - Guaraná Antarctica 600ml
7891000315514 - Fanta Laranja 600ml
7891000244210 - Sprite 600ml
```

### Códigos Fictícios (para testar criação manual)
```
1234567890123
9876543210987
1111111111111
2222222222222
3333333333333
```

## Verificações de Qualidade

### Interface
- [ ] Botões respondem ao toque
- [ ] Textos estão legíveis
- [ ] Ícones estão corretos
- [ ] Cores seguem o padrão do app
- [ ] Loading states funcionam

### Funcionalidade
- [ ] Scanner reconhece códigos corretamente
- [ ] Produtos são criados automaticamente
- [ ] Preços são salvos corretamente
- [ ] Cálculos estão corretos
- [ ] Navegação funciona

### Performance
- [ ] Scanner inicia rapidamente
- [ ] Busca em APIs não trava a interface
- [ ] Listas grandes carregam suavemente
- [ ] Não há vazamentos de memória

### Tratamento de Erros
- [ ] Erro de câmera é tratado
- [ ] Erro de rede é tratado
- [ ] Códigos inválidos são tratados
- [ ] Mensagens de erro são claras

## Problemas Conhecidos e Soluções

### Scanner não funciona
**Problema**: Câmera não abre ou não reconhece códigos
**Solução**: Verificar permissões de câmera nas configurações do dispositivo

### Produto não encontrado
**Problema**: APIs externas não retornam dados
**Solução**: Sistema cria produto básico para preenchimento manual

### Preços não salvam
**Problema**: Erro ao salvar no banco de dados
**Solução**: Verificar conexão com internet e autenticação

### Performance lenta
**Problema**: App fica lento com muitos produtos
**Solução**: Implementar paginação e lazy loading

## Relatório de Teste

### Template de Relatório
```
Data do Teste: ___________
Testador: _______________
Dispositivo: ____________
Versão do App: __________

Cenários Testados:
[ ] Criação de loja
[ ] Acesso à pesquisa de preços  
[ ] Escaneamento de produto existente
[ ] Entrada de preço
[ ] Produto não encontrado
[ ] Edição de preço
[ ] Remoção de produto
[ ] Visualização de estatísticas

Problemas Encontrados:
1. ________________________
2. ________________________
3. ________________________

Sugestões de Melhoria:
1. ________________________
2. ________________________
3. ________________________

Status Geral: [ ] Aprovado [ ] Reprovado [ ] Aprovado com ressalvas
```

## Automação de Testes

### Testes Unitários
```typescript
// Exemplo de teste para StoreService
describe('StoreService', () => {
  test('should create store successfully', async () => {
    const storeData = {
      name: 'Test Store',
      address: 'Test Address'
    };
    
    const result = await StoreService.createStore(storeData);
    
    expect(result.data).toBeDefined();
    expect(result.data.name).toBe('Test Store');
    expect(result.error).toBeNull();
  });
});
```

### Testes de Integração
```typescript
// Exemplo de teste de fluxo completo
describe('Price Search Flow', () => {
  test('should complete full price search flow', async () => {
    // 1. Create store
    const store = await StoreService.createStore({
      name: 'Test Store'
    });
    
    // 2. Scan product
    const product = await BarcodeService.searchWithFallback('7891000100103');
    
    // 3. Add price
    const price = await ProductService.addProductPrice(product.id, {
      store_id: store.id,
      price: 3.50,
      date: new Date().toISOString()
    });
    
    expect(price.data).toBeDefined();
  });
});
```