# Guia de Unificação de Categorias

## Visão Geral

Este guia explica como identificar e unificar categorias duplicadas no banco de dados do aplicativo de supermercado. O processo é seguro e inclui simulação antes da execução real.

## Problema

Com o tempo, podem ser criadas categorias duplicadas ou similares como:
- "Bebida" e "Bebidas"
- "Limpeza" e "Produtos de Limpeza"
- "Higiene" e "Higiene Pessoal"
- "Fruta" e "Frutas"

Isso causa:
- Interface confusa para o usuário
- Dificuldade na organização de produtos
- Dados inconsistentes

## Solução

### 1. Scripts Disponíveis

#### A. Script SQL (`docs/unify-duplicate-categories.sql`)
- Análise manual das duplicatas
- Execução direta no banco de dados
- Requer conhecimento de SQL

#### B. Script TypeScript (`lib/unify-categories.ts`)
- Análise automática e inteligente
- Modo simulação seguro
- Integrado com a aplicação

#### C. Script de Execução (`scripts/unify-categories.js`)
- Interface simples para executar
- Confirmação antes de executar

### 2. Categorias Mapeadas

O sistema identifica e unifica automaticamente:

| Categoria Final | Variações Detectadas |
|----------------|---------------------|
| **Bebidas** | bebida, bebidas |
| **Limpeza** | limpeza, produtos de limpeza, limpeza domestica |
| **Higiene** | higiene, higiene pessoal, produtos de higiene |
| **Carnes** | carne, carnes, proteinas, proteína |
| **Frutas** | fruta, frutas |
| **Verduras** | verdura, verduras, legumes, vegetais |
| **Doces** | doce, doces, sobremesa, sobremesas |
| **Temperos** | tempero, temperos, condimento, condimentos |
| **Grãos** | graos, grãos, cereais, cereal |
| **Laticínios** | laticinios, laticínios, derivados do leite |
| **Padaria** | padaria, paes, pães, panificados |
| **Congelados** | congelado, congelados, frozen |
| **Pet** | pet, animais, animal de estimação |
| **Bebê** | bebe, bebê, infantil, criança |

## Como Usar

### Método 1: Via Aplicação (Recomendado)

```typescript
import { CategoryUnificationService } from './lib/unify-categories';

// 1. Analisar duplicatas (apenas visualizar)
const duplicates = await CategoryUnificationService.analyzeDuplicateCategories();

// 2. Simulação completa (seguro)
const results = await CategoryUnificationService.cleanupCategories(true);

// 3. Execução real (cuidado!)
const results = await CategoryUnificationService.cleanupCategories(false);
```

### Método 2: Via Script

```bash
# Executar script de unificação
node scripts/unify-categories.js
```

### Método 3: Via SQL (Avançado)

```sql
-- Executar queries do arquivo
\i docs/unify-duplicate-categories.sql
```

## Processo de Unificação

### 1. Análise
- Identifica categorias com nomes similares
- Conta produtos vinculados a cada categoria
- Determina qual categoria manter

### 2. Seleção da Categoria Principal
Critérios de prioridade:
1. **Nome preferido** (ex: "Bebidas" vs "Bebida")
2. **Mais produtos** vinculados
3. **Mais antiga** (created_at)

### 3. Unificação
1. **Atualiza produtos**: Move todos os produtos para a categoria principal
2. **Padroniza dados**: Atualiza ícone e cor da categoria
3. **Remove duplicatas**: Exclui categorias redundantes
4. **Limpa órfãs**: Remove categorias sem produtos

## Segurança

### Modo Simulação
- **Sempre execute primeiro** em modo simulação (`dryRun: true`)
- Mostra exatamente o que será feito
- Não modifica dados reais

### Backup
- **Faça backup** do banco antes de executar
- Teste em ambiente de desenvolvimento primeiro

### Logs Detalhados
```
🔍 Analisando categorias duplicadas...
📊 Categorias duplicadas encontradas:
  Bebidas: bebida, bebidas
  Limpeza: limpeza, produtos de limpeza

📝 Bebidas:
  Manter: Bebidas (uuid-123)
  Remover: bebida

✅ Bebidas: 1 categorias unificadas
```

## Resultados Esperados

### Antes
```
- bebida (5 produtos)
- bebidas (12 produtos)
- limpeza (8 produtos)
- produtos de limpeza (3 produtos)
```

### Depois
```
- Bebidas (17 produtos) ✅
- Limpeza (11 produtos) ✅
```

## Troubleshooting

### Erro: "Categoria não encontrada"
- Verifique se as categorias ainda existem
- Execute análise primeiro

### Erro: "Constraint violation"
- Pode haver produtos específicos vinculados
- Verifique foreign keys

### Erro: "Permission denied"
- Verifique permissões do usuário no banco
- Use usuário com privilégios adequados

## Manutenção

### Prevenção de Duplicatas
1. **Validação no frontend**: Verificar nomes similares antes de criar
2. **Busca inteligente**: Sugerir categorias existentes
3. **Normalização**: Converter para lowercase na comparação

### Monitoramento
```sql
-- Query para detectar possíveis duplicatas
SELECT 
  LOWER(TRIM(name)) as normalized_name,
  COUNT(*) as count,
  STRING_AGG(name, ', ') as variations
FROM categories 
GROUP BY LOWER(TRIM(name))
HAVING COUNT(*) > 1;
```

## Exemplo Completo

```typescript
// 1. Importar serviço
import { CategoryUnificationService } from './lib/unify-categories';

// 2. Executar limpeza completa
async function cleanupCategories() {
  try {
    // Simulação primeiro
    console.log('=== SIMULAÇÃO ===');
    const simulation = await CategoryUnificationService.cleanupCategories(true);
    
    // Confirmar com usuário
    const confirm = confirm('Executar unificação real?');
    
    if (confirm) {
      console.log('=== EXECUÇÃO REAL ===');
      const results = await CategoryUnificationService.cleanupCategories(false);
      console.log('✅ Categorias unificadas com sucesso!');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}
```

## Considerações Finais

- **Sempre teste** em ambiente de desenvolvimento primeiro
- **Faça backup** antes de executar em produção
- **Execute simulação** para verificar resultados
- **Monitore** a aplicação após a unificação
- **Documente** quaisquer categorias customizadas que não devem ser unificadas