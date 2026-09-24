import type { FileType } from "@/types/docs";

export const FILE_TYPE_META: Record<FileType, {
  label: string;
  colorClass: string;
  iconClass: string;
}> = {
  markdown: {
    label: "Markdown",
    colorClass: "file-markdown",
    iconClass: "text-file-markdown",
  },
  text: {
    label: "Text",
    colorClass: "file-text",
    iconClass: "text-file-text",
  },
  code: {
    label: "Code",
    colorClass: "file-code",
    iconClass: "text-file-code",
  },
  pdf: {
    label: "PDF",
    colorClass: "file-pdf",
    iconClass: "text-file-pdf",
  },
  image: {
    label: "Image",
    colorClass: "file-image",
    iconClass: "text-file-image",
  },
  other: {
    label: "File",
    colorClass: "file-other",
    iconClass: "text-file-other",
  },
};
