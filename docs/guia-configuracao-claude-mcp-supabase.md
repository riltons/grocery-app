# Guia de Configuração do MCP do Supabase no Claude Desktop

## Problema: MCP do Supabase não retorna ferramentas

Se você está enfrentando o problema onde o MCP (Model Context Protocol) do Supabase não retorna nenhuma ferramenta (tools) quando configurado no Claude Desktop, siga este guia para resolver o problema.

## Pré-requisitos

Antes de começar, certifique-se de que você tem:

1. **Node.js e NPM instalados** (conforme verificado no [guia de teste](./guia-teste-mcp-supabase.md))
2. **Token de acesso válido do Supabase**
3. **Claude Desktop instalado**

## Passos para Configuração no Claude Desktop

### 1. Abra as Configurações do Claude Desktop

1. Abra o aplicativo Claude Desktop
2. Clique no ícone de engrenagem (⚙️) no canto inferior esquerdo para acessar as configurações
3. Navegue até a seção "MCP Servers" ou "Servidores MCP"

### 2. Adicione a Configuração do Supabase

Existem duas opções de configuração. Recomendamos tentar a primeira opção e, se não funcionar, tentar a segunda.

#### Opção 1: Configuração Padrão (Recomendada)

Copie e cole o seguinte JSON na seção de configuração de servidores MCP:

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

#### Opção 2: Configuração para Windows

Se a primeira opção não funcionar, tente esta configuração alternativa:

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

### 3. Salve e Reinicie o Claude Desktop

1. Clique em "Salvar" ou "Aplicar" para salvar as configurações
2. Feche completamente o Claude Desktop
3. Reabra o aplicativo para que as novas configurações sejam aplicadas

## Verificação da Configuração

Para verificar se a configuração foi aplicada corretamente:

1. Inicie uma nova conversa no Claude Desktop
2. Faça uma pergunta que exija interação com o Supabase, como:
   - "Liste as tabelas disponíveis no meu banco de dados Supabase"
   - "Mostre a estrutura da tabela 'generic_products' no Supabase"

## Solução de Problemas

Se após seguir os passos acima o MCP do Supabase ainda não estiver retornando ferramentas:

### Verifique os Logs do Claude Desktop

1. Acesse as configurações do Claude Desktop
2. Procure pela seção de logs ou diagnósticos
3. Verifique se há mensagens de erro relacionadas ao servidor MCP do Supabase

### Teste o Servidor MCP via Linha de Comando

Abra um terminal e execute o comando:

```bash
npx -y @supabase/mcp-server-supabase@latest --access-token=sbp_bfc796145375ee8073aa8325ac6c56e8e781b7b4
```

Se o comando retornar erros, isso pode ajudar a identificar o problema específico.

### Atualize o Token de Acesso

Se o token de acesso estiver expirado ou inválido:

1. Acesse o [Dashboard do Supabase](https://app.supabase.com)
2. Vá para as configurações do seu projeto
3. Gere um novo token de acesso
4. Atualize o token na configuração do Claude Desktop

### Especifique um Projeto

Se você tiver múltiplos projetos no Supabase, tente especificar um projeto específico na configuração:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--access-token",
        "sbp_bfc796145375ee8073aa8325ac6c56e8e781b7b4",
        "--project-ref",
        "eajhacfvnifqfovifjyw"
      ]
    }
  }
}
```

## Recursos Adicionais

- [Documentação oficial do Supabase MCP](https://github.com/supabase-community/supabase-mcp)
- [Guia de teste para MCP do Supabase](./guia-teste-mcp-supabase.md)
- [Configuração do MCP do Supabase](./configuracao-mcp-supabase.md)
- [Solução para o MCP do Supabase não retornar ferramentas](./solucao-mcp-supabase.md)

## Notas Importantes

- O token de acesso do Supabase é sensível e não deve ser compartilhado
- A configuração do MCP pode variar dependendo da versão do Claude Desktop
- Se você estiver usando outro cliente MCP além do Claude Desktop, o processo de configuração pode ser diferente, mas o formato JSON deve ser semelhante