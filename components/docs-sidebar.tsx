"use client";

import { FilePlus2, FolderOpen, FolderPlus, GripVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { DocFile, DocFolder } from "@/types/docs";
import { FileTree } from "./file-tree";

const MIN_WIDTH = 220;
const MAX_WIDTH = 440;
const DEFAULT_WIDTH = 288;

function folderName(rootPath: string | null) {
  if (!rootPath) return "No folder";
  return rootPath.split(/[\\/]/).filter(Boolean).pop() ?? rootPath;
}

function parentPath(rootPath: string | null) {
  if (!rootPath) return "";

  const segments = rootPath.split(/[\\/]/).filter(Boolean);
  const parents = segments.slice(0, -1);

  return parents.slice(-2).join(" / ");
}

export function DocsSidebar({
  tree,
  rootPath,
  selectedPath,
  mobileOpen,
  busy,
  onSelect,
  onOpenFolder,
  onCreateFolder,
  onCreateFile,
}: {
  tree: DocFolder | null;
  rootPath: string | null;
  selectedPath: string | null;
  mobileOpen: boolean;
  busy: boolean;
  onSelect: (file: DocFile) => void;
  onOpenFolder: () => void;
  onCreateFolder: () => void;
  onCreateFile: () => void;
}) {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    function onMove(event: PointerEvent) {
      if (!resizeRef.current) return;

      setWidth(Math.min(
        MAX_WIDTH,
        Math.max(
          MIN_WIDTH,
          resizeRef.current.startWidth + event.clientX - resizeRef.current.startX,
        ),
      ));
    }

    function onUp() {
      if (!resizeRef.current) return;
      resizeRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, []);

  function startResize(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;

    event.preventDefault();
    resizeRef.current = { startX: event.clientX, startWidth: width };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }

  return (
    <aside
      style={{ width: width + "px" }}
      className={
        "absolute inset-y-14 left-0 z-30 max-w-[calc(100vw-3rem)] shrink-0 border-r border-border bg-bg-alt " +
        "transition-transform md:static md:translate-x-0 " +
        (mobileOpen ? "translate-x-0" : "-translate-x-full")
      }
    >
      <div className="flex h-full min-h-0 flex-col">
        <div
          className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-3"
          title={rootPath ?? undefined}
        >
          <FolderOpen size={15} className="shrink-0 text-muted" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold uppercase tracking-[0.12em] text-text">
              {folderName(rootPath)}
            </div>
            <div className="truncate text-[11px] leading-4 text-muted">
              {parentPath(rootPath) || "Local folder"}
            </div>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-0.5">
            <div className="group relative">
              <button
                type="button"
                onClick={onCreateFolder}
                disabled={!rootPath || busy}
                className="rounded p-1 text-muted hover:bg-hover hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="New Folder"
              >
                <FolderPlus size={15} />
              </button>
              <span className="pointer-events-none absolute right-0 top-full z-50 mt-1 whitespace-nowrap border border-border bg-bg px-2 py-1 text-[11px] text-soft opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                New Folder
              </span>
            </div>

            <div className="group relative">
              <button
                type="button"
                onClick={onCreateFile}
                disabled={!rootPath || busy}
                className="rounded p-1 text-muted hover:bg-hover hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="New File"
              >
                <FilePlus2 size={15} />
              </button>
              <span className="pointer-events-none absolute right-0 top-full z-50 mt-1 whitespace-nowrap border border-border bg-bg px-2 py-1 text-[11px] text-soft opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                New File
              </span>
            </div>
          </div>
        </div>

        <div className="docs-scroll min-h-0 flex-1 overflow-auto py-2">
          {tree ? (
            <FileTree
              folder={tree}
              selectedPath={selectedPath}
              onSelect={onSelect}
              onCreateFolder={onCreateFolder}
              onCreateFile={onCreateFile}
            />
          ) : (
            <div className="p-5 text-sm text-muted">Open a folder to start.</div>
          )}
        </div>

        <div className="shrink-0 border-t border-border p-2">
          <button
            onClick={onOpenFolder}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 px-3 py-2 text-sm text-soft hover:bg-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FolderOpen size={16} className="shrink-0" />
            <span className="truncate">{busy ? "Opening…" : "Open another folder"}</span>
          </button>
        </div>

        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize file explorer"
          tabIndex={0}
          onPointerDown={startResize}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              setWidth((value) => Math.max(MIN_WIDTH, value - 16));
            }
            if (event.key === "ArrowRight") {
              setWidth((value) => Math.min(MAX_WIDTH, value + 16));
            }
          }}
          className="group absolute inset-y-0 -right-1 hidden w-2 cursor-col-resize md:block"
        >
          <div className="mx-auto h-full w-px bg-transparent transition-colors group-hover:bg-brand/60" />
          <GripVertical
            size={12}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-placeholder opacity-0 transition-opacity group-hover:opacity-100"
          />
        </div>
      </div>
    </aside>
  );
}
