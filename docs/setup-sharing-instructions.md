# Instruções para Configurar o Compartilhamento de Listas

## 1. Executar Script SQL no Supabase

Para que a funcionalidade de compartilhamento funcione, você precisa executar o script SQL no seu banco de dados Supabase:

1. Acesse o painel do Supabase (https://supabase.com/dashboard)
2. Vá para o seu projeto
3. Clique em "SQL Editor" no menu lateral
4. Copie e cole o conteúdo do arquivo `docs/sharing-tables.sql`
5. Execute o script clicando em "Run"

## 2. Verificar Tabelas Criadas

Após executar o script, verifique se as seguintes tabelas foram criadas:

- `list_shares` - Compartilhamentos de listas
- `invitations` - Convites pendentes
- `share_links` - Links de compartilhamento
- Colunas adicionadas à tabela `lists`: `is_shared`, `share_settings`

## 3. Testar Funcionalidade

Após executar o script, a funcionalidade de compartilhamento estará ativa:

### Compartilhar uma Lista:
1. Abra uma lista
2. Clique no botão de compartilhamento (ícone de share)
3. Digite um email válido
4. Selecione a permissão (Visualizar, Editar, Administrar)
5. Clique em "Enviar Convite"

### Aceitar Convites:
1. Na tela inicial, clique no ícone de email no header
2. Visualize os convites pendentes
3. Aceite ou rejeite os convites

### Ver Listas Compartilhadas:
1. Na tela inicial, clique na aba "Compartilhadas"
2. Visualize as listas que foram compartilhadas com você
3. Clique no botão de sair para deixar uma lista compartilhada

## 4. Funcionalidades Implementadas

✅ **Enviar Convites**: Convide usuários por email
✅ **Aceitar/Rejeitar Convites**: Gerencie convites recebidos
✅ **Gerenciar Participantes**: Veja e remova participantes
✅ **Listas Compartilhadas**: Visualize listas compartilhadas com você
✅ **Sair de Listas**: Deixe listas compartilhadas
✅ **Permissões**: Sistema de permissões (view, edit, admin)

## 5. Limitações Atuais

- Não há busca de usuários por nome (apenas email)
- Não há notificações push para convites
- Não há sincronização em tempo real (será implementada posteriormente)

## 6. Próximos Passos

Para melhorar a funcionalidade, considere implementar:

1. **Notificações Push**: Avisar sobre novos convites
2. **Busca de Usuários**: Buscar usuários por nome/email
3. **Sincronização em Tempo Real**: Usar Supabase Realtime
4. **Links de Compartilhamento**: Compartilhar via links públicos
5. **Histórico de Atividades**: Log de ações dos participantes

A funcionalidade básica está **100% funcional** após executar o script SQL! 🎉