"use client";

import { FolderOpen } from "lucide-react";
import type { DocFile, DocFolder } from "@/types/docs";
import { FileTree } from "./file-tree";

type Props = {
  tree: DocFolder | null;
  rootPath: string | null;
  selectedPath: string | null;
  mobileOpen: boolean;
  busy: boolean;
  onSelect: (file: DocFile) => void;
  onOpenFolder: () => void;
};

function folderName(rootPath: string | null) {
  if (!rootPath) return "No folder";
  return rootPath.split(/[\\/]/).filter(Boolean).pop() ?? rootPath;
}

export function DocsSidebar({
  tree,
  rootPath,
  selectedPath,
  mobileOpen,
  busy,
  onSelect,
  onOpenFolder,
}: Props) {
  return (
    <aside
      className={
        "absolute inset-y-14 left-0 z-30 w-72 border-r border-border bg-bg-alt transition-transform md:static md:translate-x-0 " +
        (mobileOpen ? "translate-x-0" : "-translate-x-full")
      }
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="border-b border-border px-3 py-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
            <FolderOpen size={14} />
            <span className="truncate">{folderName(rootPath)}</span>
          </div>
        </div>

        <div className="docs-scroll min-h-0 flex-1 overflow-auto py-2">
          {tree ? (
            <FileTree folder={tree} selectedPath={selectedPath} onSelect={onSelect} />
          ) : (
            <div className="p-5 text-sm text-muted">Open a folder to start.</div>
          )}
        </div>

        <div className="border-t border-border p-2">
          <button
            onClick={onOpenFolder}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 border border-border px-3 py-2 text-sm text-soft hover:bg-hover disabled:opacity-50"
          >
            <FolderOpen size={16} />
            {busy ? "Opening…" : "Open another folder"}
          </button>
        </div>
      </div>
    </aside>
  );
}
