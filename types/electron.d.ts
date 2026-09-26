import type { DocFolder, FilePayload, SearchResult } from "./docs";

declare global {
  interface Window {
    simpleDocs?: {
      getState(): Promise<{ rootPath: string | null; selectedPath: string | null }>;
      openFolder(): Promise<{ rootPath: string | null; tree: DocFolder | null }>;
      createFolder(relativeParent: string, name: string): Promise<{ ok: boolean; path?: string; message?: string }>;
      createFile(relativeParent: string, name: string): Promise<{ ok: boolean; path?: string; message?: string }>;
      deleteItem(relativePath: string): Promise<{ ok: boolean; canceled?: boolean; path?: string; message?: string }>;
      openRootInExplorer(): Promise<{ ok: boolean; message?: string }>;
      scan(): Promise<DocFolder | null>;
      readFile(relativePath: string): Promise<FilePayload>;
      search(query: string): Promise<SearchResult[]>;
      openInEditor(relativePath: string): Promise<{ ok: boolean; message?: string; method?: string }>;
      revealInExplorer(relativePath: string): Promise<{ ok: boolean; message?: string }>;
      revealExport(absolutePath: string): Promise<{ ok: boolean; message?: string }>;
      openDefault(relativePath: string): Promise<{ ok: boolean; message?: string }>;
      openExternalUrl(url: string): Promise<{ ok: boolean; message?: string }>;
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
