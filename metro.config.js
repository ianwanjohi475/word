// Learn more: https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// SheetJS (xlsx) and docx ship `.cjs`/`.mjs` assets; make sure Metro resolves them.
config.resolver.sourceExts = Array.from(
  new Set([...config.resolver.sourceExts, 'cjs', 'mjs'])
);

module.exports = config;
