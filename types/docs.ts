export type FileType =
  | "markdown"
  | "text"
  | "code"
  | "pdf"
  | "image"
  | "word"
  | "powerpoint"
  | "excel"
  | "access"
  | "other";

export type DocFile = {
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

export type FilePayload = {
  type: FileType;
  mimeType: string;
  base64: string;
  size: number;
  modifiedAt: number;
};

export type SearchResult = DocFile & {
  match: "name" | "path" | "content";
};
