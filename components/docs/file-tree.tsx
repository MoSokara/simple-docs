"use client";

import {
  ChevronDown,
  ChevronRight,
  Database,
  FileCode2,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileType2,
  Folder,
  FolderOpen,
  Presentation,
} from "lucide-react";
import { useState } from "react";
import type { DocFile, DocFolder } from "@/types/docs";
import { FILE_TYPE_META } from "./file-type";

const icons = {
  markdown: FileCode2,
  text: FileText,
  code: FileCode2,
  pdf: FileType2,
  image: FileImage,
  word: FileText,
  powerpoint: Presentation,
  excel: FileSpreadsheet,
  access: Database,
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
  const isRoot = depth === 0;
  const visible = isRoot || open;

  return (
    <div>
      {!isRoot && (
        <button
          onClick={() => setOpen((value) => !value)}
          className="flex min-w-0 w-full items-center gap-1 px-2 py-1.5 text-left text-sm text-soft hover:bg-hover"
          style={{ paddingLeft: depth * 12 + 8 }}
          aria-expanded={open}
          title={folder.path}
        >
          {open ? <ChevronDown size={14} className="shrink-0" /> : <ChevronRight size={14} className="shrink-0" />}
          {open ? <FolderOpen size={16} className="shrink-0" /> : <Folder size={16} className="shrink-0" />}
          <span className="min-w-0 truncate">{folder.name}</span>
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
              depth={depth + 1}
            />
          ))}

          {folder.files.map((file) => {
            const Icon = icons[file.type];
            const meta = FILE_TYPE_META[file.type];
            const level = depth + 1;

            return (
              <button
                key={file.path}
                title={file.path}
                onClick={() => onSelect(file)}
                className={
                  "group flex min-w-0 w-full items-center gap-2 px-2 py-1.5 text-left text-sm transition-colors " +
                  (selectedPath === file.path ? "bg-hover" : "hover:bg-hover")
                }
                style={{ paddingLeft: level * 12 + 12 }}
              >
                <Icon size={15} className={"shrink-0 " + meta.iconClass} />
                <span className={"min-w-0 truncate " + meta.colorClass}>
                  {file.name}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
