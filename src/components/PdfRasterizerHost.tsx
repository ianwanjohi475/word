/**
 * Off-screen WebView that renders PDF pages to JPEG images using pdf.js.
 *
 * Mounted once at the app root. It registers a sender with the rasterizer
 * bridge; when the pipeline needs to convert a PDF, the bridge injects a render
 * job here and the WebView posts page images back. pdf.js is loaded from a CDN
 * (the device has network at conversion time), keeping the app bundle small.
 */
import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import {
  registerRasterizerBridge,
  handleRasterizerMessage,
  MAX_PDF_PAGES,
  type RasterJob,
} from '@/services/pdfRasterizer';

const PDFJS_VERSION = '3.11.174';

const HTML = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js"></script>
<script>
  var MAX_PAGES = ${MAX_PDF_PAGES};
  function post(obj) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(obj));
  }
  function b64ToBytes(b64) {
    var bin = atob(b64);
    var len = bin.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }
  window.renderPdf = function (id, base64) {
    try {
      if (!window['pdfjsLib']) { post({ id: id, type: 'error', error: 'PDF engine failed to load.' }); return; }
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js';
      var bytes = b64ToBytes(base64);
      pdfjsLib.getDocument({ data: bytes }).promise.then(function (pdf) {
        var count = Math.min(pdf.numPages, MAX_PAGES);
        var chain = Promise.resolve();
        for (var p = 1; p <= count; p++) {
          (function (pageNum) {
            chain = chain.then(function () {
              return pdf.getPage(pageNum).then(function (page) {
                // Render at ~150dpi equivalent for legible OCR.
                var viewport = page.getViewport({ scale: 2.0 });
                var canvas = document.createElement('canvas');
                var ctx = canvas.getContext('2d');
                // Cap the longest side so very large pages stay under data limits.
                var maxSide = 2200;
                var scale = Math.min(1, maxSide / Math.max(viewport.width, viewport.height));
                var vp = page.getViewport({ scale: 2.0 * scale });
                canvas.width = Math.floor(vp.width);
                canvas.height = Math.floor(vp.height);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                return page.render({ canvasContext: ctx, viewport: vp }).promise.then(function () {
                  var dataUrl = canvas.toDataURL('image/jpeg', 0.82);
                  post({ id: id, type: 'page', page: pageNum, dataUrl: dataUrl });
                  canvas.width = 0; canvas.height = 0;
                });
              });
            });
          })(p);
        }
        chain.then(function () { post({ id: id, type: 'done', count: count }); })
             .catch(function (e) { post({ id: id, type: 'error', error: String(e && e.message || e) }); });
      }).catch(function (e) {
        post({ id: id, type: 'error', error: String(e && e.message || e) });
      });
    } catch (e) {
      post({ id: id, type: 'error', error: String(e && e.message || e) });
    }
  };
  post({ type: 'ready' });
</script>
</body>
</html>`;

export function PdfRasterizerHost() {
  const ref = useRef<WebView>(null);

  useEffect(() => {
    const unregister = registerRasterizerBridge((job: RasterJob) => {
      // Escape safely for injection.
      const payload = JSON.stringify(job.base64);
      const idPayload = JSON.stringify(job.id);
      ref.current?.injectJavaScript(
        `window.renderPdf && window.renderPdf(${idPayload}, ${payload}); true;`
      );
    });
    return unregister;
  }, []);

  return (
    <View
      // Kept in the tree but invisible & non-interactive.
      style={{ position: 'absolute', width: 1, height: 1, opacity: 0, top: -9999, left: -9999 }}
      pointerEvents="none"
    >
      <WebView
        ref={ref}
        originWhitelist={['*']}
        source={{ html: HTML }}
        javaScriptEnabled
        domStorageEnabled
        androidLayerType="software"
        onMessage={(e) => {
          try {
            const msg = JSON.parse(e.nativeEvent.data);
            if (msg?.type === 'ready') return;
            void handleRasterizerMessage(msg);
          } catch {
            /* ignore malformed messages */
          }
        }}
      />
    </View>
  );
}
