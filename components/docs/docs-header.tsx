"use client";

import { Download, File, FolderOpen, Menu, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { DocFile, SearchResult } from "@/types/docs";

type Props = {
  query: string;
  results: SearchResult[];
  exporting: boolean;
  busy: boolean;
  hasFolder: boolean;
  mobileOpen: boolean;
  onQueryChange: (value: string) => void;
  onSelectResult: (file: DocFile) => void;
  onImport: () => void;
  onExport: () => void;
  onToggleMobile: () => void;
};

function resultColor(type: SearchResult["type"]) {
  if (type === "markdown") return "bg-file-markdown";
  if (type === "text") return "bg-file-text";
  if (type === "code") return "bg-file-code";
  if (type === "pdf") return "bg-file-pdf";
  if (type === "image") return "bg-file-image";
  if (type === "word") return "bg-file-word";
  if (type === "powerpoint") return "bg-file-powerpoint";
  if (type === "excel") return "bg-file-excel";
  if (type === "access") return "bg-file-access";
  return "bg-file-other";
}

export function DocsHeader(props: Props) {
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const fileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!fileMenuOpen) return;

    function close(event: MouseEvent) {
      if (!fileMenuRef.current?.contains(event.target as Node)) {
        setFileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [fileMenuOpen]);

  function importFolder() {
    setFileMenuOpen(false);
    props.onImport();
  }

  function exportFolder() {
    setFileMenuOpen(false);
    props.onExport();
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-1.5 border-b border-border bg-bg px-2 md:gap-2 md:px-4">
      <button
        className="rounded-md p-2 hover:bg-hover md:hidden"
        onClick={props.onToggleMobile}
        aria-label="Toggle file explorer"
      >
        {props.mobileOpen ? <X size={19} /> : <Menu size={19} />}
      </button>

      <div className="shrink-0 text-base font-semibold tracking-tight">
        <span className="text-brand">Simple</span> Docs
      </div>

      <div className="relative shrink-0" ref={fileMenuRef}>
        <button
          onClick={() => setFileMenuOpen((value) => !value)}
          className="flex h-9 items-center gap-1.5 px-2 text-sm text-soft hover:bg-hover sm:px-2.5"
          aria-expanded={fileMenuOpen}
          aria-haspopup="menu"
        >
          <File size={15} />
          <span>File</span>
          <span className="text-[10px] text-muted">⌄</span>
        </button>

        {fileMenuOpen && (
          <div className="absolute left-0 top-11 z-50 min-w-52 border border-border bg-bg shadow-xl" role="menu">
            <button
              onClick={importFolder}
              disabled={props.busy}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-soft hover:bg-hover disabled:opacity-40"
              role="menuitem"
            >
              <FolderOpen size={16} />
              Import folder
            </button>
            <button
              onClick={exportFolder}
              disabled={!props.hasFolder || props.exporting}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-soft hover:bg-hover disabled:opacity-40"
              role="menuitem"
            >
              <Download size={16} />
              Export ZIP
            </button>
          </div>
        )}
      </div>

      <div className="relative ml-auto min-w-0 flex-1">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-placeholder" />
        <input
          value={props.query}
          onChange={(event) => props.onQueryChange(event.target.value)}
          placeholder="Search files and notes…"
          className="h-9 w-full border border-border bg-bg-soft pl-9 pr-3 text-sm text-text outline-none placeholder:text-placeholder focus:border-brand"
          aria-label="Search files and notes"
        />

        {props.query.trim() && (
          <div className="absolute left-0 right-0 top-11 z-50 max-h-96 overflow-auto border border-border bg-bg shadow-xl">
            {props.results.length ? (
              props.results.map((result) => (
                <button
                  key={result.path}
                  onClick={() => props.onSelectResult(result)}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-hover"
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${resultColor(result.type)}`} />
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
        onClick={props.onExport}
        disabled={!props.hasFolder || props.exporting}
        className="flex h-9 shrink-0 items-center gap-2 px-2.5 text-sm font-medium text-soft hover:bg-hover hover:text-text disabled:cursor-not-allowed disabled:opacity-40 sm:px-3"
        title={props.exporting ? "Creating ZIP backup…" : "Export folder as ZIP"}
        aria-label="Export folder as ZIP"
      >
        <Download size={16} />
        <span>Export</span>
      </button>
    </header>
  );
}
