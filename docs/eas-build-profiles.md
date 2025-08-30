# Perfis de Build EAS

Este documento descreve os diferentes perfis de build configurados no `eas.json` para o projeto.

## Perfis Disponíveis

### 🚀 production (Recomendado para Deploy)
```bash
eas build --platform android --profile production
```
- **Tipo:** APK
- **Uso:** Deploy padrão para distribuição direta
- **Vantagem:** Arquivo APK pronto para instalação
- **Quando usar:** Para todos os deploys normais

### 📦 production-aab
```bash
eas build --platform android --profile production-aab
```
- **Tipo:** Android App Bundle (AAB)
- **Uso:** Submissão para Google Play Store
- **Vantagem:** Otimizado para distribuição na loja
- **Quando usar:** Apenas para publicação na Play Store

### 🔧 development
```bash
eas build --platform android --profile development
```
- **Tipo:** APK com Development Client
- **Uso:** Desenvolvimento e testes
- **Vantagem:** Permite hot reload e debugging
- **Quando usar:** Durante desenvolvimento

### 👀 preview
```bash
eas build --platform android --profile preview
```
- **Tipo:** APK
- **Uso:** Testes internos e demonstrações
- **Vantagem:** Build rápido para testes
- **Quando usar:** Para compartilhar versões de teste

### ⚡ simple
```bash
eas build --platform android --profile simple
```
- **Tipo:** APK
- **Uso:** Build simplificado sem sincronização de capacidades
- **Vantagem:** Build mais rápido
- **Quando usar:** Para testes rápidos

### 📱 apk
```bash
eas build --platform android --profile apk
```
- **Tipo:** APK com comando Gradle customizado
- **Uso:** Build APK com configurações específicas
- **Vantagem:** Controle total sobre o processo de build
- **Quando usar:** Para builds com requisitos específicos

## Comando Recomendado para Deploy

Para deploys futuros, use sempre:
```bash
eas build --platform android --profile production
```

Este comando irá gerar um APK pronto para distribuição direta, que é o que precisamos na maioria dos casos.

## Histórico de Mudanças

- **Antes:** Perfil `production` gerava AAB
- **Agora:** Perfil `production` gera APK (mais prático)
- **Novo:** Perfil `production-aab` para quando precisar de AAB

Esta mudança torna o processo de deploy mais eficiente, gerando diretamente o formato que mais utilizamos.