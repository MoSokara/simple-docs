# Simple Docs

Simple Docs is a local-first Windows desktop app for reading, organizing, and working with documentation stored in real folders on your computer.

Your files stay where they are. Simple Docs reads the selected folder directly instead of copying documents into an application database.

## Latest status

- Stable release: v1.0.0
- Next release under development: v1.1.0

Download the stable Windows release from the repository Releases page.

## Features

- Open any local folder.
- Browse nested directories in an Explorer-style tree.
- Create a new folder or file directly from the Explorer.
- Create items in the root folder or inside any visible folder.
- Open a root-item context menu with New Folder, New File, and Delete actions.
- Delete root-level files/folders with native confirmation.
- Double-click the root folder header to open it in Windows File Explorer.
- Use native tooltips on creation buttons to show their target absolute path.
- Start the app maximized.
- Resize the Explorer sidebar.
- Search file names, paths, and text/code contents.
- Preview Markdown, TXT, PDF, and images.
- Syntax-highlight common code files with Shiki.
- Copy fenced Markdown code blocks.
- Follow Markdown links to files and headings.
- Open Markdown, TXT, and code files in VS Code.
- Open Office files with their installed desktop applications.
- Detect external changes to the real folder and refresh the Explorer.
- Restore the last opened folder and selected file.
- Export the whole folder as a ZIP backup with progress.
- Use a small custom toolbar instead of Electron's default application menu.

## Creating files and folders

The Explorer has two small creation buttons in the root folder header.

- New Folder creates a folder in the opened root directory.
- New File creates an empty file in the opened root directory.

Every visible folder also has the same two buttons. Clicking a folder's buttons creates the item inside that folder.

For a file, enter the full filename, including the extension when needed:

~~~text
notes.md
todo.txt
server.js
~~~

Names are checked in the Electron main process. Invalid Windows characters, reserved Windows device names, path traversal, and accidental file overwrites are rejected.

## Supported document groups

| Group | Extensions / examples |
| --- | --- |
| Markdown | .md |
| Text | .txt |
| Code | JavaScript, TypeScript, JSX, TSX, JSON, HTML, CSS, SCSS, Vue, Svelte, Python, Java, C/C++, C#, Go, Rust, PHP, SQL, shell, YAML, TOML, GraphQL, Prisma, Terraform, Dart, Swift, Kotlin, Assembly, Zig, and more |
| PDF | .pdf |
| Images | .png, .jpg, .jpeg, .webp, .gif, .svg |
| Word | .doc, .docx, .docm, .dot, .dotx, .dotm |
| PowerPoint | .ppt, .pptx, .pptm, .pps, .ppsx, .pot, .potx |
| Excel | .xls, .xlsx, .xlsm, .xlsb, .xlt, .xltx, .xltm |
| Access | .mdb, .accdb, .accde, .mde |

Office documents are recognized by the Explorer and opened with the default desktop application instead of being converted to an in-app editor.

## File type colors

File colors are visual labels only. Every supported extension has its own muted identity instead of sharing one generic code/document color.

The configuration lives in app/globals.css, while types/file-type.ts maps each filename to its extension color key.

Examples: .js uses a muted JavaScript-style yellow, .ts uses a muted blue, .html uses a muted orange, and .pdf uses a muted red. Unsupported files use the error-like fallback color.

Every supported extension uses a --token-ext-* token. Unsupported files use --token-file-other / --token-error.

## Customization reference

| What you want to change | File |
| --- | --- |
| Main UI and file colors | app/globals.css |
| File type metadata and Shiki mapping | types/file-type.ts |
| File extension classification for Electron | electron/main.cjs |
| Explorer layout and creation buttons | components/docs-sidebar.tsx, components/file-tree.tsx |
| Main application state and actions | components/docs-app.tsx |
| Viewer behavior | components/file-viewer.tsx, components/markdown-viewer.tsx, components/code-viewer.tsx |
| Electron renderer bridge | electron/preload.cjs |
| Typed desktop API | lib/desktop-api.ts |
| Electron IPC types | types/electron.d.ts |
| Window, filesystem, watcher, ZIP, updater | electron/main.cjs |
| App metadata and HTML shell | app/layout.tsx |
| Release configuration | package.json, .github/workflows/release.yml, RELEASING.md |

Detailed development documentation is committed under `.dev/`. Start with `.dev/README.md`.

## Markdown pipeline

~~~text
Markdown file
    ↓
marked
    ↓
DOMPurify
    ↓
Markdown HTML
    ↓
Shiki for fenced code blocks
~~~

Heading IDs are stable. Relative links are resolved from the current Markdown document. External web and mail links are opened by the operating system.

## Electron architecture

~~~text
Next.js + React
      ↓
preload.cjs
      ↓
IPC
      ↓
main.cjs
      ↓
filesystem / dialogs / VS Code / Explorer / watcher / ZIP / updater
~~~

The renderer does not receive unrestricted Node.js filesystem access. Desktop operations are exposed through the preload bridge and handled by Electron's main process.

## Project structure

~~~text
app/
  globals.css
  layout.tsx
  page.tsx

components/
  code-viewer.tsx
  docs-app.tsx
  docs-header.tsx
  docs-sidebar.tsx
  export-status.tsx
  file-context-menu.tsx
  file-tree.tsx
  file-viewer.tsx
  markdown-viewer.tsx
  new-item-dialog.tsx

.dev/
  README.md
  architecture.md
  development.md
  source-files.md
  code-changes.md
  production.md

electron/
  main.cjs
  preload.cjs

lib/
  desktop-api.ts

types/
  docs.ts
  electron.d.ts
  file-type.ts

build/
  icon.ico
~~~

The components are intentionally flat. Add a subfolder only when a group becomes large enough to justify a clear separation.

## Local development

Requirements:
- Windows
- Node.js LTS
- npm
- VS Code recommended

~~~bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run dist
~~~

The dist command creates the Windows installer and ZIP archive locally.

## Releases

Windows x64 releases are published by GitHub Actions from version tags such as v1.0.0 and v1.1.0.

The current production configuration uses an unsigned Windows build. Code signing can be added later.

## License

See the repository license file for the terms that apply to Simple Docs.
