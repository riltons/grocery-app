# Sistema de Toast

## Visão Geral

O sistema de toast substitui os pop-ups nativos (Alert.alert) por notificações mais elegantes e modernas. O sistema é composto por:

- **Toast Component** - Componente visual da notificação
- **ToastContext** - Contexto React para gerenciar estado global
- **ConfirmDialog** - Componente para confirmações que substituem Alert.alert com botões

## Componentes

### 1. Toast (`components/Toast.tsx`)

Componente visual que exibe a notificação com animações suaves.

**Tipos de Toast:**
- `success` - Verde, para operações bem-sucedidas
- `error` - Vermelho, para erros
- `warning` - Laranja, para avisos
- `info` - Azul, para informações

**Características:**
- Animação de entrada/saída suave
- Auto-dismiss configurável (padrão: 4 segundos)
- Botão de fechar manual
- Ícones apropriados para cada tipo
- Posicionamento no topo da tela

### 2. ToastContext (`context/ToastContext.tsx`)

Contexto React que gerencia o estado global dos toasts.

**Métodos disponíveis:**
```typescript
const { 
  showSuccess, 
  showError, 
  showWarning, 
  showInfo,
  showToast,
  hideToast,
  hideAllToasts 
} = useToast();
```

### 3. ConfirmDialog (`components/ConfirmDialog.tsx`)

Componente para substituir `Alert.alert` com confirmações.

**Características:**
- Modal customizável
- Botões de confirmar/cancelar
- Ícones personalizáveis
- Estado de loading
- Cores customizáveis

## Como Usar

### 1. Configuração Inicial

O `ToastProvider` já está configurado no `app/_layout.tsx`:

```typescript
import { ToastProvider } from '../context/ToastContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ToastProvider>
          {/* Suas telas aqui */}
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
```

### 2. Usando Toast em Componentes

```typescript
import { useToast } from '../context/ToastContext';

export default function MyComponent() {
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  const handleSuccess = () => {
    showSuccess('Sucesso!', 'Operação realizada com sucesso');
  };

  const handleError = () => {
    showError('Erro', 'Algo deu errado');
  };

  const handleWarning = () => {
    showWarning('Atenção', 'Verifique os dados informados');
  };

  const handleInfo = () => {
    showInfo('Informação', 'Dados atualizados');
  };

  // Toast customizado
  const handleCustom = () => {
    showToast({
      type: 'success',
      title: 'Custom Toast',
      message: 'Mensagem personalizada',
      duration: 6000 // 6 segundos
    });
  };

  return (
    // Seu componente aqui
  );
}
```

### 3. Usando ConfirmDialog

```typescript
import { useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';

export default function MyComponent() {
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);
      // Sua lógica de exclusão aqui
      await deleteItem();
      setShowDialog(false);
    } catch (error) {
      // Tratar erro
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TouchableOpacity onPress={() => setShowDialog(true)}>
        <Text>Excluir</Text>
      </TouchableOpacity>

      <ConfirmDialog
        visible={showDialog}
        title="Excluir Item"
        message="Tem certeza que deseja excluir este item?"
        confirmText="Excluir"
        cancelText="Cancelar"
        confirmColor="#ef4444"
        icon="trash"
        iconColor="#ef4444"
        loading={loading}
        onConfirm={handleDelete}
        onCancel={() => setShowDialog(false)}
      />
    </>
  );
}
```

## Migração de Alert.alert

### Antes (Alert.alert)
```typescript
import { Alert } from 'react-native';

// Toast simples
Alert.alert('Erro', 'Mensagem de erro');

// Confirmação
Alert.alert(
  'Confirmar',
  'Tem certeza?',
  [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'OK', onPress: () => handleConfirm() }
  ]
);
```

### Depois (Toast System)
```typescript
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/ConfirmDialog';

// Toast simples
const { showError } = useToast();
showError('Erro', 'Mensagem de erro');

// Confirmação
const [showDialog, setShowDialog] = useState(false);

<ConfirmDialog
  visible={showDialog}
  title="Confirmar"
  message="Tem certeza?"
  onConfirm={handleConfirm}
  onCancel={() => setShowDialog(false)}
/>
```

## Exemplos Práticos

### 1. Operação de Sucesso
```typescript
const handleSave = async () => {
  try {
    await saveData();
    showSuccess('Salvo!', 'Dados salvos com sucesso');
  } catch (error) {
    showError('Erro', 'Não foi possível salvar');
  }
};
```

### 2. Validação de Formulário
```typescript
const handleSubmit = () => {
  if (!isValid) {
    showWarning('Atenção', 'Preencha todos os campos obrigatórios');
    return;
  }
  // Continuar com submit
};
```

### 3. Informação ao Usuário
```typescript
const handleSync = async () => {
  showInfo('Sincronizando', 'Atualizando dados...');
  await syncData();
  showSuccess('Concluído', 'Dados sincronizados');
};
```

### 4. Confirmação de Exclusão
```typescript
const [showDeleteDialog, setShowDeleteDialog] = useState(false);
const [deleting, setDeleting] = useState(false);

const confirmDelete = async () => {
  try {
    setDeleting(true);
    await deleteItem();
    showSuccess('Excluído', 'Item removido com sucesso');
    setShowDeleteDialog(false);
  } catch (error) {
    showError('Erro', 'Não foi possível excluir');
  } finally {
    setDeleting(false);
  }
};

<ConfirmDialog
  visible={showDeleteDialog}
  title="Excluir Item"
  message="Esta ação não pode ser desfeita"
  confirmText="Excluir"
  confirmColor="#ef4444"
  icon="trash"
  iconColor="#ef4444"
  loading={deleting}
  onConfirm={confirmDelete}
  onCancel={() => setShowDeleteDialog(false)}
/>
```

## Personalização

### Toast Customizado
```typescript
showToast({
  type: 'success',
  title: 'Título Personalizado',
  message: 'Mensagem detalhada aqui',
  duration: 8000 // 8 segundos
});
```

### Dialog Customizado
```typescript
<ConfirmDialog
  visible={showDialog}
  title="Título Custom"
  message="Mensagem personalizada"
  confirmText="Confirmar"
  cancelText="Cancelar"
  confirmColor="#4CAF50" // Verde
  icon="checkmark-circle"
  iconColor="#4CAF50"
  loading={loading}
  onConfirm={handleConfirm}
  onCancel={handleCancel}
/>
```

## Boas Práticas

### 1. Tipos de Toast
- **Success**: Operações concluídas com sucesso
- **Error**: Erros que impedem a operação
- **Warning**: Avisos que não impedem a operação
- **Info**: Informações gerais ao usuário

### 2. Mensagens
- **Título**: Curto e descritivo (máx. 30 caracteres)
- **Mensagem**: Detalhes adicionais se necessário
- **Linguagem**: Clara e amigável ao usuário

### 3. Duração
- **Success/Info**: 4 segundos (padrão)
- **Warning**: 5-6 segundos
- **Error**: 6-8 segundos (mais tempo para ler)

### 4. Confirmações
- Use ConfirmDialog para ações destrutivas
- Sempre inclua contexto na mensagem
- Use cores apropriadas (vermelho para exclusão)
- Implemente estado de loading

## Arquivos Atualizados

Os seguintes arquivos foram atualizados para usar o sistema de toast:

### Páginas de Lojas
- `app/stores/index.tsx` - Lista de lojas
- `app/stores/[id].tsx` - Detalhes da loja
- `app/stores/price-search.tsx` - Pesquisa de preços
- `app/stores/new.tsx` - Nova loja

### Página Principal
- `app/home.tsx` - Tela inicial

### Layout
- `app/_layout.tsx` - Configuração do ToastProvider

## Benefícios

### UX Melhorada
- Notificações menos intrusivas
- Animações suaves
- Design moderno e consistente
- Melhor acessibilidade

### DX Melhorada
- API mais simples e consistente
- Melhor controle sobre estado
- Fácil personalização
- Reutilização de componentes

### Performance
- Renderização otimizada
- Gerenciamento eficiente de estado
- Animações nativas performáticas