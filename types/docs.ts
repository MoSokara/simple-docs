export type FileType = "markdown" | "text" | "pdf" | "image" | "other";

export type DocFile = {
  id: string;
  name: string;
  path: string;
  type: FileType;
  size: number;
  modifiedAt: number;
};

export type DocFolder = {
  name: string;
  path: string;
  folders: DocFolder[];
  files: DocFile[];
};

export type StoredFile = {
  id: string;
  name: string;
  path: string;
  type: FileType;
  mimeType: string;
  size: number;
  modifiedAt: number;
  blob: Blob;
};

export type StoredFolder = {
  path: string;
  createdAt: number;
};