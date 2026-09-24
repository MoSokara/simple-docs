"use client";
import {
  ChevronDown,
  ChevronRight,
  FileCode2,
  FileText,
  FileType2,
  FileImage,
  Folder,
  FolderOpen,
} from "lucide-react";
import { useState } from "react";
import type { DocFile, DocFolder } from "@/types/docs";
const icons = {
  markdown: FileCode2,
  text: FileText,
  pdf: FileType2,
  image: FileImage,
};

export function FileTree({
  folder,
  selectedPath,
  onSelect,
  depth = 0,
}: {
  folder: DocFolder;
  selectedPath: string | null;
  onSelect: (f: DocFile) => void;
  depth?: number;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      {folder.path && (
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-1 rounded px-2 py-1 text-left text-sm text-[var(--color-soft)] hover:bg-[var(--color-surface-soft)]"
          style={{ paddingLeft: depth * 12 + 8 }}
        >
          {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}{" "}
          {open ? <FolderOpen size={16} /> : <Folder size={16} />}
          <span className="truncate">{folder.name}</span>
        </button>
      )}
      {open && (
        <div>
          {folder.folders.map((c) => (
            <FileTree
              key={c.path}
              folder={c}
              selectedPath={selectedPath}
              onSelect={onSelect}
              depth={depth + (folder.path ? 1 : 0)}
            />
          ))}
          {folder.files.map((f) => {
            const Icon = icons[f.type];
            const selected = selectedPath === f.path;
            return (
              <button
                key={f.path}
                title={f.path}
                onClick={() => onSelect(f)}
                className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm ${selected ? "bg-[var(--color-brand-soft)] text-[var(--color-brand-strong)]" : "text-[var(--color-soft)] hover:bg-[var(--color-surface-soft)]"}`}
                style={{
                  paddingLeft: (depth + (folder.path ? 1 : 0)) * 12 + 24,
                }}
              >
                <Icon size={15} />
                <span className="truncate">{f.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
