module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxImportSource: undefined,
          jsxRuntime: 'automatic',
        },
      ],
    ],
    plugins: [
      // React Native Reanimated plugin must be last
      'react-native-reanimated/plugin',
    ],
  };
};