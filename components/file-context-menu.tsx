"use client";

import { FilePlus2, FolderOpen, FolderPlus, Trash2 } from "lucide-react";
import { createPortal } from "react-dom";

export type FileContextTarget = {
  kind: "folder" | "file";
  name: string;
  path: string;
  parentPath: string;
};

export function FileContextMenu({
  x,
  y,
  target,
  onCreateFolder,
  onCreateFile,
  onOpenInExplorer,
  onDelete,
}: {
  x: number;
  y: number;
  target: FileContextTarget;
  onCreateFolder: () => void;
  onCreateFile: () => void;
  onOpenInExplorer: () => void;
  onDelete: () => void;
}) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed z-[120] min-w-[208px] border border-border bg-bg shadow-xl"
      style={{ left: x, top: y }}
      onClick={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.preventDefault()}
      role="menu"
      aria-label={"Actions for " + target.name}
    >
      <div className="px-3 py-2">
        <p className="truncate text-xs font-medium text-text" title={target.path}>
          {target.name}
        </p>
        <p className="truncate text-[11px] text-muted">
          {target.kind === "folder" ? "Folder" : "File"}
        </p>
      </div>

      <div className="border-t border-border py-1">
        <button
          type="button"
          role="menuitem"
          onClick={onCreateFolder}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-soft hover:bg-hover hover:text-text"
        >
          <FolderPlus size={15} />
          New Folder
        </button>
        <button
          type="button"
          role="menuitem"
          onClick={onCreateFile}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-soft hover:bg-hover hover:text-text"
        >
          <FilePlus2 size={15} />
          New File
        </button>
      </div>

      <div className="border-t border-border py-1">
        <button
          type="button"
          role="menuitem"
          onClick={onOpenInExplorer}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-soft hover:bg-hover hover:text-text"
        >
          <FolderOpen size={15} />
          Open in Explorer
        </button>
      </div>

      <div className="border-t border-border py-1">
        <button
          type="button"
          role="menuitem"
          onClick={onDelete}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-error hover:bg-hover"
        >
          <Trash2 size={15} />
          Delete {target.kind === "folder" ? "Folder" : "File"}
        </button>
      </div>
    </div>,
    document.body,
  );
}
