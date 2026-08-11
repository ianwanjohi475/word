// Learn more: https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// SheetJS (xlsx) and docx ship `.cjs`/`.mjs` assets; make sure Metro resolves them.
config.resolver.sourceExts = Array.from(
  new Set([...config.resolver.sourceExts, 'cjs', 'mjs'])
);

// Let Metro treat the SQLite wasm binary (used by expo-sqlite on web) as an
// asset instead of trying to parse it as JS — required for the web bundle.
config.resolver.assetExts = Array.from(new Set([...config.resolver.assetExts, 'wasm']));

module.exports = config;
