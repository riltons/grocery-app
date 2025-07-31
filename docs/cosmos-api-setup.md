# Configuração da API Cosmos Bluesoft

## Token Configurado

✅ **Token da API Cosmos**: `gcTll84IT9IeuqA-28YiDA`

## Arquivos Modificados

### 1. `.env`
```env
# API Cosmos Bluesoft
COSMOS_API_KEY=gcTll84IT9IeuqA-28YiDA
```

### 2. `babel.config.js`
```javascript
module.exports = function (api) {
  api.cache(true);
  
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Configuração para variáveis de ambiente
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env',
        blacklist: null,
        whitelist: null,
        safe: false,
        allowUndefined: true
      }],
      // Reanimated (deve ser o último)
      'react-native-reanimated/plugin',
    ],
  };
};
```

### 3. `types/env.d.ts` e `src/types/env.d.ts`
```typescript
declare module '@env' {
  export const SUPABASE_URL: string;
  export const SUPABASE_ANON_KEY: string;
  export const SUPABASE_SERVICE_ROLE_KEY: string;
  export const COSMOS_API_KEY: string;
  export const ACCESS_TOKEN: string;
  export const APP_ENV: string;
}
```

### 4. `lib/barcode.ts`
```typescript
import { COSMOS_API_KEY } from '@env';

export class CosmosService {
  private static readonly BASE_URL = 'https://api.cosmos.bluesoft.com.br';
  private static readonly API_KEY = COSMOS_API_KEY || '';
  // ...
}
```

### 5. `tsconfig.json`
```json
{
  "compilerOptions": {
    "typeRoots": [
      "./node_modules/@types",
      "./src/types",
      "./types"
    ]
  }
}
```

## Teste de Funcionamento

✅ **Teste realizado com sucesso**:
- **Código testado**: `7894900011517` (Coca-Cola 2L)
- **Resultado**: `REFRIGERANTE COCA-COLA GARRAFA 2L`
- **Marca**: `COCA-COLA`
- **Categoria**: `Refrigerantes Pet`
- **Status**: API funcionando corretamente

## Como Usar

### No código React Native:
```typescript
import { BarcodeService } from '../lib/barcode';

// Buscar produto por código de barras
const result = await BarcodeService.searchByBarcode('7894900011517');

if (result.found) {
  console.log('Produto encontrado:', result.product.name);
  console.log('Marca:', result.product.brand);
  console.log('Fonte:', result.product.source); // 'cosmos'
}
```

### Fluxo de busca:
1. **Cache local** (mais rápido)
2. **Cache do Supabase** (rápido)
3. **API Cosmos** (se não encontrado no cache)
4. **API OpenFoodFacts** (fallback internacional)

## Recursos da API Cosmos

### Informações disponíveis:
- ✅ Nome do produto
- ✅ Marca
- ✅ Categoria
- ✅ Imagem do produto
- ✅ Código de barras
- ✅ Informações de embalagem
- ✅ Classificação NCM
- ✅ Classificação CEST

### Limitações:
- 🔒 Requer token de acesso
- 🌎 Focada em produtos brasileiros
- ⏱️ Rate limiting (limite de requisições)
- 💰 Pode ter custos associados ao uso

## Monitoramento

### Logs de debug adicionados:
```typescript
console.log('🔑 Token Cosmos carregado:', this.API_KEY ? 'SIM' : 'NÃO');
```

### Métricas importantes:
- Taxa de sucesso da API Cosmos
- Tempo de resposta médio
- Produtos encontrados vs não encontrados
- Uso do cache vs chamadas à API

## Próximos Passos

1. **Testar em ambiente de desenvolvimento**
   ```bash
   npm start
   ```

2. **Verificar logs no console**
   - Token carregado corretamente
   - Requisições à API funcionando
   - Cache sendo utilizado

3. **Monitorar uso da API**
   - Verificar limites de requisições
   - Acompanhar custos (se aplicável)
   - Otimizar cache para reduzir chamadas

4. **Testes com diferentes códigos**
   - Produtos nacionais conhecidos
   - Produtos importados
   - Códigos inválidos

## Troubleshooting

### Se o token não estiver funcionando:
1. Verificar se o arquivo `.env` está na raiz do projeto
2. Reiniciar o servidor de desenvolvimento (`npm start`)
3. Limpar cache do Metro: `npx expo start --clear`
4. Verificar se o babel.config.js foi atualizado corretamente

### Se houver erros de TypeScript:
1. Verificar se os arquivos de tipos estão nos locais corretos
2. Executar `npx tsc --noEmit` para verificar erros
3. Reiniciar o TypeScript server no VS Code

### Se a API retornar erro 401 (Unauthorized):
1. Verificar se o token está correto
2. Verificar se o token não expirou
3. Contatar suporte da Cosmos se necessário

## Contato

- **API Cosmos**: https://cosmos.bluesoft.com.br/
- **Documentação**: https://cosmos.bluesoft.com.br/api
- **Token atual**: `gcTll84IT9IeuqA-28YiDA`