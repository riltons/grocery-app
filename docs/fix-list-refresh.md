# Correção: Atualização Automática de Listas na Home

## Problema
Ao clonar uma lista e retornar à página das listas, a nova lista não aparecia automaticamente, sendo necessário atualizar a página manualmente (pull-to-refresh).

## Causa
A página home (`app/(tabs)/home.tsx`) não estava recarregando as listas automaticamente quando o usuário voltava para ela após realizar ações em outras telas.

## Solução
Implementado o hook `useFocusEffect` do Expo Router para recarregar as listas automaticamente sempre que a tela home voltar ao foco.

### Mudanças Realizadas

#### 1. Import do useFocusEffect
```typescript
import { useRouter, useFocusEffect } from 'expo-router';
```

#### 2. Adição do Hook de Foco
```typescript
// Recarregar listas quando a tela voltar ao foco (após criar/clonar listas)
useFocusEffect(
  useCallback(() => {
    loadLists();
  }, [loadLists])
);
```

## Benefícios
- ✅ Listas clonadas aparecem automaticamente na home
- ✅ Listas criadas aparecem automaticamente na home
- ✅ Listas editadas/excluídas são atualizadas automaticamente
- ✅ Experiência do usuário mais fluida
- ✅ Não interfere com o pull-to-refresh existente

## Comportamento
- Quando o usuário clona uma lista e escolhe "Continuar Aqui", ao voltar para a home a lista clonada já estará visível
- Quando o usuário clona uma lista e escolhe "Ver Lista Clonada", ao voltar para a home posteriormente, a lista estará visível
- Funciona para qualquer ação que modifique as listas e depois navegue de volta para a home

## Padrão Aplicado
Este mesmo padrão já estava sendo usado em outras telas do app (como `app/product/index.tsx`), garantindo consistência na experiência do usuário.