"use client";

import {
  ChevronDown,
  ChevronRight,
  Database,
  FileCode2,
  FileImage,
  FilePlus2,
  FileSpreadsheet,
  FileText,
  FileType2,
  Folder,
  FolderOpen,
  FolderPlus,
  Presentation,
} from "lucide-react";
import type { MouseEvent } from "react";
import { useState } from "react";
import type { FileContextTarget } from "./file-context-menu";
import type { DocFile, DocFolder } from "@/types/docs";
import { FILE_TYPE_META, fileColorStyle } from "@/types/file-type";

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
  rootPath,
  selectedPath,
  onSelect,
  onCreateFolder,
  onCreateFile,
  onContextMenu,
  disabled,
  depth = 0,
}: {
  folder: DocFolder;
  rootPath: string | null;
  selectedPath: string | null;
  onSelect: (file: DocFile) => void;
  onCreateFolder: (parentPath: string) => void;
  onCreateFile: (parentPath: string) => void;
  onContextMenu: (event: MouseEvent, target: FileContextTarget) => void;
  disabled: boolean;
  depth?: number;
}) {
  const [open, setOpen] = useState(false);
  const isRoot = depth === 0;
  const visible = isRoot || open;

  function absolutePath(relativePath: string) {
    if (!rootPath) return relativePath;

    const base = rootPath.replace(/[\\/]+$/, "");
    return relativePath
      ? base + "\\" + relativePath.replaceAll("/", "\\")
      : base;
  }

  return (
    <div>
      {!isRoot && (
        <div
          className="group flex min-w-0 w-full items-center gap-2 px-2 py-1.5 text-sm text-soft hover:bg-hover"
          style={{ paddingLeft: depth * 12 + 8 }}
          onContextMenu={depth === 1 ? (event) => onContextMenu(event, {
            kind: "folder",
            name: folder.name,
            path: folder.path,
          }) : undefined}
        >
          <button
            onClick={() => setOpen((value) => !value)}
            className="flex min-w-0 flex-1 items-center gap-1 text-left"
            aria-expanded={open}
            title={absolutePath(folder.path)}
          >
            {open ? <ChevronDown size={14} className="shrink-0" /> : <ChevronRight size={14} className="shrink-0" />}
            {open ? <FolderOpen size={16} className="shrink-0" /> : <Folder size={16} className="shrink-0" />}
            <span className="min-w-0 truncate">{folder.name}</span>
          </button>

          <div className="flex shrink-0 items-center gap-0.5">
            <div className="group/action relative">
              <button
                type="button"
                onClick={() => onCreateFolder(folder.path)}
                disabled={disabled}
                title={"New Folder in " + absolutePath(folder.path)}
                className="rounded p-1 text-placeholder hover:bg-bg-soft hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={"New Folder in " + folder.name}
              >
                <FolderPlus size={14} />
              </button>
              <span className="pointer-events-none absolute right-0 top-full z-50 mt-1 whitespace-nowrap border border-border bg-bg px-2 py-1 text-[11px] text-soft opacity-0 shadow-lg transition-opacity group-hover/action:opacity-100">
                New Folder
              </span>
            </div>

            <div className="group/action relative">
              <button
                type="button"
                onClick={() => onCreateFile(folder.path)}
                disabled={disabled}
                title={"New File in " + absolutePath(folder.path)}
                className="rounded p-1 text-placeholder hover:bg-bg-soft hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={"New File in " + folder.name}
              >
                <FilePlus2 size={14} />
              </button>
              <span className="pointer-events-none absolute right-0 top-full z-50 mt-1 whitespace-nowrap border border-border bg-bg px-2 py-1 text-[11px] text-soft opacity-0 shadow-lg transition-opacity group-hover/action:opacity-100">
                New File
              </span>
            </div>
          </div>
        </div>
      )}

      {visible && (
        <div>
          {folder.folders.map((child) => (
            <FileTree
              key={child.path}
              folder={child}
              rootPath={rootPath}
              selectedPath={selectedPath}
              onSelect={onSelect}
              onCreateFolder={onCreateFolder}
              onCreateFile={onCreateFile}
              onContextMenu={onContextMenu}
              disabled={disabled}
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
                onContextMenu={depth === 0 ? (event) => onContextMenu(event, {
                  kind: "file",
                  name: file.name,
                  path: file.path,
                }) : undefined}
              >
                <Icon size={15} className="shrink-0" style={fileColorStyle(file.name)} />
                <span className="min-w-0 truncate" style={fileColorStyle(file.name)}>
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
