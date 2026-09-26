# Code Change Guide

## 1. Nested creation

Correct flow:

```ts
onCreateFolder(folder.path)
onCreateFile(folder.path)
```

The root header uses:

```ts
onCreateFolder("")
onCreateFile("")
```

The callback signature must remain `(parentPath: string) => void` all the way from DocsApp to FileTree. A no-argument callback in DocsSidebar would silently turn every nested action into a root action.

## 2. Context menu scope

Attach the context-menu callback to every file and every folder except the opened root node.

For a folder target, use `target.path` as the creation parent. For a file target, use `target.parentPath` so New File/New Folder are created beside that file in the same containing folder.

## 3. Delete safety

The renderer is not the security boundary.

Electron main must:
1. resolve the relative path through `relativeSafe()`
2. calculate the path relative to root
3. reject the root itself but allow nested paths
4. use `lstat()`
5. ask for native confirmation
6. call `fs.rm()`
7. clear selected state if the deleted item contained the selection

Never accept an absolute delete path from the renderer.

## 4. Root header

Keep the absolute root path in the native `title` attribute. The middle text area gets only a subtle hover background. Double-click opens the folder in Windows Explorer.

## 5. Tooltips

Creation buttons use native `title` strings such as:

```text
New File in C:\Docs\Programming
New Folder in C:\Docs\Programming
```

Do not add custom tooltip panels for this interaction.

## 6. Input focus

The global input focus rule should remove the large outline and keep the light border with a color change.

## 7. File colors

Supported extensions use individual `--token-ext-*` variables. Unsupported files use the error-like fallback.

Keep colors distinctive but muted.

## 8. Adding IPC

Make the change in this order:

main → preload → types → desktop-api → React → .dev docs

Then run typecheck/lint and test the packaged app for desktop behavior.
