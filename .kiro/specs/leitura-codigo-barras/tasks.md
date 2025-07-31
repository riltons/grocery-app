# Plano de Implementação - Leitura de Código de Barras

- [x] 1. Configurar dependências e permissões para câmera





  - Instalar expo-camera e expo-barcode-scanner
  - Configurar permissões de câmera no app.json
  - Instalar dependências para processamento de códigos de barras
  - _Requisitos: 1.1, 1.2, 1.3_

- [x] 2. Implementar componente base BarcodeScanner









  - [x] 2.1 Criar componente CameraView com interface de escaneamento





    - Implementar visualização da câmera com overlay de escaneamento
    - Adicionar controles de flash e foco automático
    - Implementar feedback visual para área de escaneamento
    - _Requisitos: 1.1, 7.1, 7.2_

  - [x] 2.2 Implementar detecção de códigos de barras




    - Configurar detecção para formatos EAN-13, EAN-8, UPC-A, UPC-E, QR
    - Implementar callback para códigos detectados
    - Adicionar validação de formato de código de barras
    - _Requisitos: 1.3, 5.1, 5.2_


  - [x] 2.3 Adicionar tratamento de erros de câmera







    - Implementar verificação de permissões
    - Tratar cenários de câmera indisponível
    - Adicionar fallback para entrada manual
    - _Requisitos: 1.1, 4.1, 4.3_

- [x] 3. Criar serviço BarcodeService para processamento





  - [x] 3.1 Implementar busca local de produtos por código de barras


    - Criar função para buscar produtos específicos existentes por código
    - Implementar cache local para códigos escaneados anteriormente
    - Adicionar verificação de dados frescos vs. expirados
    - _Requisitos: 2.1, 2.2_



  - [x] 3.2 Integrar API Cosmos para produtos brasileiros

    - Implementar CosmosService com autenticação
    - Criar mapeamento de dados Cosmos para ProductInfo
    - Implementar extração de peso/volume do nome do produto
    - Adicionar tratamento de erros e retry para API

    - _Requisitos: 3.1, 3.3_

  - [x] 3.3 Integrar Open Food Facts como fallback

    - Implementar OpenFoodFactsService
    - Criar transformação de dados nutricionais
    - Implementar busca por código de barras internacional
    - _Requisitos: 3.1, 3.3_

  - [x] 3.4 Implementar lógica de fallback entre APIs


    - Criar estratégia de busca em cascata (local → Cosmos → Open Food Facts)
    - Implementar cache inteligente com TTL dinâmico
    - Adicionar métricas de confiança para cada fonte
    - _Requisitos: 2.1, 2.2, 3.1_

- [x] 4. Implementar associação com produtos genéricos





  - [x] 4.1 Criar função de identificação automática de produtos genéricos


    - Implementar algoritmo de matching por nome e categoria
    - Criar mapeamento de categorias externas para categorias internas
    - Implementar busca fuzzy para produtos genéricos similares
    - _Requisitos: 3.1, 3.3_

  - [x] 4.2 Implementar sugestões de produtos genéricos


    - Criar função para sugerir múltiplos produtos genéricos
    - Implementar ranking por similaridade e popularidade
    - Adicionar suporte para produtos essencialmente genéricos (frutas/verduras)
    - _Requisitos: 3.1, 3.3_

  - [x] 4.3 Criar função para criação de produtos específicos


    - Implementar criação de produto específico vinculado ao genérico
    - Adicionar validação de dados obrigatórios
    - Implementar salvamento no banco de dados com RLS
    - _Requisitos: 3.1, 3.3, 3.4_

- [x] 5. Desenvolver interface ScanResultModal





  - [x] 5.1 Criar modal de confirmação de produto escaneado


    - Implementar layout com informações do produto detectado
    - Adicionar visualização de imagem do produto quando disponível
    - Criar seção para seleção de produto genérico
    - _Requisitos: 1.4, 3.4_

  - [x] 5.2 Implementar seletor de produto genérico


    - Criar dropdown/picker para produtos genéricos sugeridos
    - Implementar busca de produtos genéricos dentro do modal
    - Adicionar opção para criar novo produto genérico se necessário
    - _Requisitos: 3.4_

  - [x] 5.3 Adicionar campos de edição de produto


    - Permitir edição de nome, marca, categoria antes da confirmação
    - Implementar validação de campos obrigatórios
    - Adicionar preview das alterações
    - _Requisitos: 3.4_

  - [x] 5.4 Integrar entrada de preço opcional


    - Adicionar campos para preço e loja
    - Implementar sugestão automática de loja via geolocalização
    - Criar validação de formato de preço
    - _Requisitos: 6.1, 6.2, 6.3_

- [x] 6. Integrar com sistema existente de produtos







  - [x] 6.1 Modificar AddProductInterface para incluir scanner


    - Adicionar botão de scanner de código de barras
    - Integrar BarcodeScanner com fluxo existente
    - Manter compatibilidade com adição manual
    - _Requisitos: 1.1_


  - [x] 6.2 Atualizar ProductSelector com produtos escaneados

    - Modificar para exibir produtos específicos criados via scanner
    - Implementar filtros para produtos com código de barras
    - Adicionar indicadores visuais para produtos escaneados
    - _Requisitos: 1.1, 1.4_

  - [x] 6.3 Estender banco de dados para códigos de barras


    - Adicionar colunas barcode, barcode_type, external_id na tabela specific_products
    - Criar índices para busca rápida por código de barras
    - Implementar migração de dados existentes
    - _Requisitos: 2.1, 2.2, 3.1_

- [x] 7. Implementar otimizações de performance





  - [x] 7.1 Otimizar detecção de códigos de barras


    - Implementar região de interesse para focar detecção
    - Configurar frame rate otimizado para bateria vs. velocidade
    - Adicionar debounce para evitar múltiplas detecções
    - _Requisitos: 4.1, 4.2_

  - [x] 7.2 Implementar cache inteligente


    - Criar sistema de cache com TTL baseado em popularidade
    - Implementar compressão de dados JSON para economizar espaço
    - Adicionar limpeza automática de cache antigo
    - _Requisitos: 2.1, 2.2_

  - [x] 7.3 Otimizar uso de câmera e bateria


    - Implementar auto-desligamento da câmera após inatividade
    - Configurar resolução adaptativa baseada no dispositivo
    - Otimizar uso do flash automático
    - _Requisitos: 4.1, 7.1, 7.2_

- [ ] 8. Implementar tratamento de cenários especiais
  - [ ] 8.1 Adicionar suporte para modo offline
    - Implementar criação de produtos offline para sincronização posterior
    - Criar fila de sincronização para quando conexão for restaurada
    - Adicionar indicadores visuais de status offline/online
    - _Requisitos: 2.1, 2.2, 2.3_

  - [ ] 8.2 Tratar códigos de barras não reconhecidos
    - Implementar fluxo para criação manual de produto com código
    - Adicionar sugestões baseadas em códigos similares
    - Permitir associação com produtos genéricos existentes
    - _Requisitos: 3.1, 3.4_

  - [ ] 8.3 Implementar feedback para diferentes condições de iluminação
    - Adicionar detecção automática de condições de luz
    - Implementar sugestões visuais para melhor posicionamento
    - Configurar ajuste automático de exposição da câmera
    - _Requisitos: 7.1, 7.2, 7.3_

- [ ] 9. Criar testes unitários e de integração
  - [ ] 9.1 Implementar testes para BarcodeService
    - Testar busca local com diferentes cenários de cache
    - Testar integração com APIs externas (mock)
    - Testar lógica de fallback entre fontes de dados
    - _Requisitos: 2.1, 3.1, 3.3_

  - [ ] 9.2 Testar componentes de interface
    - Testar BarcodeScanner com diferentes tipos de código
    - Testar ScanResultModal com diferentes estados de dados
    - Testar integração com AddProductInterface
    - _Requisitos: 1.1, 1.4, 3.4_

  - [ ] 9.3 Implementar testes de performance
    - Testar tempo de detecção de códigos de barras
    - Medir uso de memória durante escaneamento prolongado
    - Testar impacto na bateria do dispositivo
    - _Requisitos: 4.1, 4.2_

- [ ] 10. Documentar e finalizar implementação
  - [ ] 10.1 Criar documentação de uso
    - Documentar fluxo de escaneamento para usuários
    - Criar guia de troubleshooting para problemas comuns
    - Documentar limitações e requisitos de dispositivo
    - _Requisitos: 1.1, 4.3, 7.1_

  - [ ] 10.2 Implementar analytics e monitoramento
    - Adicionar métricas de uso da funcionalidade
    - Implementar tracking de taxa de sucesso de detecção
    - Monitorar performance das APIs externas
    - _Requisitos: 4.1, 4.2_

  - [ ] 10.3 Realizar testes finais de integração
    - Testar fluxo completo de escaneamento → confirmação → adição à lista
    - Validar compatibilidade com diferentes dispositivos
    - Testar cenários de erro e recuperação
    - _Requisitos: 1.1, 1.4, 2.1, 3.1_