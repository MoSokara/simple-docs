"use client";

import DOMPurify from "dompurify";
import { marked } from "marked";
import { FileCode2, FileImage, FileText, FileType2, ExternalLink, Pencil, Download } from "lucide-react";
import { useEffect, useState } from "react";
import type { DocFile } from "@/types/docs";
import { db, readFileBlob } from "@/lib/local-db";
import { exportFile } from "@/lib/backup";

export function FileViewer({ file, onEdit }: { file: DocFile | null; onEdit: (file: DocFile) => void }) {
  const [content, setContent] = useState("");
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    async function load() {
      if (!file) return;
      setLoading(true);
      const blob = await readFileBlob(file.id);
      if (!blob || !active) return;
      if (file.type === "markdown" || file.type === "text") {
        setContent(await blob.text());
      } else {
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      }
      setLoading(false);
    }
    setContent("");
    setUrl(null);
    load().catch(() => setLoading(false));
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  if (!file) return (
    <div className="flex h-full items-center justify-center p-8 text-center text-[var(--color-muted)]">
      <div><FileText size={42} className="mx-auto mb-4 opacity-50" /><p className="font-medium">Select a document</p><p className="mt-1 text-sm">Choose a file from Library or search above.</p></div>
    </div>
  );

  const Icon = file.type === "markdown" ? FileCode2 : file.type === "pdf" ? FileType2 : file.type === "image" ? FileImage : FileText;

  return (
    <section className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2.5 md:px-4">
        <div className="flex min-w-0 items-center gap-2 text-sm text-[var(--color-soft)]">
          <Icon size={16} /><span className="truncate">{file.path}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onEdit(file)} className="rounded-md px-2.5 py-1.5 text-sm hover:bg-[var(--color-surface-soft)]"><Pencil size={15} className="mr-1.5 inline" />Edit</button>
          <button onClick={() => exportFile(file.id)} className="rounded-md p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-surface-soft)]" title="Download"><Download size={16} /></button>
          {url && <a href={url} target="_blank" rel="noreferrer" className="rounded-md p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-surface-soft)]" title="Open original"><ExternalLink size={16} /></a>}
        </div>
      </div>
      <div className="docs-scroll min-h-0 flex-1 overflow-auto">
        {loading && <div className="p-6 text-sm text-[var(--color-muted)]">Loading…</div>}
        {!loading && (file.type === "markdown" || file.type === "text") && (
          <div className="mx-auto max-w-4xl p-5 md:p-8">
            {file.type === "text" ? <pre className="plain-text">{content}</pre> : <article className="markdown" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(content) as string) }} />}
          </div>
        )}
        {!loading && file.type === "pdf" && url && <iframe title={file.name} src={url} className="h-full min-h-[600px] w-full border-0" />}
        {!loading && file.type === "image" && url && <div className="flex min-h-full items-center justify-center p-6"><img src={url} alt={file.name} className="max-h-full max-w-full rounded-md border border-[var(--color-border)] object-contain shadow-sm" /></div>}
      </div>
    </section>
  );
}