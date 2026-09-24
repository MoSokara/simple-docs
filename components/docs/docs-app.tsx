"use client";

import { Download, FolderOpen, Menu, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { desktop } from "@/lib/desktop-api";
import type { DocFile, DocFolder, SearchResult } from "@/types/docs";
import { FileTree } from "./file-tree";
import { FileViewer } from "./file-viewer";

export function DocsApp() {
  const [tree, setTree] = useState<DocFolder | null>(null);
  const [rootPath, setRootPath] = useState<string | null>(null);
  const [selected, setSelected] = useState<DocFile | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function openFolder() {
    setBusy(true);
    try {
      const result = await desktop.openFolder();
      setTree(result.tree);
      setRootPath(result.rootPath);
      setSelected(null);
      setQuery("");
      setResults([]);
    } finally {
      setBusy(false);
    }
  }

  function selectFile(file: DocFile) {
    setSelected(file);
    void desktop.setSelectedFile(file.path);
    setMobileOpen(false);
  }

  useEffect(() => {
    let active = true;
    desktop.getState().then(async (state) => {
      if (!active) return;
      setRootPath(state.rootPath);
      const next = await desktop.scan();
      if (!active) return;
      setTree(next);
      if (state.selectedPath && next) {
        const find = (folder: DocFolder): DocFile | null => {
          const file = folder.files.find((item) => item.path === state.selectedPath);
          if (file) return file;
          for (const child of folder.folders) {
            const match = find(child);
            if (match) return match;
          }
          return null;
        };
        const file = find(next);
        if (file) setSelected(file);
      }
    });
    const off = desktop.onFolderChanged(async () => {
      const current = selected?.path;
      const next = await desktop.scan();
      if (!active) return;
      setTree(next);
      if (current) {
        const find = (folder: DocFolder): DocFile | null => {
          const file = folder.files.find((item) => item.path === current);
          if (file) return file;
          for (const child of folder.folders) {
            const match = find(child);
            if (match) return match;
          }
          return null;
        };
        setSelected(find(next));
      }
    });
    return () => { active = false; off(); };
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) { setResults([]); return; }
    let active = true;
    const timer = window.setTimeout(async () => {
      const found = await desktop.search(q);
      if (active) setResults(found.slice(0, 50));
    }, 180);
    return () => { active = false; window.clearTimeout(timer); };
  }, [query]);

  if (!desktop.isAvailable()) {
    return <div className="flex h-screen items-center justify-center p-8 text-center"><div><h1 className="text-2xl font-semibold">Simple Docs</h1><p className="mt-2 text-sm text-[var(--color-muted)]">Run the desktop app with <code>npm run dev</code>.</p></div></div>;
  }

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2 md:px-4">
        <button className="rounded-md p-2 md:hidden" onClick={() => setMobileOpen((value) => !value)}>{mobileOpen ? <X size={19} /> : <Menu size={19} />}</button>
        <button onClick={() => void openFolder()} className="flex shrink-0 items-center gap-2 font-semibold" title="Open folder">
          <span className="text-[var(--color-brand)]">Simple</span><span>Docs</span>
        </button>
        <div className="relative ml-auto w-full max-w-xl">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-placeholder)]" />
          <input id="docs-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search files and notes…" className="h-9 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] pl-9 pr-3 text-sm outline-none focus:border-[var(--color-brand)]" />
          {query.trim() && (
            <div className="docs-scroll absolute left-0 right-0 top-11 z-50 max-h-96 overflow-auto rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-xl">
              {results.length ? results.map((result) => (
                <button key={result.path} onClick={() => { selectFile(result); setQuery(""); }} className="flex w-full flex-col rounded px-3 py-2 text-left hover:bg-[var(--color-surface-soft)]">
                  <span className="truncate text-sm font-medium">{result.name}</span>
                  <span className="truncate text-xs text-[var(--color-muted)]">{result.path}</span>
                </button>
              )) : <div className="p-3 text-sm text-[var(--color-muted)]">No matches.</div>}
            </div>
          )}
        </div>
        <button onClick={() => void desktop.exportZip()} disabled={!rootPath || busy} className="rounded-md p-2 hover:bg-[var(--color-surface-soft)] disabled:opacity-40" title="Export folder as ZIP"><Download size={18} /></button>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className={"absolute inset-y-14 left-0 z-30 w-72 border-r border-[var(--color-border)] bg-[var(--color-bg-elevated)] transition-transform md:static md:translate-x-0 " + (mobileOpen ? "translate-x-0" : "-translate-x-full")}>
          <div className="flex h-full min-h-0 flex-col">
            <div className="border-b border-[var(--color-border)] px-3 py-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]"><FolderOpen size={14} /> {rootPath ? rootPath.split(/[\\/]/).pop() : "No folder"}</div>
              {rootPath && <p className="mt-1 truncate text-[11px] text-[var(--color-muted)]" title={rootPath}>{rootPath}</p>}
            </div>
            <div className="docs-scroll min-h-0 flex-1 overflow-auto p-2">
              {tree ? <FileTree folder={tree} selectedPath={selected?.path ?? null} onSelect={selectFile} /> : <div className="p-5 text-sm text-[var(--color-muted)]">Open a folder to start.</div>}
            </div>
            <div className="border-t border-[var(--color-border)] p-2">
              <button onClick={() => void openFolder()} className="flex w-full items-center justify-center gap-2 rounded-md border border-[var(--color-border)] px-3 py-2 text-sm hover:bg-[var(--color-surface-soft)]" disabled={busy}>
                <FolderOpen size={16} /> {busy ? "Opening…" : "Open another folder"}
              </button>
            </div>
          </div>
        </aside>

        {mobileOpen && <button className="fixed inset-0 z-20 bg-black/35 md:hidden" onClick={() => setMobileOpen(false)} />}
        <main className="min-w-0 flex-1"><FileViewer file={selected} onEdit={(file) => void desktop.openInEditor(file.path)} /></main>
      </div>
    </div>
  );
}