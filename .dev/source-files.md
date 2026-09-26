# Source Files

This file is the file-by-file map for the current application. For a change, read the section for the file first, then follow the dependency direction documented in architecture.md.

## app/page.tsx

Entry route. Imports and renders `DocsApp`. Keep it intentionally small.

## app/layout.tsx

Root HTML shell and metadata. Imports global CSS, defines title/description, and renders the document shell.

## app/globals.css

Central visual system:
- light and dark tokens
- extension-specific file colors
- Tailwind theme mapping
- scrollbars
- Markdown typography
- code viewer styling
- input focus behavior

The input focus rule intentionally removes the large outline and changes only the border color.

## components/docs-app.tsx

Main React controller.

Important state:
- tree
- rootPath
- selected
- selectedPathRef
- selectedAnchor
- search query/results
- mobile state
- export state
- creation state

Important functions:
- findFile
- openCreateDialog
- refreshAfterCreation
- submitCreateDialog
- deleteItem
- openFolder
- selectFile
- navigateTo
- editFile
- exportZip

The parent path passed to create actions is the key fix that keeps nested creation inside the selected folder.

## components/docs-header.tsx

Top toolbar. Owns presentation for branding, mobile Explorer toggle, search input/results, and Export. Search execution is handled by DocsApp.

## components/docs-sidebar.tsx

Explorer shell:
- root header
- root creation buttons
- tree container
- resize handle
- recursive context-menu state
- Open another folder

The root header uses native `title={rootPath}` and double-click behavior. Root creation actions use parent path `""`. The recursive tree passes each folder/file parent path into context-menu actions.

## components/file-context-menu.tsx

Presentational custom right-click menu.

Target model:
- kind: folder/file
- name
- path

Actions:
- New Folder
- New File
- Delete

A folder target uses its path as the creation parent. A file target uses its containing folder. The menu also exposes Open in Explorer and Delete.

## components/file-tree.tsx

Recursive Explorer implementation.

Important pieces:
- `open` folder expansion state
- `absolutePath()` for Windows-style tooltip text
- parent-aware creation callbacks
- recursive context-menu callback
- extension-specific file colors

Depth rules:
- root node = 0
- direct root folder = 1
- deeper folders > 1
- direct root files are rendered from the root node

## components/new-item-dialog.tsx

Custom creation modal. Uses a ref to autofocus/select the name input and displays server-side validation errors.

Do not replace it with `window.prompt()`; the packaged Electron renderer does not support the browser prompt used previously.

## components/file-viewer.tsx

Selected-file preview and desktop actions.

Important pieces:
- base64 text decoding
- type-to-icon mapping
- external-open routing
- file reading effect
- Blob URL cleanup
- Markdown/code delegation
- Explorer/editor/default-app actions

## components/markdown-viewer.tsx

Markdown parser/sanitizer, heading IDs, links, anchor scrolling, fenced code highlighting, and copy toolbar.

HTML output must remain sanitized with DOMPurify.

## components/code-viewer.tsx

Standalone code-file viewer. Loads Shiki dynamically, maps file extension to grammar, falls back to text when needed, and sanitizes the generated HTML.

## components/export-status.tsx

Presentational ZIP progress/completion/error UI. DocsApp owns the actual export lifecycle.

## lib/desktop-api.ts

Typed wrapper over `window.simpleDocs`.

Each wrapper delegates to the preload API. Keep it synchronized with types/electron.d.ts and preload.cjs.

## types/docs.ts

Shared renderer models:
- DocFile
- DocFolder
- FilePayload
- SearchResult

Keep the types renderer-friendly; do not place raw Node objects here.

## types/file-type.ts

File classification and visual language:
- FileType union
- FILE_TYPE_META
- CODE_LANGUAGES
- FILE_COLOR_KEYS
- SPECIAL_FILE_COLORS
- fileColorKeyFromName
- fileColorStyle

When adding file support, update Electron classification, this mapping, Shiki grammar when relevant, CSS color token, and README.

## types/electron.d.ts

Compile-time contract for `window.simpleDocs`.

Includes creation, root deletion, root Explorer opening, file operations, export, persistence, and event subscriptions.

## electron/main.cjs

Privileged process and most important backend file.

Major sections:
- app/protocol setup
- supported extension maps
- state persistence
- path safety
- scanning
- watcher
- dialogs
- reading/search
- VS Code/Explorer/default app
- ZIP export
- IPC registration
- BrowserWindow creation/maximize

Safety functions:
- relativeSafe
- existingDirectory
- validateNewItemName
- createFile with `wx`
- ensureWithinRoot for resolved filesystem containment
- deleteItem with root protection + native confirmation

## electron/preload.cjs

Security boundary. Uses contextBridge and exposes only approved methods. Maintenance methods include `deleteItem`, `openRootInExplorer`, and the recursive file/folder Explorer reveal flow.

Never expose unrestricted Node APIs.

## package.json

Dependencies, scripts, app identity, Electron entry, Windows packaging, icon, GitHub publisher, and version.

## .github/workflows/release.yml

Windows x64 release pipeline. Runs from version tags and validates the tag/package version before publishing.

## RELEASING.md

Human release checklist and explanation of packaging, updater behavior, and signing.

## build/icon.ico

Windows application icon. Keep it as a valid ICO suitable for packaged builds.

## .dev/

Developer documentation itself. Keep it committed; do not replace it with a private README workflow.
