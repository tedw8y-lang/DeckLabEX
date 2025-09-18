module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxImportSource: '@tamagui/core',
          jsxRuntime: 'automatic',
        },
      ],
    ],
    plugins: [
      ['@tamagui/babel-plugin', { components: ['tamagui'], disableExtraction: false }],
      // React Native Reanimated plugin must be last
      'react-native-reanimated/plugin',
    ],
  };
};