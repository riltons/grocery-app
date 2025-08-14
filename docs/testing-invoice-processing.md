# Testando o Processamento de Notas Fiscais

## Como testar a funcionalidade

### 1. Acessar a tela de demo

```bash
# Navegar para a tela de demo
# No app, vá para: /invoice-demo
```

### 2. Testar Scanner de QR Code

1. Toque em "Processar Nota Fiscal"
2. Permita acesso à câmera quando solicitado
3. Posicione um QR code de nota fiscal na área destacada
4. Aguarde o processamento automático

### 3. Testar Entrada Manual

1. Toque em "Processar Nota Fiscal"
2. Toque no ícone de edição no canto superior direito
3. Cole uma URL de nota fiscal válida
4. Toque em "Processar Nota Fiscal"

### 4. URLs de Teste

Para testar sem uma nota fiscal real, você pode usar estas URLs de exemplo:

```
# Exemplo de URL de NFCe (São Paulo)
https://www.fazenda.sp.gov.br/nfce/qrcode?chNFe=35200114200166000187650010000000046550000004&nVersao=100&tpAmb=1&dhEmi=323031302d30312d31355431353a32303a32302d30323a3030&vNF=123.45&vICMS=0.00&digVal=abcd1234&cIdToken=000001&cHashQRCode=1234567890

# Exemplo de URL de NFCe (Rio de Janeiro)
https://www.fazenda.rj.gov.br/nfce/qrcode?chNFe=33200114200166000187650010000000046550000004&nVersao=100&tpAmb=1&dhEmi=323031302d30312d31355431353a32303a32302d30323a3030&vNF=67.89&vICMS=0.00&digVal=efgh5678&cIdToken=000002&cHashQRCode=0987654321
```

**Nota**: Essas são URLs de exemplo e podem não funcionar com servidores reais. Para testes completos, use notas fiscais reais.

### 5. Dados de Teste Simulados

Para desenvolvimento, você pode modificar temporariamente o `InvoiceService` para retornar dados simulados:

```typescript
// Em lib/invoiceService.ts, adicione esta função de teste:
export const getTestInvoiceData = (): InvoiceData => ({
  number: "000000123",
  date: new Date().toISOString(),
  storeName: "Supermercado Teste LTDA",
  storeDocument: "12.345.678/0001-90",
  totalAmount: 45.67,
  products: [
    {
      name: "ARROZ BRANCO TIPO 1 5KG",
      quantity: 1,
      unit: "un",
      unitPrice: 12.50,
      totalPrice: 12.50,
      barcode: "7891234567890",
      brand: "Marca Teste",
      category: "Mercearia"
    },
    {
      name: "LEITE INTEGRAL 1L",
      quantity: 2,
      unit: "un",
      unitPrice: 4.25,
      totalPrice: 8.50,
      barcode: "7890123456789",
      brand: "Laticínios Teste",
      category: "Laticínios"
    },
    {
      name: "BANANA PRATA KG",
      quantity: 1.5,
      unit: "kg",
      unitPrice: 3.99,
      totalPrice: 5.99,
      category: "Frutas"
    }
  ]
});
```

### 6. Verificações de Teste

#### ✅ Scanner de QR Code
- [ ] Câmera abre corretamente
- [ ] Área de foco é visível
- [ ] QR codes são detectados
- [ ] Validação de QR codes funciona
- [ ] Transição para processamento é suave

#### ✅ Entrada Manual
- [ ] Modal de entrada manual abre
- [ ] Campo de texto aceita URLs
- [ ] Validação básica de URL funciona
- [ ] Botão de processar está habilitado/desabilitado corretamente

#### ✅ Processamento de XML
- [ ] Download de XML funciona
- [ ] Parse de XML extrai dados corretamente
- [ ] Produtos são categorizados automaticamente
- [ ] Preços são calculados corretamente
- [ ] Dados da loja são extraídos

#### ✅ Interface de Resultados
- [ ] Dados da nota são exibidos corretamente
- [ ] Lista de produtos é renderizada
- [ ] Preços são formatados em reais
- [ ] Categorias são mostradas
- [ ] Navegação entre telas funciona

#### ✅ Comparação com Lista
- [ ] Produtos são comparados corretamente
- [ ] Itens encontrados são identificados
- [ ] Novos produtos são listados
- [ ] Diferenças de quantidade são calculadas
- [ ] Interface de comparação é clara

#### ✅ Atualização de Lista
- [ ] Opções de atualização funcionam
- [ ] Quantidades são atualizadas
- [ ] Preços são salvos
- [ ] Novos produtos são adicionados
- [ ] Status de comprado é atualizado

### 7. Testes de Erro

#### ❌ Cenários de Erro para Testar
- [ ] QR code inválido (não de nota fiscal)
- [ ] URL inacessível ou expirada
- [ ] XML malformado ou corrompido
- [ ] Sem conexão de internet
- [ ] Permissão de câmera negada
- [ ] Nota fiscal sem produtos
- [ ] Dados incompletos na nota

### 8. Performance

#### ⚡ Métricas a Observar
- [ ] Tempo de abertura da câmera
- [ ] Velocidade de detecção de QR code
- [ ] Tempo de download do XML
- [ ] Velocidade de processamento
- [ ] Responsividade da interface
- [ ] Uso de memória durante processamento

### 9. Logs de Debug

Para facilitar o debug, observe os logs no console:

```
📱 QR Code da nota fiscal escaneado: { type, data }
📄 Fazendo download do XML da nota fiscal: [URL]
📄 Processando XML da nota fiscal...
📄 XML processado com sucesso: { products, storeName, totalAmount }
📄 Comparando produtos da nota fiscal com a lista...
📄 Comparação concluída: { matchedItems, unmatchedItems, newProducts }
📄 Atualizando lista de compras com dados da nota fiscal...
📄 Lista atualizada com sucesso: { updatedItems, addedItems }
```

### 10. Checklist Final

Antes de considerar a implementação completa:

- [ ] Todos os componentes renderizam sem erros
- [ ] Navegação entre telas funciona
- [ ] Dados são persistidos corretamente
- [ ] Tratamento de erros está implementado
- [ ] Interface é intuitiva e responsiva
- [ ] Performance é aceitável
- [ ] Logs de debug são informativos
- [ ] Documentação está atualizada