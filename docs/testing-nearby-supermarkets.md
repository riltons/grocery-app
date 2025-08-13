# Testando a Funcionalidade de Supermercados Próximos

Este documento descreve como testar a nova funcionalidade de busca de supermercados próximos.

## Funcionalidades Implementadas

### 1. Serviço de Lugares (`lib/places.ts`)
- ✅ Solicitação de permissão de localização
- ✅ Obtenção da localização atual do usuário
- ✅ Busca de supermercados próximos via Google Places API
- ✅ Dados simulados para desenvolvimento (quando API key não configurada)
- ✅ Cálculo de distância entre coordenadas
- ✅ Formatação de distância para exibição

### 2. Modal de Supermercados (`components/NearbySupermarketsModal.tsx`)
- ✅ Interface para exibir lista de supermercados próximos
- ✅ Informações detalhadas: nome, endereço, avaliação, status (aberto/fechado)
- ✅ Indicação de distância do usuário
- ✅ Seleção de supermercado para preenchimento automático
- ✅ Estados de loading e erro
- ✅ Opção para adicionar manualmente

### 3. Tela Nova Loja (`app/stores/new.tsx`)
- ✅ Botão para buscar supermercados próximos
- ✅ Integração com modal de supermercados
- ✅ Preenchimento automático dos campos nome e endereço
- ✅ Interface melhorada com divisor visual

## Como Testar

### Teste 1: Funcionalidade Básica (Dados Simulados)

1. **Preparação:**
   ```bash
   npm start
   ```

2. **Navegação:**
   - Abra o app
   - Vá para a aba "Lojas"
   - Toque no botão "+" para adicionar nova loja

3. **Teste da Interface:**
   - Verifique se o botão "Buscar supermercados próximos" aparece
   - Toque no botão
   - Permita acesso à localização quando solicitado

4. **Resultados Esperados:**
   - Modal deve abrir com lista de supermercados simulados
   - Deve mostrar: Pão de Açúcar, Extra, Carrefour
   - Cada item deve mostrar nome, endereço, avaliação e distância
   - Status aberto/fechado deve aparecer quando disponível

5. **Teste de Seleção:**
   - Toque em um supermercado da lista
   - Modal deve fechar
   - Campos nome e endereço devem ser preenchidos automaticamente

### Teste 2: Com Google Places API

1. **Configuração:**
   - Configure a chave da Google Places API no `.env`
   - Reinicie o servidor: `npm start`

2. **Teste:**
   - Repita os passos do Teste 1
   - Agora deve mostrar supermercados reais próximos à sua localização

### Teste 3: Cenários de Erro

1. **Sem Permissão de Localização:**
   - Negue a permissão de localização
   - Deve mostrar alerta explicativo

2. **Sem Conexão:**
   - Desative a internet
   - Deve mostrar mensagem de erro apropriada

3. **Nenhum Resultado:**
   - Teste em área sem supermercados próximos
   - Deve mostrar tela vazia com opção de tentar novamente

## Checklist de Funcionalidades

### Interface
- [ ] Botão "Buscar supermercados próximos" visível
- [ ] Divisor visual "ou adicione manualmente"
- [ ] Modal abre corretamente
- [ ] Lista de supermercados carrega
- [ ] Loading indicator durante busca
- [ ] Botão fechar modal funciona

### Dados
- [ ] Permissão de localização solicitada
- [ ] Localização atual obtida
- [ ] Supermercados carregados (simulados ou reais)
- [ ] Distância calculada e exibida
- [ ] Informações completas (nome, endereço, avaliação)

### Interação
- [ ] Seleção de supermercado funciona
- [ ] Campos preenchidos automaticamente
- [ ] Modal fecha após seleção
- [ ] Botão "Adicionar manualmente" funciona

### Estados de Erro
- [ ] Erro de permissão tratado
- [ ] Erro de rede tratado
- [ ] Nenhum resultado tratado
- [ ] Botão "Tentar novamente" funciona

## Problemas Conhecidos

### 1. Dados Simulados
- Os dados simulados usam coordenadas relativas à localização do usuário
- Podem não representar supermercados reais da região

### 2. Permissões
- No iOS, pode ser necessário reiniciar o app após negar/conceder permissão
- No Android, permissões são solicitadas automaticamente

### 3. API Limits
- Google Places API tem limites de uso
- Monitore o console para erros de quota

## Melhorias Futuras

1. **Cache de Resultados:**
   - Salvar resultados localmente para evitar requests repetidos
   - Implementar TTL (time to live) para cache

2. **Filtros Avançados:**
   - Filtrar por tipo de estabelecimento
   - Filtrar por avaliação mínima
   - Ajustar raio de busca

3. **Mapas:**
   - Mostrar supermercados em mapa
   - Permitir seleção visual

4. **Favoritos:**
   - Marcar supermercados como favoritos
   - Priorizar favoritos na lista

5. **Histórico:**
   - Lembrar supermercados selecionados anteriormente
   - Sugerir baseado no histórico

## Logs Úteis

Para debug, verifique os logs no console:

```javascript
// Localização obtida
console.log('Localização atual:', location);

// Supermercados encontrados
console.log('Supermercados próximos:', supermarkets);

// Erros da API
console.error('Erro na API:', error);
```