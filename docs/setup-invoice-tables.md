# Configuração das Tabelas de Notas Fiscais

## 📋 Instruções para Criar as Tabelas

Para implementar o sistema de notas fiscais, você precisa executar o SQL contido no arquivo `docs/invoice-tables.sql` no seu banco de dados Supabase.

### 🚀 Como Executar

1. **Acesse o Supabase Dashboard**
   - Vá para [supabase.com](https://supabase.com)
   - Faça login na sua conta
   - Selecione seu projeto

2. **Abra o SQL Editor**
   - No menu lateral, clique em "SQL Editor"
   - Clique em "New Query"

3. **Execute o Script**
   - Copie todo o conteúdo do arquivo `docs/invoice-tables.sql`
   - Cole no editor SQL
   - Clique em "Run" para executar

### 📊 Tabelas que serão criadas

#### 1. `invoices` - Tabela principal de notas fiscais
- `id` - ID único da nota fiscal
- `number` - Número da nota fiscal
- `date` - Data de emissão
- `store_name` - Nome da loja
- `store_document` - CNPJ/CPF da loja
- `total_amount` - Valor total da nota
- `xml_url` - URL do XML original
- `qr_code_data` - Dados do QR Code
- `store_id` - Referência à loja cadastrada (opcional)
- `list_id` - Lista principal vinculada (opcional)
- `user_id` - ID do usuário proprietário

#### 2. `invoice_items` - Itens das notas fiscais
- `id` - ID único do item
- `invoice_id` - Referência à nota fiscal
- `name` - Nome do produto
- `quantity` - Quantidade
- `unit` - Unidade de medida
- `unit_price` - Preço unitário
- `total_price` - Preço total
- `barcode` - Código de barras
- `brand` - Marca
- `category` - Categoria
- `specific_product_id` - Produto específico vinculado (opcional)
- `generic_product_id` - Produto genérico vinculado (opcional)

#### 3. `invoice_list_links` - Vinculações entre notas e listas
- `id` - ID único da vinculação
- `invoice_id` - Referência à nota fiscal
- `list_id` - Referência à lista
- `linked_at` - Data da vinculação

### 🔒 Segurança (RLS)

Todas as tabelas têm Row Level Security (RLS) habilitado:
- Usuários só podem ver/editar suas próprias notas fiscais
- Políticas de segurança aplicadas automaticamente
- Isolamento completo entre usuários

### 📈 Funcionalidades Incluídas

#### Triggers Automáticos
- **Atualização de `updated_at`**: Atualiza automaticamente quando a nota é modificada
- **Cálculo de total**: Recalcula o total da nota quando itens são adicionados/removidos

#### Índices de Performance
- Índices otimizados para consultas por usuário, data, loja e lista
- Busca rápida por código de barras
- Performance otimizada para grandes volumes

#### Views Úteis
- **`invoice_summary`**: Resumo das notas com informações agregadas
- Inclui contagem de itens, nomes de lojas e listas vinculadas

#### Funções Auxiliares
- **`calculate_invoice_total()`**: Calcula total baseado nos itens
- **`update_invoice_total()`**: Trigger para manter totais sincronizados

### ✅ Verificação

Após executar o script, você pode verificar se as tabelas foram criadas:

```sql
-- Verificar se as tabelas existem
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('invoices', 'invoice_items', 'invoice_list_links');

-- Verificar se as políticas RLS estão ativas
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('invoices', 'invoice_items', 'invoice_list_links');
```

### 🎯 Próximos Passos

Após criar as tabelas:

1. **Teste a funcionalidade** - Use o app para processar uma nota fiscal
2. **Verifique os dados** - Confirme se os dados estão sendo salvos corretamente
3. **Monitore performance** - Observe se as consultas estão rápidas
4. **Backup regular** - Configure backups automáticos das novas tabelas

### 🐛 Troubleshooting

Se encontrar erros:

1. **Permissões**: Certifique-se de ter permissões de administrador no projeto
2. **Dependências**: Verifique se as tabelas `stores` e `lists` existem
3. **Função `update_updated_at_column()`**: Deve existir (criada no schema anterior)
4. **RLS**: Confirme se as políticas foram aplicadas corretamente

### 📞 Suporte

Se precisar de ajuda:
- Verifique os logs do Supabase para erros específicos
- Consulte a documentação do Supabase sobre RLS
- Teste as consultas individualmente para identificar problemas