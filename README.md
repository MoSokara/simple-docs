# Simple Docs

Simple Docs is a local-first desktop documentation viewer built with Next.js, React, and Electron.

The source of truth is always the **real folder on your computer**. The app does not copy documents into a database or IndexedDB.

## Features

- Open any local folder.
- Explorer-style file tree with collapsed folders.
- Resizable Explorer sidebar.
- Search file names, paths, and text/code contents.
- Preview Markdown, TXT, PDF, and images.
- Syntax-highlight common code files with Shiki.
- Copy fenced Markdown code blocks.
- Markdown links to files and headings.
- Open Markdown/TXT/code files directly in VS Code.
- Recognize and open Word, PowerPoint, Excel, and Access files with the desktop default application.
- Watch the real folder for external changes.
- Restore the last opened folder and selected file.
- Export the whole folder as a ZIP backup with progress.
- No Electron default File/Edit/View/Window menu bar; the interface uses the application's own toolbar.

## Supported document groups

| Group | Examples |
| --- | --- |
| Markdown | `.md` |
| Text | `.txt` |
| Code | JS, JSX, TS, TSX, JSON, HTML, CSS, SCSS, Vue, Svelte, Python, Java, C/C++, C#, Go, Rust, PHP, SQL, shell, YAML, TOML, GraphQL, Prisma, Terraform, Dart, Swift, Kotlin, and more |
| PDF | `.pdf` |
| Images | PNG, JPG, JPEG, WEBP, GIF, SVG |
| Word | DOC, DOCX, DOCM, DOT, DOTX |
| PowerPoint | PPT, PPTX, PPTM, PPS, PPSX, POT, POTX |
| Excel | XLS, XLSX, XLSM, XLSB, XLT, XLTX |
| Access | MDB, ACCDB, ACCDE, MDE |

Office files are recognized in the Explorer and opened with the installed desktop application instead of being converted into an in-app editor.

## Markdown pipeline

```
Markdown file
    ↓
marked
    ↓
DOMPurify
    ↓
Markdown HTML
    ↓
Shiki for fenced code blocks
```

Heading links such as `[1. MongoDB](#1-mongodb)` are handled inside the scrollable document area. Headings receive stable IDs and duplicate headings get numbered suffixes.

Relative document links are resolved from the current Markdown file:

```
guide.md
guide.md#mongodb
../shared/setup.md
```

External web and mail links are opened by the operating system.

## Electron architecture

Simple Docs separates the web UI from desktop capabilities:

```
Next.js + React renderer
        ↓
electron/preload.cjs
        ↓
IPC
        ↓
electron/main.cjs
        ↓
filesystem / dialogs / apps / watcher / ZIP
```

### Renderer

React components handle the UI and application state:

```
components/docs/
  docs-app.tsx
  docs-header.tsx
  docs-sidebar.tsx
  file-tree.tsx
  file-viewer.tsx
  markdown-viewer.tsx
  code-viewer.tsx
```

### Preload

`preload.cjs` exposes a small allowlisted API through Electron's `contextBridge`.

Examples:

```ts
window.simpleDocs.openFolder()
window.simpleDocs.readFile(path)
window.simpleDocs.openInEditor(path)
window.simpleDocs.exportZip()
```

### Main process

`main.cjs` owns the privileged desktop work:

- filesystem access
- path validation
- native folder/save dialogs
- VS Code launching
- default application launching
- Explorer reveal
- filesystem watching
- ZIP creation
- external-link handling

### IPC

A read operation follows this path:

```
React
  ↓
window.simpleDocs.readFile(path)
  ↓
preload
  ↓
ipcRenderer.invoke("file:read", path)
  ↓
ipcMain.handle("file:read", ...)
  ↓
fs.readFile(...)
  ↓
React receives the response
```

The renderer does not receive unrestricted Node.js filesystem access.

## Why Electron

A normal browser is not a suitable shell for this project because the application needs direct desktop capabilities such as choosing arbitrary local folders, launching VS Code, revealing files in the system file manager, watching local folders, and creating backups.

Electron provides the desktop shell while Next.js/React provides the interface.

## Project structure

```
app/
  page.tsx
  layout.tsx
  globals.css

components/docs/
  code-viewer.tsx
  docs-app.tsx
  docs-header.tsx
  docs-sidebar.tsx
  export-status.tsx
  file-tree.tsx
  file-type.ts
  file-viewer.tsx
  markdown-viewer.tsx

electron/
  main.cjs
  preload.cjs

lib/
  desktop-api.ts

types/
  docs.ts
  electron.d.ts
```

## Local setup

Requirements:

- Node.js LTS
- VS Code (recommended)
- npm

Install dependencies:

```bash
npm install
```

Run the desktop app:

```bash
npm run dev
```

Type-check:

```bash
npm run typecheck
```

Lint:

```bash
npm run lint
```

Build:

```bash
npm run build
```

The repository intentionally keeps `package.json` as the dependency source and uses `.npmrc` to prevent npm from creating `package-lock.json`.

## Electron learning path

For this project, learn Electron in this order:

1. Main process vs renderer process.
2. Preload and `contextBridge`.
3. IPC with `ipcRenderer.invoke()` and `ipcMain.handle()`.
4. Node.js `fs`, `path`, and `child_process`.
5. Electron `dialog`, `shell`, and `BrowserWindow`.
6. Filesystem watching.
7. Packaging and installers.

Your React/Next.js knowledge already covers most of the renderer side. The main new concepts are **desktop APIs, IPC, preload security, and Node.js filesystem work**.

## Important design rule

Keep the local folder as the source of truth.

```
real folder
   ↓
Electron filesystem
   ↓
React tree + viewer
   ↓
VS Code / desktop apps
```

Do not reintroduce a database or IndexedDB as the primary document store unless the product requirements change.
