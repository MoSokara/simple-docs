"use client";
import DOMPurify from "dompurify";
import { marked } from "marked";
import {
  FileCode2,
  FileText,
  FileType2,
  FileImage,
  ExternalLink,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { DocFile } from "@/types/docs";

export function FileViewer({ file }: { file: DocFile | null }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!file || file.type === "pdf" || file.type === "image") {
      setContent("");
      return;
    }
    let active = true;
    setLoading(true);
    const url =
      "/docs/" + file.path.split("/").map(encodeURIComponent).join("/");
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.text();
      })
      .then((t) => {
        if (active) setContent(t);
      })
      .catch(() => {
        if (active) setContent("Unable to load this document.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [file]);
  if (!file)
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-[var(--color-muted)]">
        <div>
          <FileText size={42} className="mx-auto mb-4 opacity-50" />
          <p className="font-medium">Select a document</p>
          <p className="mt-1 text-sm">
            Choose a file from Explorer or search above.
          </p>
        </div>
      </div>
    );
  const Icon =
    file.type === "markdown"
      ? FileCode2
      : file.type === "pdf"
        ? FileType2
        : file.type === "image"
          ? FileImage
          : FileText;
  const url = "/docs/" + file.path.split("/").map(encodeURIComponent).join("/");
  return (
    <section className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2 text-sm text-[var(--color-soft)]">
          <Icon size={16} />
          <span className="truncate">{file.path}</span>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          title="Open original file"
          className="rounded p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-surface-soft)]"
        >
          <ExternalLink size={16} />
        </a>
      </div>
      <div className="docs-scroll min-h-0 flex-1 overflow-auto">
        {file.type === "pdf" && (
          <iframe
            title={file.name}
            src={url}
            className="h-full min-h-[600px] w-full border-0"
          />
        )}
        {file.type === "image" && (
          <div className="flex min-h-full items-center justify-center p-6">
            <img
              src={url}
              alt={file.name}
              className="max-h-full max-w-full rounded-md border border-[var(--color-border)] object-contain shadow-sm"
            />
          </div>
        )}
        {file.type === "text" && (
          <div className="mx-auto max-w-4xl p-5 md:p-8">
            {loading ? (
              <p>Loading...</p>
            ) : (
              <pre className="plain-text">{content}</pre>
            )}
          </div>
        )}
        {file.type === "markdown" && (
          <div className="mx-auto max-w-4xl p-5 md:p-8">
            {loading ? (
              <p>Loading...</p>
            ) : (
              <article
                className="markdown"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(marked.parse(content) as string),
                }}
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
}
