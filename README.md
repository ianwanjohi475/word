# Converta — AI Document & File Converter

Turn any document into editable files. Converta takes an **image, a camera scan, or a
PDF**, runs it through **OCR + AI** (Groq vision models) to recover the document's
structure, and rebuilds it as an editable **Word, Excel, PDF, or TXT** file — entirely
on-device, with no account and no backend of ours.

Built with **React Native + Expo (managed workflow)**, **Expo Router**, **TypeScript**,
**Zustand**, and **SQLite**.

---

## ✨ What it does

- 📸 **Input**: pick from Files, pick from Gallery, or scan with the camera. Images and
  multi-page PDFs are supported.
- 🧠 **OCR + structure**: the page image is sent to Groq's OpenAI-compatible vision API,
  which returns an ordered list of typed blocks — `heading`, `paragraph`, `table` — so
  layout survives the conversion.
- 🛟 **Always works**: if Groq is unavailable (no key, rate limit, error), the web build
  automatically falls back to **local Tesseract.js OCR** — unlimited and on-device. Leave
  `EXPO_PUBLIC_GROQ_API_KEY` blank to use only the free local OCR.
- 🔁 **Word ⇆ PDF** (and more): Word (`.docx`) and text-based PDFs are read directly
  (mammoth / pdf.js text layer, no OCR), so Word→PDF and PDF→Word are fast and accurate.
- 📄 **Real file generation** (client-side, no server):
  - **Word** → `.docx` via [`docx`](https://www.npmjs.com/package/docx)
  - **Excel** → `.xlsx` via [SheetJS `xlsx`](https://www.npmjs.com/package/xlsx)
    (each detected table also gets its own sheet)
  - **PDF** → via `expo-print` (styled, text-selectable output)
  - **TXT** → plain UTF-8
- 🧮 **Smart default**: when tables are detected, **Excel is highlighted as recommended**.
- ✏️ **Editor**: correct OCR text, edit paragraphs and individual table cells,
  undo/redo, save, and re-export to any format.
- 🗂️ **Local-first storage**: generated files live on the file system; history + metadata
  live in SQLite. Files, History and Settings are all wired to real data.
- 🎨 **Design system**: a single design-token file (`src/theme`) drives colors, spacing,
  radii, typography, shadows and motion across the whole app, with full light/dark support.

---

## 🚀 Getting started

### 1. Install dependencies

```bash
npm install
```

> This project uses `legacy-peer-deps` (see `.npmrc`) because a few of Expo Router's
> web-only transitive dependencies declare strict React peer ranges.

### 2. Add your Groq API key

Copy the example env file and paste your key:

```bash
cp .env.example .env
```

Then edit `.env`:

```dotenv
EXPO_PUBLIC_GROQ_API_KEY=gsk_your_key_here
# Optional — override the vision model (see note below). Leave blank for the default.
EXPO_PUBLIC_GROQ_MODEL=
```

Get a free key at **https://console.groq.com/keys**.

> **Where the key is used:** `src/config.ts` reads `EXPO_PUBLIC_GROQ_API_KEY`. The key is
> never hardcoded. Restart the dev server after changing `.env` so Expo re-inlines it.

### 3. Run it

```bash
npm start          # then press i / a, or scan the QR code with Expo Go
# or
npm run ios
npm run android
```

Open on a **real device** for the full experience (camera, sharing, saving to device).

---

## 🔑 About the Groq model

Groq deprecates models frequently, so the model name is **not** assumed to be permanent:

- The default is `meta-llama/llama-4-scout-17b-16e-instruct` (a current multimodal model).
- You can override it any time with `EXPO_PUBLIC_GROQ_MODEL`.
- If the configured model has been decommissioned, the pipeline **automatically falls back**
  to the next model in `GROQ_MODEL_FALLBACKS` (`src/config.ts`).

Always confirm what's live at **https://console.groq.com/docs/models** and set
`EXPO_PUBLIC_GROQ_MODEL` accordingly if needed.

---

## 🔒 Security note (please read before shipping)

Any `EXPO_PUBLIC_*` value is **inlined into the JS bundle** and is therefore
**extractable from a shipped app**. That's fine for personal / prototype use.

**For a public release, put a thin proxy in front of Groq** that holds the real key
server-side, and point `GROQ_BASE_URL` at that proxy instead of calling `api.groq.com`
directly. This is documented inline in `src/config.ts`.

---

## 🧭 App flow

```
Home ─▶ Upload / Scan ─▶ Select Output Format ─▶ OCR Processing ─▶ Result ─▶ Download / Share / Edit
```

OCR is single-flight (`src/services/ocrController.ts`): it starts on the format-selection
screen (to detect tables and recommend Excel) and the processing screen awaits the **same**
job — so a conversion never calls the API twice.

### Screens

Onboarding · Home Dashboard · Upload · Camera Scan · Conversion Selection · OCR Processing ·
Result · Editor · Files · History · Settings — each with empty, loading and error states,
plus confirmation dialogs for destructive actions.

---

## 🗂️ Project structure

```
app/                       # Expo Router routes (file-based)
  _layout.tsx              # providers, DB init, splash, PDF rasterizer host
  index.tsx                # first-launch redirect
  onboarding.tsx
  (tabs)/                  # Home · Files · History · Settings (bottom tabs)
  upload.tsx  scan.tsx  convert.tsx  processing.tsx  result.tsx  editor.tsx
src/
  theme/                   # design tokens + useTheme()
  components/              # Button, Card, FileRow, FormatIcon, Dialog, Toast, …
  services/
    groq.ts                # OCR client (JSON mode, typed errors, model fallback)
    pipeline.ts            # OCR ─▶ generate ─▶ save ─▶ SQLite
    ocrController.ts       # single-flight OCR job with live progress
    generators/            # docx / xlsx / pdf / txt
    pdfRasterizer.ts       # PDF → page images bridge
    files.ts  picker.ts
  store/                   # Zustand: settings (persisted), conversion, files
  db/database.ts           # SQLite schema + queries
  types/                   # DocumentModel, blocks, records
```

---

## ✅ Status vs. build milestones

- ✅ Image → **Word / Excel / PDF / TXT**, end-to-end with real local storage
- ✅ Editor with table-cell editing, undo/redo, save, re-export
- ✅ Files / History / Settings wired to SQLite
- ✅ Empty / loading / error states, confirmation dialogs, animation polish
- ✅ **PDF input** (pages are rasterized with pdf.js in an off-screen WebView, then run
  through the same pipeline)

### Known limitations

- **PDF rasterization** loads `pdf.js` from a CDN inside a hidden WebView (keeps the bundle
  small); it needs network at conversion time, same as OCR. Page count is capped
  (`MAX_PDF_PAGES`) to bound cost/time.
- Multi-file selection converts the **active** file; use the in-screen switcher to pick which.
- "Download" uses the Storage Access Framework on Android and the share sheet's
  "Save to Files" on iOS (there's no public writable folder on iOS).

---

## 🧰 Tech notes

- `src/polyfills.ts` installs a `Buffer` shim (loaded first in `app/_layout.tsx`) because
  `docx`/`xlsx`/`pdf-lib` were written for Node/browsers.
- Metro is configured to resolve `.cjs`/`.mjs` (SheetJS/docx ship these).
- Type-check with `npm run typecheck`.
