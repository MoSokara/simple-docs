"use client";

import {
  Database,
  ExternalLink,
  FileCode2,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileType2,
  FolderOpen,
  Pencil,
  Presentation,
} from "lucide-react";
import { useEffect, useState } from "react";
import { desktop } from "@/lib/desktop-api";
import type { DocFile } from "@/types/docs";
import { CodeViewer } from "./code-viewer";
import { FILE_TYPE_META } from "./file-type";
import { MarkdownViewer } from "./markdown-viewer";

function decodeBase64(base64: string) {
  return new TextDecoder().decode(
    Uint8Array.from(atob(base64), (char) => char.charCodeAt(0)),
  );
}

function iconFor(type: DocFile["type"]) {
  if (type === "markdown" || type === "code") return FileCode2;
  if (type === "pdf") return FileType2;
  if (type === "image") return FileImage;
  if (type === "powerpoint") return Presentation;
  if (type === "excel") return FileSpreadsheet;
  if (type === "access") return Database;
  return FileText;
}

function sizeLabel(size: number) {
  if (size < 1024) return size + " B";
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + " KB";
  return (size / (1024 * 1024)).toFixed(1) + " MB";
}

function needsExternalOpen(type: DocFile["type"]) {
  return ["word", "powerpoint", "excel", "access", "other"].includes(type);
}

export function FileViewer({
  file,
  anchor,
  onEdit,
  onNavigate,
}: {
  file: DocFile | null;
  anchor: string | null;
  onEdit: (file: DocFile) => Promise<void> | void;
  onNavigate: (path: string, anchor: string | null) => void;
}) {
  const [payload, setPayload] = useState<{ text?: string; url?: string } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    setPayload(null);
    setError("");
    setActionMessage("");

    if (!file || needsExternalOpen(file.type)) {
      setLoading(false);
      return;
    }

    setLoading(true);

    desktop.readFile(file.path)
      .then((data) => {
        if (!active) return;

        if (file.type === "markdown" || file.type === "text" || file.type === "code") {
          setPayload({ text: decodeBase64(data.base64) });
          return;
        }

        const binary = Uint8Array.from(
          atob(data.base64),
          (char) => char.charCodeAt(0),
        );

        objectUrl = URL.createObjectURL(
          new Blob([binary], { type: data.mimeType }),
        );
        setPayload({ url: objectUrl });
      })
      .catch((reason) => {
        if (active) {
          setError(
            reason instanceof Error ? reason.message : "Could not read this file.",
          );
        }
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  async function revealInExplorer() {
    if (!file) return;

    try {
      const result = await desktop.revealInExplorer(file.path);
      setActionMessage(result.ok ? "" : (result.message ?? "Could not open the containing folder."));
    } catch (reason) {
      setActionMessage(
        reason instanceof Error ? reason.message : "Could not open the containing folder.",
      );
    }
  }

  async function openDefault() {
    if (!file) return;

    try {
      const result = await desktop.openDefault(file.path);
      setActionMessage(result.ok ? "" : (result.message ?? "Could not open this file."));
    } catch (reason) {
      setActionMessage(
        reason instanceof Error ? reason.message : "Could not open this file.",
      );
    }
  }

  if (!file) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-muted">
        <div>
          <FolderOpen size={42} className="mx-auto mb-4 opacity-50" />
          <p className="font-medium text-text">Open a local folder</p>
          <p className="mt-1 text-sm">
            Simple Docs reads the real files directly from your computer.
          </p>
        </div>
      </div>
    );
  }

  const Icon = iconFor(file.type);
  const meta = FILE_TYPE_META[file.type];
  const editable = file.type === "markdown" || file.type === "text" || file.type === "code";
  const externalOpen = needsExternalOpen(file.type);

  return (
    <section className="flex h-full min-h-0 flex-col">
      <header className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-border bg-bg px-3 md:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Icon size={16} className={"shrink-0 " + meta.iconClass} />
          <span
            className={"min-w-0 truncate text-sm font-medium " + meta.colorClass}
            title={file.path}
          >
            {file.path}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {editable && (
            <button
              onClick={() => void onEdit(file)}
              className="inline-flex h-8 items-center gap-2 px-2.5 text-sm font-medium text-soft hover:bg-hover hover:text-text"
              title="Edit in VS Code"
            >
              <Pencil size={15} />
              Edit
            </button>
          )}

          {externalOpen && (
            <button
              onClick={() => void openDefault()}
              className="inline-flex h-8 items-center gap-2 px-2.5 text-sm font-medium text-soft hover:bg-hover hover:text-text"
              title={"Open with " + meta.label}
            >
              <ExternalLink size={15} />
              Open file
            </button>
          )}

          <button
            onClick={() => void revealInExplorer()}
            className="inline-flex h-8 items-center gap-2 px-2.5 text-sm font-medium text-soft hover:bg-hover hover:text-text"
            title="Open containing folder"
          >
            <FolderOpen size={15} />
            Open
          </button>
        </div>
      </header>

      {actionMessage && (
        <div className="shrink-0 border-b border-border bg-bg-alt px-4 py-2 text-xs text-file-pdf">
          {actionMessage}
        </div>
      )}

      <div className="docs-scroll min-h-0 flex-1 overflow-auto">
        {externalOpen ? (
          <div className="flex min-h-full items-center justify-center p-8 text-center">
            <div className="max-w-md">
              <Icon size={46} className={"mx-auto mb-4 " + meta.iconClass} />
              <p className={"font-semibold " + meta.colorClass}>
                {meta.label} file
              </p>
              <p className="mt-2 text-sm text-muted">
                This file type is recognized by Simple Docs and will open with
                its installed desktop application.
              </p>
              <div className="mt-5 flex justify-center gap-2">
                <button
                  onClick={() => void openDefault()}
                  className="inline-flex items-center gap-2 bg-brand px-3 py-2 text-sm font-medium text-black hover:bg-brand-strong"
                >
                  <ExternalLink size={15} />
                  Open file
                </button>
                <button
                  onClick={() => void revealInExplorer()}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm text-soft hover:bg-hover hover:text-text"
                >
                  <FolderOpen size={15} />
                  Open
                </button>
              </div>
              <p className="mt-3 text-xs text-placeholder">{sizeLabel(file.size)}</p>
            </div>
          </div>
        ) : (
          <>
            {loading && <div className="p-6 text-sm text-muted">Reading file…</div>}

            {!loading && error && (
              <div className="flex h-full items-center justify-center p-8 text-center text-muted">
                <div>
                  <FileText size={34} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}

            {!loading && !error && payload?.text !== undefined && (
              <div className="mx-auto max-w-6xl p-5 md:p-8">
                {file.type === "markdown" ? (
                  <MarkdownViewer
                    markdown={payload.text}
                    currentPath={file.path}
                    anchor={anchor}
                    onNavigate={onNavigate}
                    onExternal={async (url) => {
                      const result = await desktop.openExternalUrl(url);
                      if (!result.ok) {
                        setActionMessage(
                          result.message ?? "Could not open the external link.",
                        );
                      }
                    }}
                  />
                ) : file.type === "code" ? (
                  <CodeViewer code={payload.text} fileName={file.name} />
                ) : (
                  <pre className="plain-text min-h-full">{payload.text}</pre>
                )}
              </div>
            )}

            {!loading && !error && file.type === "pdf" && payload?.url && (
              <iframe
                title={file.name}
                src={payload.url}
                className="h-full min-h-[600px] w-full border-0"
              />
            )}

            {!loading && !error && file.type === "image" && payload?.url && (
              <div className="flex min-h-full items-center justify-center p-6">
                <img
                  src={payload.url}
                  alt={file.name}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
