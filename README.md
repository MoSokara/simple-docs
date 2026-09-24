# Sokara Docs

Personal offline-first documentation and learning library.

## Current direction

Sokara Docs is a Web app first. Desktop and Mobile packaging are intentionally postponed.

Runtime data is stored in the browser, not in GitHub or public/docs.

Architecture:

React + Next.js
-> Dexie
-> IndexedDB
-> local files as Blobs + metadata
-> optional Supabase Storage

## Local storage

The browser uses IndexedDB through Dexie.

Stored locally:

- Markdown
- TXT
- PDF
- Images
- Folder structure
- File metadata

The app requests persistent browser storage when supported.

Saving or importing user documents does not create Git commits.

## Supported files

- .md
- .txt
- .pdf
- .png
- .jpg
- .jpeg
- .webp
- .gif
- .svg

## File management

Implemented:

- Create Markdown
- Create TXT
- Create folders
- Import files
- Import folders
- Edit Markdown/TXT
- Markdown preview
- Rename files
- Rename folders
- Move files
- Move folders
- Delete files
- Delete folders recursively
- Download files
- Export folders as ZIP
- Search filenames
- Search Markdown/TXT content
- Responsive mobile Explorer

## Backup

Settings -> Backup creates a complete compressed SokaraDocs-Backup-YYYY-MM-DD.sokara file.

The backup contains:

- Folder structure
- File metadata
- File contents
- Manifest

It can be moved manually between devices.

## Offline

A service worker caches the application shell and runtime GET requests.

The library itself is stored locally in IndexedDB, so reading and editing documents does not require Internet.

## Cloud

Recommended cloud architecture:

- Authentication: Supabase Auth
- Files: Supabase Storage
- Local: IndexedDB + Dexie
- Cloud path: user-id/library-path

Cloud is optional.

Uploading a document uses object storage. It does not create a Git commit.

### Enable Supabase

1. Create a Supabase project.
2. Create a private Storage bucket named sokara-docs.
3. Run supabase/storage.sql.
4. Copy .env.example to .env.local.
5. Add NEXT_PUBLIC_SUPABASE_URL.
6. Add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.
7. Restart Next.js.
8. Open Settings -> Cloud storage.
9. Create an account or sign in.
10. Use Upload library or Restore cloud.

The first cloud implementation intentionally uses manual upload and restore. Automatic conflict-aware two-way sync can be added later.

## Shortcuts

- Ctrl/Cmd + P: focus search
- Ctrl/Cmd + Shift + F: focus search
- Ctrl/Cmd + B: toggle Explorer on small screens
- Ctrl/Cmd + O: import a folder
- Ctrl/Cmd + S: save while editing

## Run

npm install
npm run dev

Production:

npm run build
npm run start

## Future

The architecture leaves room for:

- Tauri desktop
- Tauri Android
- iOS
- Better Markdown editor
- Advanced PDF controls
- Automatic two-way sync
- Conflict detection
- Version history
- Selective sync
- Encrypted backups
