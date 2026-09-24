# Simple Docs

Simple Docs is a small personal documentation app that reads a **real folder on your computer**.

It does not copy your documentation into the project, IndexedDB, GitHub, or a database.

## What it does

- Open any local folder such as `Docs/`.
- Build a file-explorer-style tree from the real folder.
- Keep folders collapsed by default and expand/collapse them individually.
- Resize the Explorer sidebar by dragging its right edge.
- Read `.md`, `.txt`, `.pdf`, common images, and common code/text files.
- Recognize Word, PowerPoint, Excel, and Access files and open them with the installed desktop application.
- Search file names, paths, and text/code contents.
- Open Markdown, TXT, and code files directly in VS Code.
- Highlight fenced Markdown code blocks by language and copy them with one click.
- Follow Markdown links between files and headings inside the documentation folder.
- Keep the selected folder and last selected file between launches.
- Watch the selected folder for external changes.
- Refresh the tree and currently opened file when the real files change.
- Export the complete selected folder as a compressed `.zip` backup with live progress.
- Only show the backup as ready after the ZIP has finished and closed successfully.

## Why desktop

The important requirements of this project are local filesystem access, external editor launching, and watching a real directory.

A normal browser cannot safely launch VS Code or freely access arbitrary local directories. Simple Docs therefore uses Electron for the desktop shell while Next.js/React handles the UI. Electron's native folder dialog returns local paths, and its IPC/preload model keeps Node filesystem access out of the renderer.

## Data model

Simple Docs has no document database.

```
Your computer
└── Docs/
    ├── Git/
    │   ├── aliases.md
    │   └── config.md
    ├── CS50/
    │   └── Week 1 - C/
    │       └── notes.pdf
    ├── Office/
    │   ├── plan.docx
    │   ├── lessons.pptx
    │   └── grades.xlsx
    ├── Images/
    │   └── ASCII Code.png
    └── notes.txt
```

Simple Docs only stores two small pieces of application state in Electron's user-data directory:

- last opened folder
- last selected file

The actual documents remain where you keep them.

## Editing and opening workflow

1. Open your documentation folder.
2. Select a Markdown, TXT, or code file.
3. Click **Edit**.
4. Simple Docs launches the original file in VS Code.
5. Save the file in VS Code.
6. Simple Docs detects the filesystem change and reloads the file/tree.

For Word, PowerPoint, Excel, and Access, Simple Docs recognizes the file type and uses the operating system's default application. In-app Office rendering/editing is intentionally not part of the current architecture.

## Import / Export

There is intentionally no upload operation.

**Import** means **Open Folder**: choose the real folder you already have on the device.

**Export** means **Export ZIP**: choose where to save a compressed copy of the currently opened folder. The app calculates source statistics first, reports compression progress, and only marks the ZIP ready after the output stream closes successfully.

The original folder is never moved or deleted by export.

## Markdown

Markdown is rendered in a dedicated viewer:

```
Markdown source
    ↓
marked
    ↓
DOMPurify
    ↓
HTML
    ↓
Shiki for fenced code blocks
```

Supported navigation includes:

- `#heading` links to headings in the current document.
- `other-file.md` opens another file in the selected local folder.
- `other-file.md#heading` opens the file and scrolls to its heading.
- `http://`, `https://`, and `mailto:` links open externally.

Fenced code blocks such as ```js, ```ts, ```python, and other supported languages receive syntax highlighting and a Copy action.

## Electron mental model

Think of Electron as a **desktop shell around your web app**.

```
┌──────────────────────────────┐
│ Next.js + React              │
│ UI / components / state      │
└──────────────┬───────────────┘
               │ window.simpleDocs
               ▼
┌──────────────────────────────┐
│ preload.cjs                  │
│ safe allowlisted bridge      │
└──────────────┬───────────────┘
               │ IPC
               ▼
┌──────────────────────────────┐
│ Electron main.cjs            │
│ filesystem / dialog / shell  │
│ VS Code / watcher / ZIP      │
└──────────────┬───────────────┘
               ▼
        Windows / macOS / Linux
```

### Renderer

Your Next.js/React code runs in the renderer process. It handles:

- UI
- component state
- search input
- selected file
- Markdown rendering
- resizing the sidebar
- progress bars

It should not directly call Node's filesystem APIs in this architecture.

### Preload

`electron/preload.cjs` is the bridge between the web UI and Electron.

It exposes a small API through `contextBridge`, for example:

```ts
window.simpleDocs.openFolder()
window.simpleDocs.readFile(path)
window.simpleDocs.openInEditor(path)
window.simpleDocs.exportZip()
```

The renderer asks for an operation; it does not receive unrestricted Node access.

### Main process

`electron/main.cjs` is the part that can talk to the operating system.

It owns:

- real folder paths
- `fs` / `fs.promises`
- folder scanning
- filesystem watching
- native dialogs
- VS Code launching
- opening files with default desktop applications
- ZIP creation
- secure external-link handling

### IPC

IPC means **Inter-Process Communication**.

For example:

```
React
  │
  │ ipcRenderer.invoke("file:read", "Git/config.md")
  ▼
main.cjs
  │
  │ fs.readFile(...)
  ▼
real file on disk
  │
  ▼
main.cjs
  │
  │ IPC response
  ▼
React
```

This is one of the most important Electron concepts for this project.

### Filesystem watcher

The main process watches the opened folder. When VS Code, Windows Explorer, or another program changes a file, Electron emits a `folder:changed` event and the React app rescans/reloads.

### Security model

The important rule is:

```
Renderer → small preload API → validated main-process operation
```

Do not expose the whole Node API to the renderer. Keep the bridge explicit and validate paths in the main process.

## Project structure

```
app/
  page.tsx
  layout.tsx
  globals.css

components/docs/
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

Build the Next.js UI:

```bash
npm run build
```

## What you need to learn for Electron

For this project, you do **not** need to learn all of Electron at once.

Learn in this order:

1. Electron architecture: main process, renderer process, preload.
2. IPC: `ipcRenderer.invoke()`, `ipcMain.handle()`, events.
3. `contextBridge` and Electron security.
4. Node.js `fs` and `path`.
5. Electron dialogs and shell APIs.
6. `BrowserWindow` and window lifecycle.
7. Filesystem watching with `fs.watch`.
8. Packaging and installers after the app itself is stable.

Your React/Next.js knowledge already covers most of the renderer side. The main new skills are **Node.js filesystem work + Electron main/preload/IPC**.

## Future changes

Keep the real local-folder model as the core.

Possible later additions:

- polished custom context menus
- file/folder rename and move operations
- better PDF controls
- native installers for Windows/macOS/Linux
- optional cloud backup/sync based on ZIP backups
- optional mobile version with a separate storage layer

Do not reintroduce IndexedDB/Dexie as the primary document store unless the product requirements change. The real local folder should remain the source of truth.
