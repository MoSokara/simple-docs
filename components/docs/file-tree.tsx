"use client";

import { ChevronDown, ChevronRight, FileCode2, FileImage, FileText, FileType2, Folder, FolderOpen } from "lucide-react";
import { useState } from "react";
import type { DocFile, DocFolder } from "@/types/docs";

const icons = {
  markdown: FileCode2,
  text: FileText,
  pdf: FileType2,
  image: FileImage,
  other: FileText,
};

export function FileTree({
  folder,
  selectedPath,
  onSelect,
  depth = 0,
}: {
  folder: DocFolder;
  selectedPath: string | null;
  onSelect: (file: DocFile) => void;
  depth?: number;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      {folder.path && (
        <button
          onClick={() => setOpen((value) => !value)}
          className="flex w-full items-center gap-1 rounded px-1 py-1 text-left text-sm text-[var(--color-soft)] hover:bg-[var(--color-surface-soft)]"
          style={{ paddingLeft: depth * 12 + 4 }}
        >
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          {open ? <FolderOpen size={16} /> : <Folder size={16} />}
          <span className="truncate">{folder.name}</span>
        </button>
      )}

      {open && (
        <div>
          {folder.folders.map((child) => (
            <FileTree key={child.path} folder={child} selectedPath={selectedPath} onSelect={onSelect} depth={depth + (folder.path ? 1 : 0)} />
          ))}
          {folder.files.map((file) => {
            const Icon = icons[file.type];
            const level = depth + (folder.path ? 1 : 0);
            return (
              <button
                key={file.path}
                title={file.path}
                onClick={() => onSelect(file)}
                className={
                  "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm " +
                  (selectedPath === file.path
                    ? "bg-[var(--color-brand-soft)] text-[var(--color-brand-strong)]"
                    : "text-[var(--color-soft)] hover:bg-[var(--color-surface-soft)]")
                }
                style={{ paddingLeft: level * 12 + 24 }}
              >
                <Icon size={15} />
                <span className="truncate">{file.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}