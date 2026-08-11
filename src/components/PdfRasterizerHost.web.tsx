/**
 * Web stand-in for the PDF rasterizer host.
 *
 * `react-native-webview` has no web build, and PDF input is a native-only
 * feature, so on web this renders nothing. Metro picks this file over
 * `PdfRasterizerHost.tsx` automatically for the web platform.
 */
export function PdfRasterizerHost() {
  return null;
}
