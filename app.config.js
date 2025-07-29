// app.config.js
module.exports = {
  name: 'Grocery App',
  slug: 'grocery-app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  updates: {
    fallbackToCacheTimeout: 0
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.riltongarcia.groceryapp',
    buildNumber: '1.0.0'
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FFFFFF'
    },
    package: 'com.riltongarcia.groceryapp',
    versionCode: 1
  },
  web: {
    favicon: './assets/favicon.png'
  },
  extra: {
    // Configurações do Supabase
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    
    // Outras variáveis de ambiente
    appEnv: process.env.APP_ENV || 'development',
    apiUrl: process.env.API_URL,
    
    // Habilita logs extras em desenvolvimento
    debug: process.env.APP_ENV === 'development',
  },
  // Configurações específicas para o desenvolvimento
  development: {
    developmentClient: true,
    distribution: 'internal',
  },
  // Configurações de build
  build: {
    env: {
      APP_ENV: process.env.APP_ENV || 'development',
    },
  },
};
