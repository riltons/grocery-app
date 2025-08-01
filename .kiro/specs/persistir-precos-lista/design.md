# Design Document

## Overview

Este documento descreve o design para implementar a persistência de preços dos produtos nas listas de compras. A solução envolve modificações no banco de dados, atualização dos tipos TypeScript, e ajustes no código da aplicação para salvar e recuperar preços corretamente.

## Architecture

### Database Schema Changes

A tabela `list_items` será modificada para incluir uma coluna `price`:

```sql
ALTER TABLE list_items ADD COLUMN price DECIMAL(10,2) NULL;
```

### Data Flow

1. **Marcar como comprado com preço:**
   - Usuário marca produto como comprado
   - Modal de preço é exibido
   - Usuário informa preço
   - Sistema salva `checked: true` e `price: valor` no banco

2. **Carregar lista:**
   - Sistema busca itens da lista incluindo preços
   - Preços são exibidos nos produtos comprados
   - Total é calculado baseado nos preços salvos

3. **Editar preço:**
   - Usuário toca em produto comprado
   - Modal de edição de preço é exibido
   - Sistema atualiza preço no banco

## Components and Interfaces

### Database Layer

**Tabela list_items (modificada):**
```sql
CREATE TABLE list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  unit VARCHAR(50) NOT NULL,
  checked BOOLEAN DEFAULT FALSE,
  price DECIMAL(10,2) NULL, -- Nova coluna
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);
```

### TypeScript Types

**Atualização do tipo ListItem:**
```typescript
export type ListItem = {
  id: string;
  list_id: string;
  quantity: number;
  unit: string;
  checked: boolean;
  price?: number; // Nova propriedade
  created_at: string;
  updated_at: string;
  user_id: string;
};
```

### Service Layer

**ListsService.updateListItem (modificado):**
```typescript
updateListItem: async (listId: string, itemId: string, updates: {
  quantity?: number;
  unit?: string;
  checked?: boolean;
  price?: number; // Nova propriedade
}) => {
  // Implementação que inclui price na atualização
}
```

### UI Components

**PriceInputModal (existente):**
- Já implementado, usado para entrada de preços
- Será reutilizado para edição de preços

**Novo: PriceEditModal**
- Modal específico para editar preços de produtos já comprados
- Pré-preenchido com preço atual
- Opção para remover preço (definir como null)

## Data Models

### ListItem Model (Updated)

```typescript
interface ListItemData {
  id: string;
  list_id: string;
  quantity: number;
  unit: string;
  checked: boolean;
  price?: number; // Opcional, apenas para itens comprados
  created_at: string;
  updated_at: string;
  user_id: string;
  
  // Propriedades derivadas (do join com produtos)
  product_name?: string;
  product_brand?: string;
  product_id?: string;
  generic_product_name?: string;
  category?: string;
}
```

### Price Validation

```typescript
const validatePrice = (price: number | null): boolean => {
  if (price === null || price === undefined) return true;
  return price >= 0 && price <= 999999.99;
};
```

## Error Handling

### Database Errors
- **Migration failure:** Rollback automático, log detalhado
- **Price update failure:** Exibir mensagem de erro, manter estado local
- **Invalid price format:** Validação no frontend antes do envio

### UI Error States
- **Network error:** Retry automático com feedback visual
- **Validation error:** Highlight do campo com mensagem específica
- **Concurrent modification:** Refresh automático dos dados

### Fallback Behavior
- Se preço não pode ser salvo, manter funcionalidade básica (marcar como comprado)
- Se preço não pode ser carregado, exibir item sem preço
- Se total não pode ser calculado, exibir "Calculando..."

## Testing Strategy

### Unit Tests

**Database Operations:**
```typescript
describe('ListsService.updateListItem', () => {
  it('should save price when marking item as purchased', async () => {
    // Test implementation
  });
  
  it('should remove price when unmarking item', async () => {
    // Test implementation
  });
  
  it('should update existing price', async () => {
    // Test implementation
  });
});
```

**Price Validation:**
```typescript
describe('Price Validation', () => {
  it('should accept valid prices', () => {
    // Test valid price formats
  });
  
  it('should reject invalid prices', () => {
    // Test invalid price formats
  });
});
```

### Integration Tests

**End-to-End Flow:**
1. Create list item
2. Mark as purchased with price
3. Verify price is saved
4. Reload list
5. Verify price is displayed
6. Edit price
7. Verify updated price is saved

### Manual Testing Scenarios

1. **Backward Compatibility:**
   - Open existing lists created before migration
   - Verify they load correctly without prices
   - Add prices to old items

2. **Price Persistence:**
   - Add price to item
   - Close and reopen app
   - Verify price is still there

3. **Total Calculation:**
   - Add multiple items with prices
   - Verify total is calculated correctly
   - Edit prices and verify total updates

## Migration Strategy

### Database Migration

```sql
-- Migration: add_price_to_list_items
-- Add price column to list_items table

ALTER TABLE list_items 
ADD COLUMN price DECIMAL(10,2) NULL;

-- Add index for performance on price queries
CREATE INDEX idx_list_items_price ON list_items(price) WHERE price IS NOT NULL;

-- Update updated_at trigger to include price changes
-- (trigger already exists, no changes needed)
```

### Code Migration

1. **Phase 1:** Update types and database schema
2. **Phase 2:** Update service layer to handle prices
3. **Phase 3:** Update UI components to display and edit prices
4. **Phase 4:** Add validation and error handling
5. **Phase 5:** Testing and deployment

### Rollback Plan

If issues occur:
1. **Database:** Remove price column (data loss acceptable for new feature)
2. **Code:** Revert to previous version
3. **Types:** Remove price property from interfaces

## Performance Considerations

### Database Performance
- Price column is nullable, minimal storage impact
- Index on price for future price-based queries
- No impact on existing queries

### UI Performance
- Price display is part of existing item rendering
- No additional network requests needed
- Total calculation is O(n) where n = number of purchased items

### Memory Usage
- Minimal impact: one additional number per list item
- Price formatting cached in component state
- No significant memory increase expected

## Security Considerations

### Data Validation
- Price must be non-negative number
- Maximum price limit to prevent abuse
- Decimal precision limited to 2 places

### Access Control
- Users can only update prices of their own list items
- Existing RLS policies cover price column automatically
- No additional security measures needed

### Data Privacy
- Prices are personal financial data
- Covered by existing user data privacy policies
- No special handling required beyond existing measures