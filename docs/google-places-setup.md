# Configuração da Google Places API

Este documento explica como configurar a Google Places API para a funcionalidade de busca de supermercados próximos.

## Pré-requisitos

1. Conta no Google Cloud Platform
2. Projeto criado no Google Cloud Console
3. Billing habilitado no projeto

## Passos para Configuração

### 1. Acessar o Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Selecione ou crie um projeto

### 2. Habilitar as APIs Necessárias

1. No menu lateral, vá para "APIs & Services" > "Library"
2. Busque e habilite as seguintes APIs:
   - **Places API (New)**
   - **Maps JavaScript API** (opcional, para mapas)
   - **Geocoding API** (opcional, para geocodificação)

### 3. Criar Credenciais

1. Vá para "APIs & Services" > "Credentials"
2. Clique em "Create Credentials" > "API Key"
3. Copie a chave gerada

### 4. Configurar Restrições (Recomendado)

1. Clique na chave criada para editá-la
2. Em "Application restrictions":
   - Para desenvolvimento: selecione "None"
   - Para produção: selecione "Android apps" ou "iOS apps" e configure os bundle IDs
3. Em "API restrictions":
   - Selecione "Restrict key"
   - Marque apenas as APIs que você habilitou

### 5. Configurar no Projeto

1. Abra o arquivo `.env` na raiz do projeto
2. Substitua `YOUR_GOOGLE_PLACES_API_KEY_HERE` pela sua chave:
   ```
   EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=sua_chave_aqui
   ```

## Custos

A Google Places API tem os seguintes custos (valores podem mudar):

- **Nearby Search**: $32 por 1.000 requests
- **Place Details**: $17 por 1.000 requests
- **Text Search**: $32 per 1.000 requests

### Cota Gratuita

O Google oferece $200 em créditos mensais gratuitos, que cobrem aproximadamente:
- 6.250 requests de Nearby Search
- 11.765 requests de Place Details

## Alternativas Gratuitas

Se você não quiser usar a Google Places API, o app funciona com dados simulados para desenvolvimento. Os dados simulados incluem:

- Supermercado Pão de Açúcar
- Extra Supermercados  
- Carrefour

## Testando a Configuração

1. Reinicie o servidor de desenvolvimento: `npm start`
2. Abra a tela "Nova Loja"
3. Toque em "Buscar supermercados próximos"
4. Permita o acesso à localização quando solicitado
5. Verifique se os supermercados aparecem na lista

## Troubleshooting

### Erro: "API key não configurada"
- Verifique se a variável `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY` está definida no `.env`
- Reinicie o servidor de desenvolvimento

### Erro: "This API project is not authorized"
- Verifique se a Places API está habilitada no seu projeto
- Verifique se a chave API tem as permissões corretas

### Erro: "REQUEST_DENIED"
- Verifique se o billing está habilitado no projeto
- Verifique as restrições da chave API

### Nenhum resultado encontrado
- Verifique se a localização está sendo obtida corretamente
- Teste com um raio maior (modificar o valor em `PlacesService.searchNearbySupermarkets`)
- Verifique se há supermercados na região

## Desenvolvimento Local

Durante o desenvolvimento, você pode usar os dados simulados comentando a verificação da API key no arquivo `lib/places.ts`:

```typescript
// Comentar esta linha para usar dados simulados
// if (!GOOGLE_PLACES_API_KEY) {
```

## Produção

Para produção, certifique-se de:

1. Configurar restrições adequadas na chave API
2. Monitorar o uso da API no Google Cloud Console
3. Configurar alertas de billing se necessário
4. Considerar implementar cache para reduzir requests