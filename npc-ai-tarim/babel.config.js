// babel.config.js dosyasının son ve en güncel hali

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // Bu satır, NativeWind'in stilleri doğru işlemesi için JSX kaynağını ayarlar
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      // Bu satır, NativeWind'in kendisidiraa
      'nativewind/babel',
    ],
    plugins: [
      // Bu eklenti, animasyonların çalışması için KESİNLİKLE GEREKLİDİR.
      'react-native-worklets/plugin',
    ],
  };
};