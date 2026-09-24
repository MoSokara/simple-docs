import type { DocFolder, FilePayload, SearchResult } from "./docs";

declare global {
  interface Window {
    simpleDocs?: {
      getState(): Promise<{ rootPath: string | null; selectedPath: string | null }>;
      openFolder(): Promise<{ rootPath: string | null; tree: DocFolder | null }>;
      scan(): Promise<DocFolder | null>;
      readFile(relativePath: string): Promise<FilePayload>;
      search(query: string): Promise<SearchResult[]>;
      openInEditor(relativePath: string): Promise<{ ok: boolean; message?: string; fallback?: boolean }>;
      revealInExplorer(relativePath: string): Promise<void>;
      openDefault(relativePath: string): Promise<string>;
      exportZip(): Promise<{ ok: boolean; path?: string; canceled?: boolean; message?: string }>;
      setSelectedFile(relativePath: string | null): Promise<void>;
      onFolderChanged(callback: () => void): () => void;
      onExportProgress(callback: (payload: {
        status: "preparing" | "compressing" | "complete" | "error";
        percent: number;
        processedBytes?: number;
        totalBytes?: number;
        processedFiles?: number;
        totalFiles?: number;
        path?: string;
        message?: string;
      }) => void): () => void;
    };
  }
}

export {};
