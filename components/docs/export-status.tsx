"use client";

import { Check, FolderOpen, X } from "lucide-react";

type Props = {
  status: "idle" | "preparing" | "compressing" | "complete" | "error";
  progress: number;
  message: string;
  path: string | null;
  onShow: () => void;
  onDismiss: () => void;
};

export function ExportStatus({ status, progress, message, path, onShow, onDismiss }: Props) {
  if (status === "idle") return null;

  if (status === "preparing" || status === "compressing") {
    return (
      <div className="shrink-0 border-b border-border bg-bg-alt px-4 py-2.5">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-soft">
            {status === "preparing" ? "Preparing backup…" : "Compressing folder…"}
          </span>
          <span className="text-muted">{progress}%</span>
        </div>
        <div
          className="mt-1.5 h-1 overflow-hidden bg-hover"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div
            className="h-full bg-brand transition-[width] duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  if (status === "complete" && path) {
    return (
      <div className="flex shrink-0 items-center gap-3 border-b border-border bg-bg-alt px-4 py-2.5 text-xs">
        <Check size={14} className="text-brand" />
        <span className="min-w-0 truncate text-soft">{message}</span>
        <button
          onClick={onShow}
          className="inline-flex shrink-0 items-center gap-1.5 text-brand hover:underline"
        >
          <FolderOpen size={14} />
          Open
        </button>
        <button
          onClick={onDismiss}
          className="ml-auto shrink-0 text-muted hover:text-text"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-border bg-bg-alt px-4 py-2.5 text-xs">
      <span className="min-w-0 truncate text-muted">{message || "Export failed."}</span>
      <button
        onClick={onDismiss}
        className="ml-auto shrink-0 text-muted hover:text-text"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
