"use client";

import { ExternalLink, FileCode2, FileImage, FileText, FileType2, FolderOpen, Pencil } from "lucide-react";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { useEffect, useMemo, useState } from "react";
import { desktop } from "@/lib/desktop-api";
import type { DocFile } from "@/types/docs";
import { FILE_TYPE_META } from "./file-type";

function decodeBase64(base64: string) {
  return new TextDecoder().decode(Uint8Array.from(atob(base64), (char) => char.charCodeAt(0)));
}

function rootFolderName(rootPath: string | null) {
  if (!rootPath) return "Folder";
  return rootPath.split(/[\\/]/).filter(Boolean).pop() ?? "Folder";
}

export function FileViewer({
  file,
  rootPath,
  onEdit,
}: {
  file: DocFile | null;
  rootPath: string | null;
  onEdit: (file: DocFile) => void;
}) {
  const [payload, setPayload] = useState<{ text?: string; url?: string } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    setPayload(null);
    setError("");
    if (!file) return;

    setLoading(true);
    desktop.readFile(file.path)
      .then((data) => {
        if (!active) return;

        if (file.type === "markdown" || file.type === "text" || file.type === "code") {
          setPayload({ text: decodeBase64(data.base64) });
        } else {
          const binary = Uint8Array.from(atob(data.base64), (char) => char.charCodeAt(0));
          objectUrl = URL.createObjectURL(new Blob([binary], { type: data.mimeType }));
          setPayload({ url: objectUrl });
        }
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "Could not read this file.");
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  const markdownHtml = useMemo(
    () => (payload?.text ? DOMPurify.sanitize(marked.parse(payload.text) as string) : ""),
    [payload?.text],
  );

  if (!file) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-muted">
        <div>
          <FolderOpen size={42} className="mx-auto mb-4 opacity-50" />
          <p className="font-medium text-text">Open a local folder</p>
          <p className="mt-1 text-sm">Simple Docs reads the real files directly from your computer.</p>
        </div>
      </div>
    );
  }

  const Icon = file.type === "markdown" ? FileCode2 : file.type === "pdf" ? FileType2 : file.type === "image" ? FileImage : FileText;
  const meta = FILE_TYPE_META[file.type];
  const editable = file.type === "markdown" || file.type === "text" || file.type === "code";

  return (
    <section className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-bg px-3 py-2.5 md:px-4">
        <div className="min-w-0 flex items-center gap-2">
          <Icon size={17} className={meta.iconClass} />
          <span className={`truncate text-sm font-medium ${meta.colorClass}`}>
            {rootFolderName(rootPath)} / {file.name}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {editable && (
            <button
              onClick={() => onEdit(file)}
              className="rounded-md px-2.5 py-1.5 text-sm text-soft hover:bg-hover hover:text-text"
            >
              <Pencil size={15} className="mr-1.5 inline" /> Edit
            </button>
          )}

          {file.type === "other" && (
            <button
              onClick={() => void desktop.openDefault(file.path)}
              className="rounded-md px-2.5 py-1.5 text-sm text-soft hover:bg-hover hover:text-text"
            >
              Open
            </button>
          )}

          <button
            onClick={() => void desktop.revealInExplorer(file.path)}
            className="rounded p-1.5 text-muted hover:bg-hover hover:text-text"
            title="Show in file explorer"
            aria-label="Show in file explorer"
          >
            <ExternalLink size={16} />
          </button>
        </div>
      </header>

      <div className="docs-scroll min-h-0 flex-1 overflow-auto">
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
          <div className={`mx-auto max-w-5xl p-5 md:p-8 ${file.type === "text" || file.type === "code" ? "min-h-full" : ""}`}>
            {file.type === "markdown" ? (
              <article className="markdown" dangerouslySetInnerHTML={{ __html: markdownHtml }} />
            ) : (
              <pre className={file.type === "code" ? "code-viewer" : "plain-text"}>{payload.text}</pre>
            )}
          </div>
        )}

        {!loading && !error && file.type === "pdf" && payload?.url && (
          <iframe title={file.name} src={payload.url} className="h-full min-h-[600px] w-full border-0" />
        )}

        {!loading && !error && file.type === "image" && payload?.url && (
          <div className="flex min-h-full items-center justify-center p-6">
            <img src={payload.url} alt={file.name} className="max-h-full max-w-full object-contain" />
          </div>
        )}
      </div>
    </section>
  );
}
