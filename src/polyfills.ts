/**
 * Runtime polyfills that must load before any file-generation library.
 *
 * `docx`, `xlsx` (SheetJS) and `pdf-lib` were written for Node/browsers and
 * reach for `Buffer` / `process` which don't exist in the React Native JS
 * runtime. We install minimal shims here and import this module at the very top
 * of the root layout so it runs first.
 */
import { Buffer } from 'buffer';

const g = globalThis as unknown as {
  Buffer?: typeof Buffer;
  process?: { env?: Record<string, string>; browser?: boolean; version?: string };
};

if (typeof g.Buffer === 'undefined') {
  g.Buffer = Buffer;
}

if (typeof g.process === 'undefined') {
  g.process = { env: {}, browser: true, version: '' };
} else {
  g.process.env = g.process.env ?? {};
  if (g.process.browser === undefined) g.process.browser = true;
}
