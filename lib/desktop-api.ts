"use client";

import type { FilePayload, SearchResult } from "@/types/docs";

export function isDesktopAvailable() {
  return typeof window !== "undefined" && !!window.simpleDocs;
}

function api() {
  if (!isDesktopAvailable()) throw new Error("Simple Docs desktop bridge is not available.");
  return window.simpleDocs!;
}

export const desktop = {
  getState: () => api().getState(),
  openFolder: () => api().openFolder(),
  scan: () => api().scan(),
  readFile: (path: string): Promise<FilePayload> => api().readFile(path),
  search: (query: string): Promise<SearchResult[]> => api().search(query),
  openInEditor: (path: string) => api().openInEditor(path),
  revealInExplorer: (path: string) => api().revealInExplorer(path),
  revealExport: (absolutePath: string) => api().revealExport(absolutePath),
  openDefault: (path: string) => api().openDefault(path),
  exportZip: () => api().exportZip(),
  setSelectedFile: (path: string | null) => api().setSelectedFile(path),
  onFolderChanged: (callback: () => void) => api().onFolderChanged(callback),
  onExportProgress: (callback: (payload: {
    status: "preparing" | "compressing" | "complete" | "error";
    percent: number;
    processedBytes?: number;
    totalBytes?: number;
    processedFiles?: number;
    totalFiles?: number;
    path?: string;
    message?: string;
  }) => void) => api().onExportProgress(callback),
} as const;
