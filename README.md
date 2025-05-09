# Aplicativo de Lista de Supermercado

## Estrutura do Banco de Dados

Este repositório contém o esquema SQL para o banco de dados do aplicativo de lista de supermercado, utilizando o Supabase como backend.

### Tabelas Principais

- **generic_products**: Produtos genéricos (ex: Arroz, Feijão)
- **specific_products**: Produtos específicos (ex: Arroz Tio João, Feijão Camil)
- **lists**: Listas de compras do usuário
- **list_items**: Itens dentro de uma lista
- **list_item_products**: Relação entre itens da lista e produtos específicos
- **stores**: Lojas/mercados cadastrados
- **price_history**: Histórico de preços dos produtos

### Como Aplicar as Migrações no Supabase

1. Acesse o painel de controle do Supabase
2. Vá para a seção SQL Editor
3. Crie uma nova query
4. Copie e cole o conteúdo do arquivo `supabase/migrations/20240101000000_create_tables.sql`
5. Execute a query para criar todas as tabelas e políticas de segurança

O esquema inclui políticas de Row Level Security (RLS) que garantem que cada usuário só possa acessar seus próprios dados.
