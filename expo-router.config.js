// @ts-check

/** @type {import('@expo/config').ExpoConfig} */
const config = {
  name: 'grocery',
  slug: 'grocery',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    edgeToEdgeEnabled: true,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  scheme: 'grocery',
  plugins: [
    [
      'expo-router',
      {
        origin: 'https://grocery.app',
      },
    ],
  ],
};

module.exports = config;
