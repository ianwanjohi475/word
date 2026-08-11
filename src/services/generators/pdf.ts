/**
 * PDF generator.
 *
 * We render a styled HTML document and let `expo-print` produce a real,
 * text-selectable PDF with proper wrapping, headings and tables. This yields far
 * cleaner output than hand-laying glyphs, and keeps the code maintainable.
 * Returns a temporary file:// uri that the pipeline moves into app storage.
 */
import * as Print from 'expo-print';
import type { DocumentModel, TableBlock } from '@/types';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderTable(t: TableBlock): string {
  const head = t.headers
    ? `<thead><tr>${t.headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>`
    : '';
  const body = t.rows
    .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`)
    .join('');
  return `<table>${head}<tbody>${body}</tbody></table>`;
}

function buildHtml(doc: DocumentModel): string {
  const body = doc.blocks
    .map((block) => {
      if (block.type === 'heading') {
        return `<h${block.level} class="h${block.level}">${esc(block.text)}</h${block.level}>`;
      }
      if (block.type === 'paragraph') {
        return `<p>${esc(block.text)}</p>`;
      }
      return renderTable(block);
    })
    .join('\n');

  const title = doc.title ? `<h1 class="doc-title">${esc(doc.title)}</h1>` : '';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif;
    color: #232834;
    font-size: 12.5pt;
    line-height: 1.55;
    margin: 0;
    padding: 40px 44px 64px;
  }
  .doc-title { font-size: 24pt; font-weight: 700; color: #151922; margin: 0 0 18px; letter-spacing: -0.4px; }
  h1.h1 { font-size: 19pt; font-weight: 700; color: #5B5BF0; margin: 22px 0 8px; }
  h2.h2 { font-size: 15.5pt; font-weight: 700; color: #232834; margin: 18px 0 6px; }
  h3.h3 { font-size: 13pt; font-weight: 700; color: #363C4A; margin: 14px 0 4px; }
  p { margin: 0 0 10px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0 18px; font-size: 11pt; }
  th, td { border: 1px solid #DCE0E8; padding: 7px 10px; text-align: left; vertical-align: top; }
  th { background: #EEEEFE; font-weight: 700; color: #2B3446; }
  tr:nth-child(even) td { background: #F7F8FA; }
  .footer { margin-top: 36px; padding-top: 12px; border-top: 1px solid #E7EAF0;
            color: #9BA3B2; font-size: 9pt; font-style: italic; text-align: center; }
</style>
</head>
<body>
  ${title}
  ${body}
  <div class="footer">Generated with Converta</div>
</body>
</html>`;
}

/** Returns a temporary file:// uri to the generated PDF. */
export async function generatePdf(doc: DocumentModel): Promise<string> {
  const html = buildHtml(doc);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  return uri;
}
