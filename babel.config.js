module.exports = function (api) {
  api.cache(true);
  
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Reanimated (deve ser o último)
      'react-native-reanimated/plugin',
    ],
  };
};
