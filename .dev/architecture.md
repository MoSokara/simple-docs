# Architecture

## Runtime layers

```text
Windows filesystem
      ↓
electron/main.cjs
      ↓
electron/preload.cjs
      ↓
lib/desktop-api.ts
      ↓
React components
      ↓
Explorer + viewer
```

## Main process

Electron main owns privileged work: filesystem reads/writes, validation, folder selection, Explorer/editor/default-app launching, file watching, ZIP export, persisted state, updater setup, and packaged renderer loading.

## Renderer

The Next.js/React renderer owns UI state and presentation. It never receives unrestricted Node.js APIs.

## File tree paths

`scanFolder()` builds a recursive `DocFolder` tree. The root uses relative path `""`; a child folder receives its real relative path. Creation actions must pass that path unchanged.

## Create flow

```text
UI button
  ↓
DocsApp.openCreateDialog(type, parentPath)
  ↓
desktop.createFolder/createFile(parentPath, name)
  ↓
preload IPC
  ↓
main createFolder/createFile
  ↓
validation + filesystem write
  ↓
scan + watcher refresh
```

## Context menu

Every file and folder except the opened root node can open the custom context menu.

A folder context menu creates items inside that folder. A file context menu creates siblings in that file's containing folder.

## Delete flow

The renderer sends a relative root-item path. Electron main verifies again that the target is exactly one level below the opened root, asks for native confirmation, removes the item, clears deleted selection state, and schedules a refresh.

## Root Explorer flow

The sidebar root text shows the absolute root path using the native HTML `title` attribute. Double-clicking the text invokes `shell.openPath(rootPath)`.
