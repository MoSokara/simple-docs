"use client";

import { FilePlus2, FolderOpen, FolderPlus, GripVertical } from "lucide-react";
import { FileContextMenu, type FileContextTarget } from "./file-context-menu";
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
  onDeleteRootItem,
  onOpenRootInExplorer,
}: {
  tree: DocFolder | null;
  rootPath: string | null;
  selectedPath: string | null;
  mobileOpen: boolean;
  busy: boolean;
  onSelect: (file: DocFile) => void;
  onOpenFolder: () => void;
  onCreateFolder: (parentPath: string) => void;
  onCreateFile: (parentPath: string) => void;
  onDeleteRootItem: (relativePath: string) => void;
  onOpenRootInExplorer: () => Promise<void> | void;
}) {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    target: FileContextTarget;
  } | null>(null);
  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    function closeContextMenu() {
      setContextMenu(null);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeContextMenu();
    }

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
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("click", closeContextMenu);
    window.addEventListener("resize", closeContextMenu);
    window.addEventListener("scroll", closeContextMenu, true);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("click", closeContextMenu);
      window.removeEventListener("resize", closeContextMenu);
      window.removeEventListener("scroll", closeContextMenu, true);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, []);

  function openContextMenu(event: React.MouseEvent, target: FileContextTarget) {
    event.preventDefault();
    event.stopPropagation();

    const width = 208;
    const height = target.kind === "folder" ? 160 : 128;
    const x = Math.min(event.clientX, Math.max(8, window.innerWidth - width - 8));
    const y = Math.min(event.clientY, Math.max(8, window.innerHeight - height - 8));

    setContextMenu({ x, y, target });
  }

  function closeContextMenu() {
    setContextMenu(null);
  }

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
        <div className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-3">
          <FolderOpen size={15} className="shrink-0 text-muted" />
          <button
            type="button"
            disabled={!rootPath}
            onDoubleClick={() => void onOpenRootInExplorer()}
            title={rootPath ?? undefined}
            className="min-w-0 flex-1 rounded-sm px-1.5 py-1 text-left transition-colors hover:bg-hover disabled:cursor-default"
          >
            <div className="truncate text-xs font-semibold uppercase tracking-[0.12em] text-text">
              {folderName(rootPath)}
            </div>
            <div className="truncate text-[11px] leading-4 text-muted">
              {parentPath(rootPath) || "Local folder"}
            </div>
          </button>
          <div className="ml-auto flex shrink-0 items-center gap-0.5">
            <div className="group relative">
              <button
                type="button"
                onClick={() => onCreateFolder("")}
                disabled={!rootPath || busy}
                title={rootPath ? "New Folder in " + rootPath : undefined}
                className="rounded p-1 text-muted hover:bg-hover hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="New Folder"
              >
                <FolderPlus size={15} />
              </button>
            </div>

            <div className="group relative">
              <button
                type="button"
                onClick={() => onCreateFile("")}
                disabled={!rootPath || busy}
                title={rootPath ? "New File in " + rootPath : undefined}
                className="rounded p-1 text-muted hover:bg-hover hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="New File"
              >
                <FilePlus2 size={15} />
              </button>
            </div>
          </div>
        </div>

        <div className="docs-scroll min-h-0 flex-1 overflow-auto py-2">
          {tree ? (
            <FileTree
              folder={tree}
              rootPath={rootPath}
              selectedPath={selectedPath}
              onSelect={onSelect}
              onCreateFolder={onCreateFolder}
              onCreateFile={onCreateFile}
              onContextMenu={openContextMenu}
              disabled={busy}
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

        {contextMenu && (
          <FileContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            target={contextMenu.target}
            onCreateFolder={() => {
              const parentPath = contextMenu.target.kind === "folder" ? contextMenu.target.path : "";
              closeContextMenu();
              onCreateFolder(parentPath);
            }}
            onCreateFile={() => {
              const parentPath = contextMenu.target.kind === "folder" ? contextMenu.target.path : "";
              closeContextMenu();
              onCreateFile(parentPath);
            }}
            onDelete={() => {
              const targetPath = contextMenu.target.path;
              closeContextMenu();
              onDeleteRootItem(targetPath);
            }}
          />
        )}

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
