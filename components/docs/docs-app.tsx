"use client";
import { Menu, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { FileTree } from "./file-tree";
import { FileViewer } from "./file-viewer";
import type { DocFile, DocFolder } from "@/types/docs";

function flatten(f: DocFolder): DocFile[] {
  return [...f.files, ...f.folders.flatMap(flatten)];
}

export function DocsApp({ tree }: { tree: DocFolder }) {
  const [selected, setSelected] = useState<DocFile | null>(null);
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const files = useMemo(() => flatten(tree), [tree]);
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? files.filter((f) => f.name.toLowerCase().includes(q)) : [];
  }, [files, query]);
  function select(f: DocFile) {
    setSelected(f);
    setMobileOpen(false);
    setQuery("");
  }
  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 md:px-4">
        <button
          className="rounded-md p-2 md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
        <div className="flex shrink-0 items-center gap-2 font-semibold">
          <span className="text-[var(--color-brand)]">Sokara</span>
          <span>Docs</span>
        </div>
        <div className="relative ml-auto w-full max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-placeholder)]"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files..."
            className="h-9 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] pl-9 pr-3 text-sm outline-none focus:border-[var(--color-brand)]"
          />
          {query.trim() && (
            <div className="docs-scroll absolute left-0 right-0 top-11 z-30 max-h-80 overflow-auto rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-xl">
              {matches.length ? (
                matches.map((f) => (
                  <button
                    key={f.path}
                    onClick={() => select(f)}
                    className="flex w-full flex-col rounded px-3 py-2 text-left hover:bg-[var(--color-surface-soft)]"
                  >
                    <span className="truncate text-sm font-medium">
                      {f.name}
                    </span>
                    <span className="truncate text-xs text-[var(--color-muted)]">
                      {f.path}
                    </span>
                  </button>
                ))
              ) : (
                <div className="p-3 text-sm text-[var(--color-muted)]">
                  No files matched “{query}”.
                </div>
              )}
            </div>
          )}
        </div>
      </header>
      <div className="relative flex min-h-0 flex-1">
        <aside
          className={`absolute inset-y-0 left-0 z-20 w-72 border-r border-[var(--color-border)] bg-[var(--color-bg-elevated)] transition-transform md:static md:block md:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="flex h-full min-h-0 flex-col">
            <div className="border-b border-[var(--color-border)] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
              Explorer
            </div>
            <div className="docs-scroll min-h-0 flex-1 overflow-auto p-2">
              <FileTree
                folder={tree}
                selectedPath={selected?.path ?? null}
                onSelect={select}
              />
            </div>
          </div>
        </aside>
        {mobileOpen && (
          <button
            className="absolute inset-0 z-10 bg-black/30 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
        <main className="min-w-0 flex-1">
          <FileViewer file={selected} />
        </main>
      </div>
    </div>
  );
}
