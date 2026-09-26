# Releasing Simple Docs for Windows

Simple Docs is distributed as a Windows x64 desktop application.

## Current releases

- Stable: v1.0.0
- Next release in development: v1.1.0

## Release artifacts

- NSIS installer.
- ZIP archive.
- Windows update metadata used by electron-updater.

The ZIP is intended for portable/manual distribution. Automatic updates are intended for the installed NSIS version.

## Local checks

Run before tagging:

~~~bash
npm install
npm run typecheck
npm run lint
npm run build
npm run dist
~~~

Test the generated Windows installer manually before publishing.

## Publish v1.1.0

Update package.json to 1.1.0, merge the feature work into main, then:

~~~bash
git switch main
git pull origin main
git tag v1.1.0
git push origin v1.1.0
~~~

The tag must exactly match the package version.

GitHub Actions then runs typecheck, lint, Next build, electron-builder, and publishes the GitHub Release.

## Automatic updates

The packaged app uses electron-updater.

~~~text
Installed v1.0.0
       ↓
GitHub v1.1.0
       ↓
download
       ↓
install on app quit
       ↓
launch v1.1.0
~~~

Always publish the installer and updater metadata together through the release workflow.

## Versioning

~~~text
1.0.0 → 1.0.1   bug fixes
1.0.0 → 1.1.0   backward-compatible features
1.0.0 → 2.0.0   breaking changes
~~~

## Code signing

The first public release is unsigned. Add signing later when a Windows certificate is available.

## Important rule

The user's real documentation folder remains the source of truth. Application updates do not replace or copy that folder.
