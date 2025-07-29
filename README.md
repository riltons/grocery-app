# Lista de Supermercado - App React Native

Um aplicativo móvel completo para gerenciamento de listas de compras, produtos e preços, desenvolvido com React Native, Expo e Supabase.

## 🚀 Funcionalidades Implementadas

### ✅ Autenticação
- Login e registro com email/senha
- Recuperação de senha
- Gerenciamento de sessões
- Logout seguro

### ✅ Gestão de Listas
- Criar, editar e excluir listas de compras
- Adicionar itens às listas
- Marcar itens como comprados
- Visualização detalhada dos itens
- Navegação intuitiva entre listas

### ✅ Gestão de Produtos
- Cadastro de produtos genéricos e específicos
- Categorização de produtos
- Sistema hierárquico (produto genérico → produto específico)
- Busca e filtros
- Seletor inteligente com sugestões baseadas no histórico

### ✅ Gestão de Lojas
- Cadastro de lojas com nome e endereço
- Listagem e busca de lojas
- Edição e exclusão de lojas
- Estatísticas por loja

### ✅ Sistema de Preços
- Registro manual de preços por produto e loja
- Histórico completo de preços
- Visualização de tendências
- Comparação entre lojas

### ✅ Interface de Usuário
- Design moderno e intuitivo
- Componentes reutilizáveis
- Navegação fluida
- Feedback visual adequado
- Responsividade

## 🛠️ Tecnologias Utilizadas

- **React Native** - Framework para desenvolvimento mobile
- **Expo** - Plataforma de desenvolvimento e build
- **TypeScript** - Tipagem estática
- **Supabase** - Backend as a Service (autenticação, banco de dados, APIs)
- **PostgreSQL** - Banco de dados relacional
- **Expo Router** - Navegação baseada em arquivos
- **Expo Vector Icons** - Ícones
- **AsyncStorage** - Armazenamento local

## 📱 Estrutura do Projeto

```
├── app/                    # Telas da aplicação (Expo Router)
│   ├── (auth)/            # Telas de autenticação
│   ├── list/              # Telas de listas
│   ├── product/           # Telas de produtos
│   ├── stores/            # Telas de lojas
│   ├── home.tsx           # Tela principal
│   └── index.tsx          # Tela inicial
├── components/            # Componentes reutilizáveis
│   ├── CategorySelector.tsx
│   ├── CreateListModal.tsx
│   ├── ListCard.tsx
│   ├── PriceHistoryModal.tsx
│   └── ProductSelector.tsx
├── context/               # Contextos React
│   └── AuthContext.tsx
├── lib/                   # Serviços e utilitários
│   ├── auth.ts
│   ├── lists.ts
│   ├── products.ts
│   ├── stores.ts
│   └── supabase.ts
└── docs/                  # Documentação
    └── plano-implementacao.md
```

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais
- **auth.users** - Usuários (gerenciado pelo Supabase)
- **generic_products** - Produtos genéricos (ex: "Arroz")
- **specific_products** - Produtos específicos (ex: "Arroz Tio João 1kg")
- **lists** - Listas de compras
- **list_items** - Itens das listas
- **list_item_products** - Relacionamento entre itens e produtos
- **stores** - Lojas/supermercados
- **price_history** - Histórico de preços

### Relacionamentos
- Produtos específicos pertencem a produtos genéricos
- Itens de lista podem ter produtos específicos associados
- Histórico de preços relaciona produtos específicos com lojas
- Todas as tabelas têm RLS (Row Level Security) implementado

## 🚀 Como Executar

### Pré-requisitos
- Node.js (versão 18 ou superior)
- npm ou yarn
- Expo CLI
- Conta no Supabase

### Instalação
1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente no `app.json`:
   ```json
   {
     "expo": {
       "extra": {
         "supabaseUrl": "sua-url-do-supabase",
         "supabaseAnonKey": "sua-chave-anonima"
       }
     }
   }
   ```

4. Execute o projeto:
   ```bash
   npm start
   ```

## 📋 Próximas Implementações

### 🔄 Em Desenvolvimento
- Temas claro/escuro
- Melhorias na UX/UI
- Animações e transições

### 📋 Planejado
- Leitura de código de barras
- Compartilhamento de listas
- Colaboração em tempo real
- Modo offline
- Análise de tendências de preços
- Integração com APIs de supermercados
- OCR para leitura de preços
- Geolocalização de lojas

## 🤝 Contribuição

Este projeto está em desenvolvimento ativo. Contribuições são bem-vindas!

## 📄 Licença

Este projeto está sob a licença MIT.

---

**Desenvolvido com ❤️ usando React Native e Supabase**