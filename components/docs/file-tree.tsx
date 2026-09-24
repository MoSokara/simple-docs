"use client";

import { ChevronDown, ChevronRight, FileCode2, FileImage, FileText, FileType2, Folder, FolderOpen } from "lucide-react";
import { useState } from "react";
import type { DocFile, DocFolder } from "@/types/docs";

const icons = {
  markdown: FileCode2,
  text: FileText,
  code: FileCode2,
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
  const [open, setOpen] = useState(false);
  const isRoot = !folder.path;
  const visible = isRoot || open;

  return (
    <div>
      {!isRoot && (
        <button
          onClick={() => setOpen((value) => !value)}
          className="flex w-full items-center gap-1 px-1 py-1 text-left text-sm text-[var(--color-soft)] hover:bg-[var(--color-surface-soft)]"
          style={{ paddingLeft: depth * 12 + 4 }}
          aria-expanded={open}
        >
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          {open ? <FolderOpen size={16} /> : <Folder size={16} />}
          <span className="truncate">{folder.name}</span>
        </button>
      )}

      {visible && (
        <div>
          {folder.folders.map((child) => (
            <FileTree
              key={child.path}
              folder={child}
              selectedPath={selectedPath}
              onSelect={onSelect}
              depth={depth + (isRoot ? 0 : 1)}
            />
          ))}
          {folder.files.map((file) => {
            const Icon = icons[file.type];
            const level = depth + (isRoot ? 0 : 1);

            return (
              <button
                key={file.path}
                title={file.path}
                onClick={() => onSelect(file)}
                className={
                  "flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm " +
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
