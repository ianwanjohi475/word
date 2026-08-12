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

// pdf-lib pulls in `tslib`, whose package "exports" prefer an ESM build that
// Metro's CJS interop resolves to `default: undefined` (crashes with
// "Cannot destructure property '__extends' of 'tslib.default'"). Force the
// CommonJS build so the interop works on every platform.
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'tslib') {
    return context.resolveRequest(context, 'tslib/tslib.js', platform);
  }
  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
