# Simple Docs — Private Development Guide

This file is the private maintainer guide.

Do not commit README.DEV.md. The repository ignores that filename.

A public starter copy is README.DEV.example.md. Copy it locally and rename it to README.DEV.md.

## 1. Project rule

Simple Docs is local-first.

~~~text
real folder on Windows
        ↓
Electron main process
        ↓
preload / IPC
        ↓
Next.js + React renderer
        ↓
tree + viewer
~~~

The real user folder is always the source of truth.

## 2. Current structure

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
  file-tree.tsx
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
  file-type.ts

build/
  icon.ico
~~~

Keep components flat. Introduce a subfolder only when there is a real maintenance reason.

## 3. File-by-file guide

### app/page.tsx

Purpose:
- Next.js entry page.
- Renders DocsApp.

Function:
- Home(): returns the root application component.

### app/layout.tsx

Purpose:
- Next.js root layout.
- Defines metadata.
- Loads globals.css.
- Sets the default dark theme and full-height shell.

Important values:
- metadata.title
- metadata.description
- html class
- body class

### app/globals.css

Purpose:
- Tailwind entry.
- Global design tokens.
- File colors.
- Scrollbars.
- Markdown typography.
- Code viewer styling.

Main groups:
- --token-bg*
- --token-text*
- --token-brand*
- --token-file-*
- --token-scrollbar
- --token-code-*

File colors:

~~~text
.md        --token-file-markdown      #71859a / #91a3b4
.txt       --token-file-text          #8795a4 / #a1acb7
code       --token-file-code          #6f8eaa / #8ea9c0
.pdf       --token-file-pdf            #96887b / #b0a294
image      --token-file-image          #908aa0 / #a9a2b7
Word       --token-file-word           #728fa0 / #92adbb
PowerPoint --token-file-powerpoint     #a08c7e / #b9a596
Excel      --token-file-excel          #78978f / #98b8af
Access     --token-file-access         #978ba0 / #ada1b5
other      --token-file-other          #8b949c / #a7afb6
~~~

First value is light theme. Second value is dark theme.

When adding a file type:
1. Add a token in :root.
2. Add the dark value in .dark.
3. Expose it in @theme inline.
4. Add the matching .text-file-* class.

### components/docs-app.tsx

Purpose:
- Main React controller.
- Stores application state.
- Calls the desktop API.

Important state:
- tree: scanned folder tree.
- rootPath: absolute opened folder.
- selected: selected document.
- selectedPathRef: selected path retained for watcher callbacks.
- selectedAnchor: Markdown heading anchor.
- query: search text.
- results: search results.
- mobileOpen: mobile Explorer state.
- busy: folder-opening state.
- exporting: ZIP export state.
- exportProgress: ZIP percentage.
- exportStatus: ZIP lifecycle.
- exportPath: last completed ZIP.
- exportMessage: feedback text.

Important functions:
- findFile(folder, target): recursively finds a file by relative path.
- handleQueryChange(value): updates search and clears empty results.
- openFolder(): opens the native folder picker and resets selection.
- refreshAfterCreation(createdPath?, selectCreatedFile?): rescans after creating an item.
- createFolder(parentPath): prompts for a name and calls Electron.
- createFile(parentPath): prompts for a name, creates an empty file, rescans, and selects it.
- selectFile(file, anchor?): selects a document and persists its path.
- navigateTo(path, anchor): resolves Markdown links into a document selection.
- editFile(file): asks Electron to open VS Code.
- exportZip(): starts ZIP export and tracks progress.

Important effects:
- Initial state loading, folder watcher, and export listener.
- Debounced search.

### components/docs-header.tsx

Purpose:
- Top toolbar.
- Search.
- Export.
- Mobile Explorer button.

Important props:
- query
- results
- exporting
- hasFolder
- mobileOpen
- onQueryChange
- onSelectResult
- onExport
- onToggleMobile

Function:
- resultColor(type): chooses the small file-type marker used in search results.

### components/docs-sidebar.tsx

Purpose:
- Explorer shell.
- Root folder information.
- Root New Folder/New File buttons.
- Sidebar resizing.
- Open another folder action.

Constants:
- MIN_WIDTH = 220
- MAX_WIDTH = 440
- DEFAULT_WIDTH = 288

State and refs:
- width
- resizeRef

Functions:
- folderName(rootPath): extracts the final folder name.
- parentPath(rootPath): extracts the last parent segments.
- startResize(event): starts pointer-based resizing.

### components/file-tree.tsx

Purpose:
- Recursive Explorer tree.
- Folder expansion.
- File selection.
- Creation controls for every visible folder.

State:
- open: current folder expanded/collapsed state.

Props:
- folder
- selectedPath
- onSelect
- onCreateFolder
- onCreateFile
- depth

The folder row uses a wrapper div plus separate buttons because nested interactive buttons would be invalid HTML.

### components/file-viewer.tsx

Purpose:
- Displays the selected document.
- Edit/Open/Open-with-default actions.

Helpers:
- decodeBase64(base64): converts base64 text into a browser string.
- FileTypeIcon(type, size, className): maps document types to Lucide icons.
- sizeLabel(size): creates a human-readable file size.
- needsExternalOpen(type): identifies document types opened by the desktop application.

State:
- payload
- error
- loading
- actionMessage

Main effect:
- Reads selected previewable files through desktop.readFile().
- Decodes text.
- Creates Blob URLs for PDF/image previews.
- Revokes Blob URLs during cleanup.

### components/code-viewer.tsx

Purpose:
- Syntax highlighting for standalone code files.

State:
- html

Function/effect flow:
- Dynamically imports Shiki.
- Gets the grammar from codeLanguageFromName().
- Falls back to text when a grammar fails.
- Sanitizes returned HTML with DOMPurify.

### components/markdown-viewer.tsx

Purpose:
- Markdown parsing and sanitization.
- Heading IDs.
- Fenced-code highlighting.
- Copy buttons.
- Internal, heading, and external links.

Helpers:
- resolveRelativePath()
- isExternalHref()
- slugifyHeading()
- ensureHeadingIds()
- scrollToAnchor()
- addCodeToolbar()
- copyText()
- handleClick()

Important ref/value:
- articleRef
- html

### components/export-status.tsx

Purpose:
- ZIP preparation progress.
- Compression progress.
- Completed backup action.
- Errors.

Main props:
- status
- progress
- message
- path
- onShow
- onDismiss

### types/file-type.ts

Purpose:
- Defines the FileType union.
- Stores UI metadata for each document type.
- Stores the extension → Shiki grammar map.

Important values:
- FileType
- FileTypeMeta
- FILE_TYPE_META
- CODE_LANGUAGES

Function:
- codeLanguageFromName(fileName): returns the Shiki grammar ID.

When adding code support:
1. Add the extension here.
2. Use the grammar ID supported by Shiki.
3. Add the same extension to Electron CODE_EXTENSIONS.

### types/docs.ts

Purpose:
- Shared document models.

Types:
- DocFile
- DocFolder
- FilePayload
- SearchResult

FileType is imported from types/file-type.ts.

### types/electron.d.ts

Purpose:
- TypeScript contract for window.simpleDocs.

Current desktop methods:
- getState()
- openFolder()
- createFolder(relativeParent, name)
- createFile(relativeParent, name)
- scan()
- readFile(relativePath)
- search(query)
- openInEditor(relativePath)
- revealInExplorer(relativePath)
- revealExport(absolutePath)
- openDefault(relativePath)
- openExternalUrl(url)
- exportZip()
- setSelectedFile(relativePath)
- onFolderChanged(callback)
- onExportProgress(callback)

Keep this synchronized with electron/preload.cjs.

### lib/desktop-api.ts

Purpose:
- Typed wrapper around the preload API.
- Keeps React components away from direct window.simpleDocs access.

Functions:
- isDesktopAvailable(): checks for the Electron bridge.
- api(): returns the bridge or throws an error.

Object:
- desktop: mirrors the preload methods.

### electron/preload.cjs

Purpose:
- Security boundary between renderer and main process.
- Uses contextBridge to expose only the approved IPC operations.

Creation methods:
- createFolder() sends folder:create.
- createFile() sends file:create.

Never expose unrestricted fs, path, or child_process objects.

### electron/main.cjs

Purpose:
- Privileged Electron process.
- Owns filesystem access, dialogs, VS Code, Explorer, watcher, ZIP, updater, and packaged renderer loading.

Important constants:
- SUPPORTED: non-code extension → document type.
- CODE_EXTENSIONS: source-code extension set.
- PREVIEW_TYPES: types rendered inside the app.
- MIME: preview MIME types.
- imageMime: image extension → image MIME.

Important state:
- mainWindow
- rootPath
- selectedPath
- watcher
- changeTimer
- lastExportPath

Important functions:
- registerAppProtocol(): serves the static Next output in packaged builds.
- setupAutoUpdater(): checks GitHub Releases.
- loadState(): restores saved root and selected file.
- saveState(): writes the saved state.
- relativeSafe(relativePath): rejects paths outside the opened root.
- existingPath(relativePath): checks that a path exists.
- existingDirectory(relativePath): checks that a parent is a directory.
- validateNewItemName(value, kind): validates names before filesystem writes.
- createFolder(relativeParent, name): creates a new directory without escaping the root.
- createFile(relativeParent, name): creates an empty file with no overwrite.
- typeOf(filePath): classifies the file extension.
- scanFolder(dir, relative): recursively builds the Explorer tree.
- scheduleChange(): debounces filesystem watcher events.
- startWatcher(): watches the opened root directory.
- chooseFolder(): opens the native folder picker.
- readFile(relativePath): reads previewable content and returns base64.
- searchFiles(query): searches names, paths, and text/code contents.
- openInEditor(relativePath): launches VS Code.
- revealRelative(relativePath): reveals a file in Explorer.
- revealAbsolute(absolutePath): reveals the last exported ZIP.
- openDefault(relativePath): opens the default desktop application.
- openExternalUrl(url): validates and opens web/mail links.
- collectFolderStats(dir): calculates export totals.
- sendExportProgress(payload): sends ZIP progress to the renderer.
- exportFolder(): creates the ZIP.
- registerIpc(): registers all IPC handlers.
- createWindow(): creates the BrowserWindow and maximizes it.

New creation flow:

~~~text
renderer
  ↓
window.simpleDocs.createFolder(parent, name)
  ↓
preload
  ↓
ipcRenderer.invoke(folder:create)
  ↓
ipcMain.handle(folder:create)
  ↓
validate + mkdir
  ↓
watcher / rescan
  ↓
Explorer refresh
~~~

File creation uses the wx write flag, so an existing file cannot be overwritten.

### package.json

Important fields:
- version
- main
- scripts.dev
- scripts.build
- scripts.dist
- scripts.release
- build.appId
- build.productName
- build.icon
- build.win.target
- build.publish

The release version is changed here before the matching Git tag is created.

### .github/workflows/release.yml

Purpose:
- Runs on v*.*.* tags.
- Uses Windows runners.
- Installs dependencies.
- Checks the tag/version match.
- Runs typecheck and lint.
- Builds and publishes the Windows release.

### RELEASING.md

Purpose:
- Human release checklist.
- Release artifacts.
- Semantic Versioning.
- Auto-update behavior.
- Code signing notes.

### build/icon.ico

Purpose:
- Windows application icon.
- Keep it as a valid multi-size ICO with transparency when appropriate.

## 4. Common changes

### Change a file color

Edit the matching --token-file-* value in app/globals.css in both :root and .dark.

### Add a document type

1. Add its extension to SUPPORTED in electron/main.cjs.
2. Add its FileType member to types/file-type.ts.
3. Add FILE_TYPE_META data.
4. Add its CSS token and text-file class.
5. Add a Lucide icon when the type needs a dedicated icon.
6. If it is source code, add the extension to CODE_EXTENSIONS and CODE_LANGUAGES.
7. Update README.md.

### Change the new-file default

Edit the two prompt defaults inside components/docs-app.tsx.

Current defaults:
- New folder name → New Folder
- New file name → new-file.md

### Change sidebar width

Edit MIN_WIDTH, MAX_WIDTH, and DEFAULT_WIDTH in components/docs-sidebar.tsx.

### Change window behavior

Edit createWindow() in electron/main.cjs.

Current behavior:
- 1440 × 900 initial size.
- Minimum size 900 × 620.
- Automatic maximize.
- Electron default menu removed.

### Add an IPC feature

Use this exact order:

~~~text
1. electron/main.cjs
2. electron/preload.cjs
3. types/electron.d.ts
4. lib/desktop-api.ts
5. React component
~~~

The preload layer is the security boundary and should remain small.

## 5. Testing before a release

Run:

~~~bash
npm run typecheck
npm run lint
npm run build
npm run dist
~~~

Then test the installed Windows application:

1. Starts maximized.
2. Opens a real folder.
3. Root New Folder works.
4. Root New File works.
5. Nested-folder New Folder works.
6. Nested-folder New File works.
7. Existing names are not overwritten.
8. Invalid Windows names are rejected.
9. New files appear in the Explorer.
10. New Markdown/code files can be opened and edited.
11. Search works.
12. External file changes refresh the tree.
13. ZIP export works.
14. State restoration works.
15. App icon is correct.

## 6. Release flow

For v1.1.0:

~~~text
feature branch
  ↓
typecheck + lint + build
  ↓
Windows installer test
  ↓
merge into main
  ↓
package.json version = 1.1.0
  ↓
git tag v1.1.0
  ↓
git push origin v1.1.0
  ↓
GitHub Actions
  ↓
GitHub Release
  ↓
electron-updater can discover the release
~~~

## 7. Safety notes

- Renderer code must not receive unrestricted Node.js filesystem access.
- Path validation stays in Electron main.
- New names must never become arbitrary filesystem paths.
- Never silently overwrite user data.
- The real documentation folder remains the source of truth.
- Test updater behavior with real packaged builds.
