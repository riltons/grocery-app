// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Adiciona resolvers para módulos Node.js que não estão disponíveis no React Native
config.resolver.extraNodeModules = {
  // Fornece polyfills para módulos Node.js comuns
  ...require('node-libs-react-native'),
  events: require.resolve('react-native-event-source'),
  stream: require.resolve('stream-browserify'),
  https: require.resolve('https-browserify'),
  http: require.resolve('stream-http'),
  url: require.resolve('url'),
  crypto: require.resolve('crypto-browserify'),
  vm: require.resolve('vm-browserify'),
  process: require.resolve('process/browser'),
  path: require.resolve('path-browserify'),
  os: require.resolve('os-browserify/browser'),
  fs: false, // Desabilita o módulo fs no cliente
  net: false, // Desabilita o módulo net no cliente
  tls: false, // Desabilita o módulo tls no cliente
  dns: false, // Desabilita o módulo dns no cliente
};

// Configura o source map para melhor depuração
config.transformer.minifierConfig = {
  ...config.transformer.minifierConfig,
  sourceMap: true,
};

// Habilita symlinks
config.resolver.extraNodeModules = new Proxy(
  {},
  {
    get: (target, name) => {
      // Redireciona as importações para node_modules
      if (name in target) {
        return target[name];
      }
      return path.join(process.cwd(), `node_modules/${name}`);
    },
  }
);

module.exports = config;