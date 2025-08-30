# Debug do Problema de Build

## Problema
Build do APK falhando com erro "Gradle build failed with unknown error"

## Tentativas realizadas:
1. ✅ Ajustado configurações do gradle.properties (memória, new architecture)
2. ✅ Criado perfis de build mais simples
3. ✅ Removido plugin react-native-edge-to-edge
4. ✅ Simplificado configurações do app.json
5. ✅ Reinstalado dependências com --legacy-peer-deps

## Próximos passos sugeridos:

### Opção 1: Verificar logs detalhados
Acesse o link dos logs do EAS Build para ver o erro específico do Gradle:
https://expo.dev/accounts/sobrinke.dos/projects/grocery-app/builds/[BUILD_ID]#run-gradlew

### Opção 2: Tentar build sem diretório android customizado
```bash
# Backup do diretório android
mv android android-backup

# Tentar build sem android customizado
npx eas build --platform android --profile preview
```

### Opção 3: Verificar dependências problemáticas
Algumas dependências podem estar causando conflitos:
- react-native-edge-to-edge
- expo-camera
- expo-barcode-scanner
- react-native-reanimated

### Opção 4: Usar Expo SDK mais antigo
Voltar para Expo SDK 52 que é mais estável.

## Configurações atuais que podem ajudar:
- newArchEnabled=false
- Memória aumentada para 4GB
- Apenas arquiteturas arm (armeabi-v7a,arm64-v8a)
- React Native 0.76.6 com React 18.3.1