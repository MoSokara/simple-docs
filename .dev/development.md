# Development Workflow

## Requirements

- Windows
- Node.js LTS
- npm
- VS Code recommended

## Run

```bash
npm install
npm run dev
```

## Validation

```bash
npm run typecheck
npm run lint
npm run build
npm run dist
```

## Development loop

1. Work on the feature branch.
2. Make one focused change.
3. Run typecheck and lint.
4. Start Electron and exercise the exact user flow.
5. Run `npm run dist` for packaged Windows behavior.
6. Commit the focused change.
7. Push and update the PR.

## Filesystem checklist

Test:
- root and nested creation
- duplicate names
- invalid Windows names
- root-only right click
- native delete confirmation
- deleting a folder with contents
- external watcher refresh
- root header double-click
- state restoration

## UI rules

Use existing tokens from `app/globals.css`. Inputs intentionally change only their border color when focused; no large outline is shown.

Use native `title` tooltips for small utility buttons when the requested interaction is simply explanatory text.

## IPC change order

```text
main.cjs
  ↓
preload.cjs
  ↓
types/electron.d.ts
  ↓
lib/desktop-api.ts
  ↓
React component
  ↓
.dev documentation
```

Never expose raw `fs`, `path`, `child_process`, or `ipcRenderer` to the renderer.
