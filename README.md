# Sokara Docs

A personal documentation and learning library with a VS Code-style Explorer.

## Features

- Technology and subject folders discovered automatically from `public/docs`.
- Markdown rendering for `.md` with headings, lists, links, tables, quotes, and code blocks.
- Plain-text viewer for `.txt`.
- Browser PDF viewer for `.pdf`.
- Image viewer for PNG, JPG/JPEG, WEBP, GIF, and SVG.
- File-name search from the header.
- Responsive Explorer drawer on mobile.
- Desktop app stays inside `h-screen` with independent scrolling.
- Visual tokens inspired by the Sokara portfolio design system.

## Add content

The filesystem is the source of truth. You do not maintain a JSON registry.

Example:

    public/docs/
    ├── Git/
    │   ├── aliases.md
    │   └── config.md
    ├── CS50/
    │   └── Week 1 - C/
    │       └── command_line.pdf
    └── Books/
        └── Clean Code.pdf

### Add a folder

Create a folder anywhere under `public/docs`. The Explorer discovers it automatically.

### Add Markdown

Create a file such as:

    public/docs/JavaScript/Promises.md

Write normal Markdown. No React or TypeScript registration is needed.

### Add TXT

Create:

    public/docs/JavaScript/notes.txt

TXT is rendered as raw text, without Markdown formatting.

### Add PDF

Copy a PDF into any folder under `public/docs`:

    public/docs/Books/Clean Code.pdf

It opens inside the main viewer using the browser PDF engine.

### Add an image

Supported extensions:

    .png
    .jpg
    .jpeg
    .webp
    .gif
    .svg

Example:

    public/docs/CS50/Week 1 - C/ASCII Code.png

### Rename, move, edit, or delete

Perform the operation directly inside `public/docs`.

The app recursively scans the directory when the page is rendered, so there is no manual metadata file to update.

Unsupported file extensions are ignored.

## External documentation

Use normal Markdown links for sources such as MDN, Git, React, or Next.js:

    [MDN JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

## Run locally

    npm install
    npm run dev

Build and run production:

    npm run build
    npm run start

## Architecture

    public/docs
        ↓
    lib/docs.ts
        ↓
    recursive filesystem discovery
        ↓
    Explorer + file-name search
        ↓
    FileViewer
        ├── Markdown → marked + DOMPurify
        ├── TXT      → plain text
        ├── PDF      → browser PDF viewer
        └── Image    → image viewer

## Design

The interface intentionally follows the same general language as the Sokara portfolio:

- restrained borders
- blue brand accent
- dark developer-oriented surfaces
- subtle background grid
- compact radius and spacing
- readable documentation typography
- responsive navigation

The project currently keeps the design system local instead of coupling it to the portfolio repository.
