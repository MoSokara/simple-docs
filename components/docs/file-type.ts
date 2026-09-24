import type { FileType } from "@/types/docs";

type FileTypeMeta = {
  label: string;
  colorClass: string;
  iconClass: string;
};

export const FILE_TYPE_META: Record<FileType, FileTypeMeta> = {
  markdown: { label: "Markdown", colorClass: "text-file-markdown", iconClass: "text-file-markdown" },
  text: { label: "Text", colorClass: "text-file-text", iconClass: "text-file-text" },
  code: { label: "Code", colorClass: "text-file-code", iconClass: "text-file-code" },
  pdf: { label: "PDF", colorClass: "text-file-pdf", iconClass: "text-file-pdf" },
  image: { label: "Image", colorClass: "text-file-image", iconClass: "text-file-image" },
  word: { label: "Word", colorClass: "text-file-word", iconClass: "text-file-word" },
  powerpoint: { label: "PowerPoint", colorClass: "text-file-powerpoint", iconClass: "text-file-powerpoint" },
  excel: { label: "Excel", colorClass: "text-file-excel", iconClass: "text-file-excel" },
  access: { label: "Access", colorClass: "text-file-access", iconClass: "text-file-access" },
  other: { label: "File", colorClass: "text-file-other", iconClass: "text-file-other" },
};
