/**
 * Web PWA bootstrap (runs on app start).
 *
 * The SPA (`web.output: "single"`) build uses Expo's default HTML shell, so we
 * inject the PWA manifest, theme color and iOS meta at runtime and register the
 * service worker. Chrome re-checks the manifest after load, so this is enough
 * for "Install app" / "Add to Home Screen" plus offline caching.
 */
const g = globalThis as any;

function ensureLink(rel: string, href: string, extra: Record<string, string> = {}) {
  const doc = g.document;
  if (!doc) return;
  let el = doc.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = doc.createElement('link');
    el.setAttribute('rel', rel);
    doc.head.appendChild(el);
  }
  el.setAttribute('href', href);
  Object.entries(extra).forEach(([k, v]) => el.setAttribute(k, v));
}

function ensureMeta(name: string, content: string) {
  const doc = g.document;
  if (!doc) return;
  let el = doc.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = doc.createElement('meta');
    el.setAttribute('name', name);
    doc.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function setupPwa(): void {
  try {
    if (!g.document) return;

    ensureLink('manifest', '/manifest.json');
    ensureLink('apple-touch-icon', '/apple-touch-icon.png');
    ensureMeta('theme-color', '#0E8C6B');
    ensureMeta('mobile-web-app-capable', 'yes');
    ensureMeta('apple-mobile-web-app-capable', 'yes');
    ensureMeta('apple-mobile-web-app-status-bar-style', 'black-translucent');
    ensureMeta('apple-mobile-web-app-title', 'Converta');

    if (g.navigator?.serviceWorker) {
      g.navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  } catch {
    /* non-fatal */
  }
}
