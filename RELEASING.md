# Releasing Simple Docs for Windows

Simple Docs is distributed as a Windows x64 desktop application.

## What gets released

- NSIS installer: install the application normally on Windows.
- ZIP archive: extract and run the packaged application without installing it.
- Windows update metadata used by the installed app for automatic updates.

The ZIP build is for portable/manual distribution. Automatic updates are intended for the installed NSIS version.

## First release

The first release version is 1.0.0.

Run the local checks:

npm install
npm run typecheck
npm run lint
npm run build
npm run dist

npm run dist builds the Windows installer and ZIP locally. Test the installer before publishing.

## Publish a release

After the release commit is on main:

git tag v1.0.0
git push origin v1.0.0

The GitHub Actions workflow in .github/workflows/release.yml will check out the tag, install dependencies, verify the version, run typecheck and lint, build Next.js, package Windows x64, and publish the assets to the GitHub Release.

Because the repository is public, the installed application can check public GitHub Releases without storing a GitHub token in the app.

## How the application updates

The packaged Electron app uses electron-updater.

Example:

Installed 1.0.0
        ↓
GitHub 1.0.1
        ↓
Download update
        ↓
Quit Simple Docs
        ↓
Install 1.0.1
        ↓
Start Simple Docs 1.0.1

Do not use draft-only releases for production updates. The installer and update metadata must be published together by the release workflow.

## Versioning

Use Semantic Versioning:

1.0.0 → 1.0.1   bug fixes
1.0.0 → 1.1.0   new backward-compatible features
1.0.0 → 2.0.0   breaking changes

Always update package.json before creating the matching Git tag.

## Production architecture

Development:

Next.js dev server → http://localhost:3000 → Electron window

Production:

next build → out/ → Electron → simple-docs://app/ → Windows application

The custom protocol keeps the packaged renderer separate from the user's filesystem. Electron's privileged desktop work continues to live in the main process, while the renderer communicates through the existing preload IPC bridge.

## Code signing

The first release is intentionally configured without Windows code signing so the packaging and update pipeline can be established first.

Unsigned Windows applications can trigger SmartScreen or publisher warnings. When a code-signing certificate is available, configure signing for CI and re-enable update signature verification.

## Important rule

The user's real documentation folder remains the source of truth.

The installer does not package the user's documents, and an application update does not replace or copy that folder.
