# Production Build and Release

## Local production build

```bash
npm run build
npm run dist
```

The distribution step creates the Windows installer and ZIP artifact.

## Release prerequisites

Before tagging:
- typecheck passes
- lint passes
- build passes
- packaged installer is installed and tested
- filesystem create/delete flows are tested
- updater configuration is unchanged or intentionally reviewed

## Git release flow

```text
feature branch
  ↓
checks + package test
  ↓
PR review
  ↓
merge main
  ↓
update package.json version
  ↓
git tag vX.Y.Z
  ↓
git push origin vX.Y.Z
  ↓
GitHub Actions
  ↓
GitHub Release
```

For the current feature branch, do not tag v1.1.0 until the PR is merged and the installer test is complete.

## Packaging

electron-builder is configured for Windows x64 NSIS + ZIP. The application icon comes from `build/icon.ico`.

## Updates

Packaged builds use `electron-updater` with GitHub Releases. Releases are expected to expose the artifacts required by the updater.

## Signing

The current configuration is unsigned. Code signing can be added later without changing the renderer architecture.
