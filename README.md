# Simple Docs

Simple Docs is a small personal documentation app that reads a **real folder on your computer**.

It does not copy your documentation into the project, IndexedDB, GitHub, or a database.

## What it does

- Open any local folder such as `Docs/`.
- Build a file-explorer-style tree from the real folder.
- Keep folders collapsed by default and expand/collapse them individually.
- Read `.md`, `.txt`, `.pdf`, common images, and common code/text files.
- Search file names, paths, and text/code contents.
- Open Markdown, TXT, and code files directly in VS Code.
- Keep the selected folder and last selected file between launches.
- Watch the selected folder for external changes.
- Refresh the tree and currently opened file when the real files change.
- Export the complete selected folder as a compressed `.zip` backup with live progress.
- Only show the backup as ready after the ZIP has finished and closed successfully.

## Why desktop

The important requirements of this project are local filesystem access, external editor launching, and watching a real directory.

A normal browser cannot safely launch VS Code or freely watch arbitrary local directories. Simple Docs therefore uses Electron for the desktop shell while Next.js/React handles the UI. Electron's native folder dialog returns local paths, and its IPC/preload model keeps Node filesystem access out of the renderer.

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
    ├── Images/
    │   └── ASCII Code.png
    └── notes.txt
```

Simple Docs only stores two small pieces of application state in Electron's user-data directory:

- last opened folder
- last selected file

The actual documents remain where you keep them.

## Editing workflow

1. Open your documentation folder.
2. Select a Markdown, TXT, or code file.
3. Click **Edit in VS Code**.
4. VS Code edits the original file.
5. Save the file in VS Code.
6. Simple Docs detects the filesystem change and reloads the file/tree.

The editor launcher first tries the VS Code command installed on Windows (including common VS Code install locations). If it is not available, Simple Docs falls back to the operating system's default application.

## Import / Export

There is intentionally no upload operation.

**Import** means **Open Folder**: choose the real folder you already have on the device.

**Export** means **Create ZIP Backup**: choose where to save a compressed copy of the currently opened folder. The app calculates the source size first, then reports compression progress, and only marks the ZIP ready after the output stream closes successfully.

The original folder is never moved or deleted by export.

## Project structure

```
app/
  page.tsx
  layout.tsx
  globals.css

components/docs/
  docs-app.tsx
  file-tree.tsx
  file-viewer.tsx

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
