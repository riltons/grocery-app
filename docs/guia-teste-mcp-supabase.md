# Guia de Teste para MCP do Supabase

## Pré-requisitos

Antes de testar a configuração do MCP do Supabase, verifique se você tem os seguintes requisitos:

1. **Node.js instalado**
   - Para verificar, execute no terminal: `node -v`
   - Se não estiver instalado, baixe em: https://nodejs.org/

2. **NPM instalado**
   - Para verificar, execute: `npm -v`

## Testando a Configuração

### Opção 1: Teste via Linha de Comando

Você pode testar se o servidor MCP do Supabase está funcionando corretamente executando o comando diretamente no terminal:

```bash
npx -y @supabase/mcp-server-supabase@latest --access-token=sbp_bfc796145375ee8073aa8325ac6c56e8e781b7b4
```

Se o comando for executado com sucesso, você verá uma saída indicando que o servidor MCP está em execução.

### Opção 2: Teste com Configuração Específica de Projeto

Se você quiser limitar o acesso a um projeto específico do Supabase, use o parâmetro `--project-ref`:

```bash
npx -y @supabase/mcp-server-supabase@latest --access-token=sbp_bfc796145375ee8073aa8325ac6c56e8e781b7b4 --project-ref=eajhacfvnifqfovifjyw
```

## Solução de Problemas

### Problema: Comando não encontrado

Se você receber um erro indicando que o comando `npx` não foi encontrado:

1. Verifique se o Node.js está instalado corretamente
2. Adicione o diretório de instalação global do npm ao PATH do sistema:
   ```bash
   npm config get prefix
   ```
   Adicione o caminho retornado + "\node_modules\.bin" ao PATH do sistema

### Problema: Erro de Autenticação

Se você receber um erro de autenticação:

1. Verifique se o token de acesso está correto
2. Gere um novo token de acesso no painel do Supabase se necessário

### Problema: Erro ao Iniciar o Servidor

Se o servidor MCP não iniciar corretamente:

1. Tente usar a configuração alternativa (sem o wrapper `cmd /c`)
2. Verifique se há atualizações disponíveis para o pacote:
   ```bash
   npm view @supabase/mcp-server-supabase version
   ```

## Verificando a Integração com o Cliente MCP

Após configurar o servidor MCP do Supabase:

1. Reinicie seu cliente MCP (Claude Desktop, etc.)
2. Verifique se o cliente reconhece o servidor Supabase
3. Teste uma consulta simples, como "Liste as tabelas disponíveis no meu banco de dados Supabase"

Se tudo estiver configurado corretamente, o cliente MCP deverá ser capaz de interagir com seu banco de dados Supabase através do servidor MCP.