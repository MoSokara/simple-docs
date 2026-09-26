"use client";

import { Download, Menu, Search, X } from "lucide-react";
import type { DocFile, SearchResult } from "@/types/docs";
import { fileColorStyle } from "@/types/file-type";

type Props = {
  query: string;
  results: SearchResult[];
  exporting: boolean;
  hasFolder: boolean;
  mobileOpen: boolean;
  onQueryChange: (value: string) => void;
  onSelectResult: (file: DocFile) => void;
  onExport: () => void;
  onToggleMobile: () => void;
};

export function DocsHeader({
  query,
  results,
  exporting,
  hasFolder,
  mobileOpen,
  onQueryChange,
  onSelectResult,
  onExport,
  onToggleMobile,
}: Props) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-bg px-2 md:px-4">
      <button
        className="rounded-md p-2 hover:bg-hover md:hidden"
        onClick={onToggleMobile}
        aria-label="Toggle file explorer"
      >
        {mobileOpen ? <X size={19} /> : <Menu size={19} />}
      </button>

      <div className="shrink-0 text-base font-semibold tracking-tight">
        <span className="text-brand">Simple</span> Docs
      </div>

      <div className="relative ml-auto min-w-0 flex-1 max-w-2xl">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-placeholder" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search files and notes…"
          className="h-9 w-full border border-border bg-bg-soft pl-9 pr-3 text-sm text-text outline-none placeholder:text-placeholder focus:border-brand"
          aria-label="Search files and notes"
        />

        {query.trim() && (
          <div className="absolute left-0 right-0 top-11 z-50 max-h-96 overflow-auto border border-border bg-bg shadow-xl">
            {results.length ? (
              results.map((result) => (
                <button
                  key={result.path}
                  onClick={() => onSelectResult(result)}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-hover"
                >
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: fileColorStyle(result.name).color }} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-text">{result.name}</span>
                    <span className="block truncate text-xs text-muted">{result.path}</span>
                  </span>
                </button>
              ))
            ) : (
              <div className="p-3 text-sm text-muted">No matches.</div>
            )}
          </div>
        )}
      </div>

      <button
        onClick={onExport}
        disabled={!hasFolder || exporting}
        className="flex h-9 shrink-0 items-center gap-2 px-2.5 text-sm font-medium text-soft hover:bg-hover hover:text-text disabled:cursor-not-allowed disabled:opacity-40 sm:px-3"
        title={exporting ? "Creating ZIP backup…" : "Export folder as ZIP"}
        aria-label="Export folder as ZIP"
      >
        <Download size={16} />
        <span>Export</span>
      </button>
    </header>
  );
}
