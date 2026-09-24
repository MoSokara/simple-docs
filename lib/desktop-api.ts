"use client";

import type { DocFolder, FilePayload, SearchResult } from "@/types/docs";

export const desktop = {
  getState: () => window.simpleDocs.getState(),
  openFolder: () => window.simpleDocs.openFolder(),
  scan: () => window.simpleDocs.scan(),
  readFile: (path: string): Promise<FilePayload> => window.simpleDocs.readFile(path),
  search: (query: string): Promise<SearchResult[]> => window.simpleDocs.search(query),
  openInEditor: (path: string) => window.simpleDocs.openInEditor(path),
  revealInExplorer: (path: string) => window.simpleDocs.revealInExplorer(path),
  openDefault: (path: string) => window.simpleDocs.openDefault(path),
  exportZip: () => window.simpleDocs.exportZip(),
  setSelectedFile: (path: string | null) => window.simpleDocs.setSelectedFile(path),
  onFolderChanged: (callback: () => void) => window.simpleDocs.onFolderChanged(callback),
  isAvailable: () => typeof window !== "undefined" && !!window.simpleDocs,
} as const;

export type { DocFolder };