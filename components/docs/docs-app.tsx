"use client";

import { Download, FolderOpen, Menu, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { desktop, isDesktopAvailable } from "@/lib/desktop-api";
import type { DocFile, DocFolder, SearchResult } from "@/types/docs";
import { FileTree } from "./file-tree";
import { FileViewer } from "./file-viewer";

function findFile(folder: DocFolder | null, target: string | null): DocFile | null {
  if (!folder || !target) return null;
  const file = folder.files.find((item) => item.path === target);
  if (file) return file;

  for (const child of folder.folders) {
    const match = findFile(child, target);
    if (match) return match;
  }

  return null;
}

function formatBytes(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function DocsApp() {
  const [mounted, setMounted] = useState(false);
  const [tree, setTree] = useState<DocFolder | null>(null);
  const [rootPath, setRootPath] = useState<string | null>(null);
  const [selected, setSelected] = useState<DocFile | null>(null);
  const selectedPathRef = useRef<string | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState<"idle" | "preparing" | "compressing" | "complete" | "error">("idle");
  const [exportPath, setExportPath] = useState<string | null>(null);
  const [exportMessage, setExportMessage] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !isDesktopAvailable()) return;

    let active = true;

    desktop.getState().then(async (state) => {
      if (!active) return;

      setRootPath(state.rootPath);
      const next = await desktop.scan();
      if (!active) return;

      setTree(next);
      const file = findFile(next, state.selectedPath);
      setSelected(file);
      selectedPathRef.current = file?.path ?? null;
    }).catch(() => {
      if (active) setTree(null);
    });

    const offFolder = desktop.onFolderChanged(async () => {
      const current = selectedPathRef.current;
      const next = await desktop.scan();
      if (!active) return;

      setTree(next);
      const file = findFile(next, current);
      setSelected(file);
      selectedPathRef.current = file?.path ?? null;
    });

    const offExport = desktop.onExportProgress((payload) => {
      if (!active) return;

      setExportProgress(payload.percent);
      setExportStatus(payload.status);

      if (payload.status === "complete") {
        setExporting(false);
        setExportPath(payload.path ?? null);
        setExportMessage("ZIP backup is ready.");
      }

      if (payload.status === "error") {
        setExporting(false);
        setExportPath(null);
        setExportMessage(payload.message ?? "Export failed.");
      }
    });

    return () => {
      active = false;
      offFolder();
      offExport();
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !isDesktopAvailable()) return;

    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const found = await desktop.search(q);
        if (active) setResults(found.slice(0, 50));
      } catch {
        if (active) setResults([]);
      }
    }, 180);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [mounted, query]);

  async function openFolder() {
    setBusy(true);
    try {
      const result = await desktop.openFolder();
      setTree(result.tree);
      setRootPath(result.rootPath);
      setSelected(null);
      selectedPathRef.current = null;
      setQuery("");
      setResults([]);
    } finally {
      setBusy(false);
    }
  }

  function selectFile(file: DocFile) {
    setSelected(file);
    selectedPathRef.current = file.path;
    void desktop.setSelectedFile(file.path);
    setMobileOpen(false);
  }

  async function exportZip() {
    setExportPath(null);
    setExportMessage("");
    setExportProgress(0);
    setExportStatus("preparing");
    setExporting(true);

    try {
      const result = await desktop.exportZip();

      if (result.canceled) {
        setExporting(false);
        setExportStatus("idle");
        return;
      }

      if (!result.ok) {
        setExporting(false);
        setExportStatus("error");
        setExportMessage(result.message ?? "Export failed.");
      }
    } catch (error) {
      setExporting(false);
      setExportStatus("error");
      setExportMessage(error instanceof Error ? error.message : "Export failed.");
    }
  }

  if (!mounted) {
    return <div className="h-screen" />;
  }

  if (!isDesktopAvailable()) {
    return (
      <div className="flex h-screen items-center justify-center p-8 text-center">
        <div>
          <h1 className="text-2xl font-semibold">Simple Docs</h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">Run the desktop app with <code>npm run dev</code>.</p>
        </div>
      </div>
    );
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
          <input
            id="docs-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search files and notes…"
            className="h-9 w-full border border-[var(--color-border)] bg-[var(--color-surface)] pl-9 pr-3 text-sm outline-none focus:border-[var(--color-brand)]"
          />

          {query.trim() && (
            <div className="docs-scroll absolute left-0 right-0 top-11 z-50 max-h-96 overflow-auto border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-xl">
              {results.length ? results.map((result) => (
                <button
                  key={result.path}
                  onClick={() => { selectFile(result); setQuery(""); }}
                  className="flex w-full flex-col px-3 py-2 text-left hover:bg-[var(--color-surface-soft)]"
                >
                  <span className="truncate text-sm font-medium">{result.name}</span>
                  <span className="truncate text-xs text-[var(--color-muted)]">{result.path}</span>
                </button>
              )) : <div className="p-3 text-sm text-[var(--color-muted)]">No matches.</div>}
            </div>
          )}
        </div>

        <button
          onClick={() => void exportZip()}
          disabled={!rootPath || busy || exporting}
          className="relative rounded-md p-2 hover:bg-[var(--color-surface-soft)] disabled:opacity-40"
          title={exporting ? "Creating ZIP backup…" : "Export folder as ZIP"}
        >
          <Download size={18} />
        </button>
      </header>

      {exporting && (
        <div className="shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-[var(--color-soft)]">
              {exportStatus === "preparing" ? "Preparing backup…" : "Compressing folder…"}
            </span>
            <span className="text-[var(--color-muted)]">{exportProgress}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden bg-[var(--color-surface-soft)]">
            <div className="h-full bg-[var(--color-brand)] transition-[width] duration-150" style={{ width: `${exportProgress}%` }} />
          </div>
        </div>
      )}

      {exportStatus === "complete" && exportPath && !exporting && (
        <div className="flex shrink-0 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs">
          <span className="text-[var(--color-soft)]">{exportMessage}</span>
          <button onClick={() => void desktop.revealInExplorer(exportPath)} className="text-[var(--color-brand-strong)] hover:underline">Show in folder</button>
          <button onClick={() => { setExportStatus("idle"); setExportPath(null); }} className="ml-auto text-[var(--color-muted)] hover:text-[var(--color-text)]">Dismiss</button>
        </div>
      )}

      {exportStatus === "error" && !exporting && (
        <div className="flex shrink-0 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs">
          <span className="text-[var(--color-muted)]">{exportMessage}</span>
          <button onClick={() => setExportStatus("idle")} className="ml-auto text-[var(--color-muted)] hover:text-[var(--color-text)]">Dismiss</button>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <aside className={"absolute inset-y-14 left-0 z-30 w-72 border-r border-[var(--color-border)] bg-[var(--color-bg-elevated)] transition-transform md:static md:translate-x-0 " + (mobileOpen ? "translate-x-0" : "-translate-x-full")}>
          <div className="flex h-full min-h-0 flex-col">
            <div className="border-b border-[var(--color-border)] px-3 py-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                <FolderOpen size={14} />
                {rootPath ? rootPath.split(/[\\/]/).pop() : "No folder"}
              </div>
              {rootPath && <p className="mt-1 truncate text-[11px] text-[var(--color-muted)]" title={rootPath}>{rootPath}</p>}
            </div>

            <div className="docs-scroll min-h-0 flex-1 overflow-auto p-2">
              {tree ? <FileTree folder={tree} selectedPath={selected?.path ?? null} onSelect={selectFile} /> : <div className="p-5 text-sm text-[var(--color-muted)]">Open a folder to start.</div>}
            </div>

            <div className="border-t border-[var(--color-border)] p-2">
              <button onClick={() => void openFolder()} className="flex w-full items-center justify-center gap-2 border border-[var(--color-border)] px-3 py-2 text-sm hover:bg-[var(--color-surface-soft)]" disabled={busy}>
                <FolderOpen size={16} /> {busy ? "Opening…" : "Open another folder"}
              </button>
            </div>
          </div>
        </aside>

        {mobileOpen && <button className="fixed inset-0 z-20 bg-black/35 md:hidden" onClick={() => setMobileOpen(false)} />}

        <main className="min-w-0 flex-1 bg-[var(--color-bg)]">
          <FileViewer file={selected} onEdit={(file) => void desktop.openInEditor(file.path)} />
        </main>
      </div>
    </div>
  );
}
