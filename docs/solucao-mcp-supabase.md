# Solução para o MCP do Supabase não retornar ferramentas

## Problema

O MCP (Model Context Protocol) do Supabase não está retornando nenhuma ferramenta (tools) quando configurado. Isso impede que você utilize as funcionalidades do Supabase através do cliente MCP.

## Causa do Problema

O problema geralmente está relacionado a um dos seguintes fatores:

1. **Configuração JSON incorreta**: A estrutura do arquivo de configuração pode estar com problemas, especialmente na forma como o comando é executado no Windows.

2. **Token de acesso inválido ou expirado**: O token de acesso do Supabase pode estar incorreto ou ter expirado.

3. **Problemas com a instalação do Node.js/NPM**: O Node.js ou NPM podem não estar instalados corretamente ou não estarem no PATH do sistema.

4. **Versão incompatível do pacote**: A versão do pacote `@supabase/mcp-server-supabase` pode estar desatualizada ou ser incompatível.

## Soluções

### 1. Corrigir a Configuração JSON

Existem duas abordagens recomendadas para a configuração:

#### Configuração Padrão (Recomendada)

Esta configuração usa diretamente o comando `npx` sem o wrapper `cmd /c`:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--access-token",
        "sbp_bfc796145375ee8073aa8325ac6c56e8e781b7b4"
      ]
    }
  }
}
```

#### Configuração Alternativa para Windows

Se a configuração padrão não funcionar, tente esta alternativa que mantém o uso do `cmd /c`:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--access-token",
        "sbp_bfc796145375ee8073aa8325ac6c56e8e781b7b4"
      ]
    }
  }
}
```

### 2. Verificar e Atualizar o Token de Acesso

Se o token de acesso estiver expirado ou incorreto:

1. Acesse o [Dashboard do Supabase](https://app.supabase.com)
2. Vá para as configurações do seu projeto
3. Gere um novo token de acesso
4. Substitua o token antigo na configuração JSON

### 3. Testar a Configuração via Linha de Comando

Antes de aplicar a configuração no cliente MCP, teste se o servidor MCP do Supabase funciona corretamente via linha de comando:

```bash
npx -y @supabase/mcp-server-supabase@latest --access-token=seu_token_de_acesso
```

Se o comando for executado com sucesso, você verá uma saída indicando que o servidor MCP está em execução.

### 4. Verificar a Instalação do Node.js e NPM

Certifique-se de que o Node.js e NPM estão instalados corretamente:

```bash
node -v
npm -v
```

Se não estiverem instalados ou se as versões forem muito antigas, atualize-os:

1. Baixe a versão mais recente do Node.js em [nodejs.org](https://nodejs.org/)
2. Instale seguindo as instruções para seu sistema operacional

## Como Aplicar a Solução

1. Escolha uma das configurações JSON acima
2. Abra seu cliente MCP (Claude Desktop, etc.)
3. Acesse as configurações do cliente
4. Localize a seção de configuração de servidores MCP
5. Cole a configuração escolhida
6. Salve as alterações e reinicie o cliente MCP

## Verificação

Para verificar se a solução funcionou:

1. Reinicie seu cliente MCP
2. Faça uma pergunta que exija interação com o Supabase, como "Liste as tabelas disponíveis no meu banco de dados Supabase"
3. O cliente MCP deve agora ser capaz de utilizar as ferramentas do Supabase para responder à sua pergunta

## Solução de Problemas Adicionais

Se após aplicar as soluções acima o problema persistir:

1. **Verifique os logs**: Muitos clientes MCP têm uma seção de logs que pode fornecer informações sobre erros específicos

2. **Atualize o pacote**: Verifique se há atualizações disponíveis para o pacote:
   ```bash
   npm view @supabase/mcp-server-supabase version
   ```

3. **Teste com um projeto específico**: Se você tiver múltiplos projetos no Supabase, tente especificar um projeto:
   ```bash
   npx -y @supabase/mcp-server-supabase@latest --access-token=seu_token_de_acesso --project-ref=referencia_do_projeto
   ```

4. **Verifique as permissões**: Certifique-se de que o token de acesso tem as permissões necessárias para acessar os recursos do Supabase

## Recursos Adicionais

- [Documentação oficial do Supabase MCP](https://github.com/supabase-community/supabase-mcp)
- [Guia de teste para MCP do Supabase](./guia-teste-mcp-supabase.md)
- [Configuração do MCP do Supabase](./configuracao-mcp-supabase.md)