"use client";

import { Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { DocFile } from "@/types/docs";
import { readFileBlob, saveFileContent } from "@/lib/local-db";
import DOMPurify from "dompurify";
import { marked } from "marked";

export function Editor({ file, onClose }: { file: DocFile; onClose: () => void }) {
  const [value, setValue] = useState("");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    readFileBlob(file.id).then(async (blob) => setValue(blob ? await blob.text() : ""));
    setMode("edit");
  }, [file.id]);

  async function save() {
    setSaving(true);
    try { await saveFileContent(file.id, value); onClose(); }
    finally { setSaving(false); }
  }

  return (
    <section className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2">
        <div className="min-w-0 truncate text-sm font-medium">{file.path}</div>
        <div className="flex items-center gap-1">
          {file.type === "markdown" && <>
            <button onClick={() => setMode("edit")} className={`rounded px-2.5 py-1.5 text-xs ${mode === "edit" ? "bg-[var(--color-brand-soft)] text-[var(--color-brand-strong)]" : "hover:bg-[var(--color-surface-soft)]"}`}>Edit</button>
            <button onClick={() => setMode("preview")} className={`rounded px-2.5 py-1.5 text-xs ${mode === "preview" ? "bg-[var(--color-brand-soft)] text-[var(--color-brand-strong)]" : "hover:bg-[var(--color-surface-soft)]"}`}>Preview</button>
          </>}
          <button onClick={save} disabled={saving} className="rounded-md bg-[var(--color-brand)] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"><Save size={14} className="mr-1 inline" />{saving ? "Saving…" : "Save"}</button>
          <button onClick={onClose} className="rounded p-1.5 hover:bg-[var(--color-surface-soft)]"><X size={17} /></button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {mode === "edit" ? (
          <textarea autoFocus value={value} onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); void save(); } }}
            className="h-full min-h-[70vh] w-full resize-none border-0 bg-transparent p-5 font-mono text-sm leading-7 outline-none md:p-8" spellCheck={false} />
        ) : (
          <article className="markdown mx-auto max-w-4xl p-5 md:p-8" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(value) as string) }} />
        )}
      </div>
    </section>
  );
}