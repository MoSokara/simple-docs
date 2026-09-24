"use client";

import { ExternalLink, FileCode2, FileImage, FileText, FileType2, FolderOpen, Pencil } from "lucide-react";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { useEffect, useMemo, useState } from "react";
import { desktop } from "@/lib/desktop-api";
import type { DocFile } from "@/types/docs";

function decodeBase64(base64: string) {
  return new TextDecoder().decode(Uint8Array.from(atob(base64), (char) => char.charCodeAt(0)));
}

export function FileViewer({ file, onEdit }: { file: DocFile | null; onEdit: (file: DocFile) => void }) {
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
    desktop.readFile(file.path).then((data) => {
      if (!active) return;

      if (file.type === "markdown" || file.type === "text" || file.type === "code") {
        setPayload({ text: decodeBase64(data.base64) });
      } else {
        const binary = Uint8Array.from(atob(data.base64), (char) => char.charCodeAt(0));
        objectUrl = URL.createObjectURL(new Blob([binary], { type: data.mimeType }));
        setPayload({ url: objectUrl });
      }
    }).catch((reason) => {
      if (active) setError(reason instanceof Error ? reason.message : "Could not read this file.");
    }).finally(() => active && setLoading(false));

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
      <div className="flex h-full items-center justify-center p-8 text-center text-[var(--color-muted)]">
        <div>
          <FolderOpen size={42} className="mx-auto mb-4 opacity-50" />
          <p className="font-medium">Open a local folder</p>
          <p className="mt-1 text-sm">Simple Docs reads the real files directly from your computer.</p>
        </div>
      </div>
    );
  }

  const Icon = file.type === "markdown" ? FileCode2 : file.type === "pdf" ? FileType2 : file.type === "image" ? FileImage : FileText;
  const editable = file.type === "markdown" || file.type === "text" || file.type === "code";

  return (
    <section className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2.5 md:px-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm text-[var(--color-soft)]">
            <Icon size={16} />
            <span className="truncate">{file.path}</span>
          </div>
          <div className="mt-0.5 text-[11px] text-[var(--color-muted)]">
            Changes on disk are reflected automatically.
          </div>
        </div>

        <div className="flex items-center gap-1">
          {editable && (
            <button onClick={() => onEdit(file)} className="rounded-md px-2.5 py-1.5 text-sm hover:bg-[var(--color-surface-soft)]">
              <Pencil size={15} className="mr-1.5 inline" /> Edit in VS Code
            </button>
          )}

          {file.type === "other" && (
            <button onClick={() => void desktop.openDefault(file.path)} className="rounded-md px-2.5 py-1.5 text-sm hover:bg-[var(--color-surface-soft)]">
              Open with default app
            </button>
          )}

          <button onClick={() => void desktop.revealInExplorer(file.path)} className="rounded p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-surface-soft)]" title="Show in file explorer">
            <ExternalLink size={16} />
          </button>
        </div>
      </header>

      <div className="docs-scroll min-h-0 flex-1 overflow-auto">
        {loading && <div className="p-6 text-sm text-[var(--color-muted)]">Reading file…</div>}

        {!loading && error && (
          <div className="flex h-full items-center justify-center p-8 text-center text-[var(--color-muted)]">
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
