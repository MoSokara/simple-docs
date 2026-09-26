# Simple Docs — Developer Guide

This folder is the development source of truth for maintaining Simple Docs.

Start with:
- architecture.md — how the application layers communicate.
- development.md — how to run, test, debug, commit, and change the project.
- source-files.md — what every source/config file does and where each important code section belongs.
- code-changes.md — rules for common feature changes and filesystem safety.
- production.md — Windows production build, release, and updater flow.

Core rule:

```text
Real Windows folder
      ↓
Electron main
      ↓
preload / IPC
      ↓
typed desktop API
      ↓
React UI
```

The real local folder is always the source of truth. Do not add a second document database unless the architecture is intentionally changed.
