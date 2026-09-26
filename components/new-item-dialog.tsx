"use client";

import { FilePlus2, FolderPlus, X } from "lucide-react";
import { useEffect, useRef } from "react";

type Props = {
  type: "folder" | "file" | null;
  parentPath: string;
  name: string;
  error: string;
  busy: boolean;
  onNameChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
};

export function NewItemDialog({
  type,
  parentPath,
  name,
  error,
  busy,
  onNameChange,
  onSubmit,
  onClose,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!type) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [type]);

  if (!type) return null;

  const isFolder = type === "folder";
  const title = isFolder ? "New Folder" : "New File";
  const description = parentPath
    ? "Create inside " + parentPath
    : "Create in the opened root folder";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-item-title"
        className="w-full max-w-md border border-border bg-bg shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            {isFolder ? <FolderPlus size={17} className="text-soft" /> : <FilePlus2 size={17} className="text-soft" />}
            <div className="min-w-0">
              <h2 id="new-item-title" className="text-sm font-semibold text-text">
                {title}
              </h2>
              <p className="truncate text-xs text-muted" title={description}>
                {description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded p-1 text-muted hover:bg-hover hover:text-text disabled:opacity-40"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
          className="space-y-4 p-4"
        >
          <div>
            <label htmlFor="new-item-name" className="mb-1.5 block text-xs font-medium text-soft">
              {isFolder ? "Folder name" : "File name"}
            </label>
            <input
              ref={inputRef}
              id="new-item-name"
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              disabled={busy}
              className="h-10 w-full border border-border bg-bg-soft px-3 text-sm text-text outline-none placeholder:text-placeholder focus:border-brand disabled:opacity-60"
              placeholder={isFolder ? "New Folder" : "notes.md"}
              aria-invalid={!!error}
              autoComplete="off"
            />
            {error && <p className="mt-1.5 text-xs text-file-other">{error}</p>}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="px-3 py-2 text-sm text-soft hover:bg-hover hover:text-text disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || !name.trim()}
              className="inline-flex items-center gap-2 bg-brand px-3 py-2 text-sm font-medium text-black hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isFolder ? <FolderPlus size={15} /> : <FilePlus2 size={15} />}
              {busy ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
