# Configuração do MCP do Supabase

## Problema Identificado

A configuração original do MCP do Supabase não estava retornando nenhuma ferramenta (tools). O problema estava na estrutura da configuração JSON, especificamente na forma como o comando estava sendo executado no Windows.

## Configuração Original (Com Problema)

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

## Soluções Implementadas

Foram criados dois arquivos de configuração alternativos:

### 1. Configuração Padrão (supabase-mcp-config.json)

Esta configuração usa diretamente o comando `npx` sem o wrapper `cmd /c`, o que pode resolver problemas de execução em alguns ambientes:

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

### 2. Configuração para Windows (supabase-mcp-config-windows.json)

Esta configuração mantém o uso do `cmd /c` para Windows, mas foi reorganizada para garantir compatibilidade:

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

## Como Usar

Para utilizar uma das configurações:

1. Copie o conteúdo do arquivo de configuração desejado
2. Cole no arquivo de configuração do seu cliente MCP (como Claude Desktop)
3. Reinicie o cliente para aplicar as alterações

## Verificação

Após aplicar a nova configuração, o MCP do Supabase deve retornar as ferramentas disponíveis para interagir com seu banco de dados Supabase.

## Referências

As configurações foram baseadas na documentação oficial do Supabase MCP disponível em:
https://github.com/supabase-community/supabase-mcp