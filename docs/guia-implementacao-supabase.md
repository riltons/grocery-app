# Guia de Implementação no Supabase

Este guia contém instruções detalhadas para aplicar o esquema de banco de dados no projeto Supabase.

## Credenciais do Projeto

- **URL do Projeto**: https://eajhacfvnifqfovifjyw.supabase.co
- **Nome do Projeto**: sobrinke.dos@gmail.com's Project

## Passos para Aplicar o Esquema de Banco de Dados

1. Acesse o [Dashboard do Supabase](https://app.supabase.com) e faça login
2. Selecione o projeto "sobrinke.dos@gmail.com's Project"
3. No menu lateral, clique em "SQL Editor"
4. Clique em "+ New Query"
5. Copie e cole o conteúdo do arquivo `supabase/migrations/20240101000000_create_tables.sql`
6. Clique em "Run" para executar a query e criar todas as tabelas e políticas de segurança

## Verificação da Implementação

Após executar o script SQL, você pode verificar se as tabelas foram criadas corretamente:

1. No menu lateral, clique em "Table Editor"
2. Você deverá ver as seguintes tabelas no esquema "public":
   - generic_products
   - specific_products
   - lists
   - list_items
   - list_item_products
   - stores
   - price_history

## Políticas de Segurança (RLS)

O script já configura todas as políticas de Row Level Security necessárias para garantir que cada usuário só possa acessar seus próprios dados. Para verificar as políticas:

1. No menu lateral, clique em "Authentication"
2. Clique em "Policies"
3. Verifique se cada tabela possui as políticas para SELECT, INSERT, UPDATE e DELETE

## Próximos Passos

Após a configuração do banco de dados, você pode prosseguir para a implementação do backend e frontend do aplicativo, utilizando as credenciais do Supabase para conectar sua aplicação.
