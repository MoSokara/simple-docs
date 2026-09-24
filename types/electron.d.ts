import type { DocFile, DocFolder, FilePayload, SearchResult } from "./docs";

declare global {
  interface Window {
    simpleDocs: {
      getState(): Promise<{ rootPath: string | null; selectedPath: string | null }>;
      openFolder(): Promise<{ rootPath: string | null; tree: DocFolder | null }>;
      scan(): Promise<DocFolder | null>;
      readFile(relativePath: string): Promise<FilePayload>;
      search(query: string): Promise<SearchResult[]>;
      openInEditor(relativePath: string): Promise<{ ok: boolean; message?: string }>;
      revealInExplorer(relativePath: string): Promise<void>;
      openDefault(relativePath: string): Promise<string>;
      exportZip(): Promise<{ ok: boolean; path?: string; canceled?: boolean }>;
      setSelectedFile(relativePath: string | null): Promise<void>;
      onFolderChanged(callback: () => void): () => void;
    };
  }
}

export {};