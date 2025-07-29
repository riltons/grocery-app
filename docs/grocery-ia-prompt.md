# Prompt para Gerador de Código IA - App Lista de Supermercado

Crie um aplicativo mobile de lista de supermercado utilizando a stack:
- React Native com Expo
- Expo Router (roteamento por arquivos)
- Shadcn/UI adaptado para React Native
- Supabase (PostgreSQL, Auth, Storage, Functions)
- AsyncStorage para offline

## Funcionalidades Essenciais

- Gestão de múltiplas listas, com compartilhamento e colaboração em tempo real.
- Cadastro de produtos em dois níveis: genéricos (ex: arroz, café) e específicos (ex: Arroz Mariano 1kg), com relação hierárquica.
- Adição manual, leitura de código de barras, pesquisa por voz e imagem.
- Visualização em árvore dos itens: produtos específicos aninhados sob genéricos.
- Rastreamento, análise e histórico de preços via IA (OpenAI API, web scraping, APIs de supermercados).
- Gráficos de evolução de preços, alertas de ofertas e recomendações inteligentes.
- Planejamento financeiro: orçamento, relatórios, exportação de dados.
- Interface minimalista, temas claro/escuro, acessibilidade completa.
- Autenticação segura (biometria, SSO), criptografia, consentimento LGPD.

## Estrutura de Dados 

- Tabelas: generic_products, specific_products, list_items, list_item_products, stores, users.
- Políticas RLS para segurança por usuário.
- Integração com Supabase pgvector para embeddings de produtos e histórico de compras.

## Fluxos de Usuário

1. Onboarding com tutorial interativo.
2. Criação de lista, adição de produtos genéricos.
3. Durante a compra, seleção de produtos específicos vinculados ao genérico.
4. Visualização de histórico de preços e alertas de ofertas.
5. Compartilhamento e colaboração em listas.

## Requisitos de UX/UI

- Navegação fluida (máximo 3 toques para ações principais).
- Feedback visual e tátil.
- Modo de compra otimizado para uso no supermercado (marcação rápida, scanner de preços).
- Suporte a gestos e comandos de voz.

## Testes e Métricas

- Cobertura de testes unitários e integração.
- Monitoramento de performance (tempo de carregamento, uso de memória).
- Métricas de engajamento e economia gerada.

Implemente o projeto seguindo as melhores práticas de arquitetura, performance e segurança para dispositivos móveis.
