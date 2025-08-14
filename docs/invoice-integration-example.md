# Exemplo de Integração do Processamento de Notas Fiscais

## Como integrar na tela de lista existente

### 1. Importar o componente

```typescript
import InvoiceProcessModal from '../../components/InvoiceProcessModal';
import { InvoiceData } from '../../lib/invoiceService';
```

### 2. Adicionar estados

```typescript
const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
```

### 3. Adicionar função de callback

```typescript
const handleInvoiceProcessed = (invoiceData: InvoiceData) => {
  console.log('📄 Nota fiscal processada:', invoiceData);
  
  // Opcional: Mostrar resumo da nota processada
  Alert.alert(
    'Nota Fiscal Processada!',
    `Loja: ${invoiceData.storeName}\nProdutos: ${invoiceData.products.length}\nTotal: R$ ${invoiceData.totalAmount.toFixed(2)}`,
    [{ text: 'OK' }]
  );
  
  // Recarregar a lista para mostrar atualizações
  fetchListDetails();
};
```

### 4. Adicionar botão no header

```typescript
// No JSX do header, adicionar:
<TouchableOpacity
  onPress={() => setInvoiceModalVisible(true)}
  style={styles.headerButton}
  disabled={isListFinished}
>
  <Ionicons name="receipt-outline" size={20} color={isListFinished ? "#ccc" : "#007AFF"} />
</TouchableOpacity>
```

### 5. Adicionar o modal no final do JSX

```typescript
<InvoiceProcessModal
  visible={invoiceModalVisible}
  onClose={() => setInvoiceModalVisible(false)}
  listId={id}
  onInvoiceProcessed={handleInvoiceProcessed}
/>
```

### 6. Adicionar estilos

```typescript
headerButton: {
  padding: 8,
  marginLeft: 8,
},
```

## Funcionalidades Disponíveis

### Scanner de QR Code
- Abre automaticamente a câmera para escanear QR codes
- Valida se o QR code é de uma nota fiscal
- Suporte a diferentes formatos de QR code de NFCe/NFe

### Entrada Manual
- Permite inserir URL da nota fiscal manualmente
- Útil quando o QR code não pode ser escaneado

### Processamento Automático
- Download automático do XML da nota fiscal
- Parse completo dos dados da nota
- Extração de produtos com preços e quantidades
- Categorização automática dos produtos

### Comparação com Lista
- Compara produtos da nota com itens da lista atual
- Identifica produtos já existentes na lista
- Mostra produtos novos encontrados na nota
- Calcula diferenças de quantidade

### Atualização da Lista
- Opções flexíveis de atualização:
  - Atualizar quantidades
  - Atualizar preços
  - Adicionar novos produtos
  - Marcar como comprado
- Preserva dados existentes quando necessário

## Casos de Uso

### 1. Verificação Pós-Compra
- Usuário faz compras e quer verificar se comprou tudo da lista
- Escaneie a nota fiscal para comparar automaticamente
- Veja quais itens foram esquecidos

### 2. Atualização de Preços
- Mantenha histórico de preços atualizado
- Compare preços entre diferentes compras
- Identifique variações de preço ao longo do tempo

### 3. Adição Rápida de Produtos
- Encontrou produtos interessantes na nota fiscal?
- Adicione automaticamente à sua lista
- Evite digitar manualmente nomes e preços

### 4. Controle de Gastos
- Acompanhe quanto gastou em cada categoria
- Compare gastos planejados vs reais
- Mantenha histórico detalhado de compras

## Tratamento de Erros

O sistema trata diversos cenários de erro:

- **QR Code inválido**: Valida se é realmente de uma nota fiscal
- **XML inacessível**: Tenta diferentes métodos de acesso
- **Formato não suportado**: Informa sobre limitações
- **Conexão de rede**: Trata problemas de conectividade
- **Dados corrompidos**: Valida integridade dos dados

## Limitações Conhecidas

1. **Dependência de conectividade**: Precisa de internet para baixar XML
2. **Formatos regionais**: Alguns estados podem ter formatos diferentes
3. **Notas antigas**: URLs podem expirar após certo tempo
4. **Produtos sem código**: Alguns produtos podem não ter código de barras

## Próximos Passos

- [ ] Suporte offline para notas já processadas
- [ ] Integração com histórico de compras
- [ ] Análise de padrões de consumo
- [ ] Alertas de preços
- [ ] Compartilhamento de notas entre usuários