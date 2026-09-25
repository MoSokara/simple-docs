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

const CODE_LANGUAGES: Record<string, string> = {
  ".js": "javascript",
  ".jsx": "javascript",
  ".ts": "typescript",
  ".tsx": "typescript",
  ".mjs": "javascript",
  ".cjs": "javascript",
  ".json": "json",
  ".jsonc": "jsonc",
  ".html": "html",
  ".htm": "html",
  ".css": "css",
  ".scss": "scss",
  ".sass": "sass",
  ".less": "less",
  ".xml": "xml",
  ".vue": "vue",
  ".svelte": "svelte",
  ".astro": "astro",
  ".c": "c",
  ".h": "c",
  ".cc": "cpp",
  ".cpp": "cpp",
  ".cxx": "cpp",
  ".hpp": "cpp",
  ".hh": "cpp",
  ".cs": "csharp",
  ".java": "java",
  ".kt": "kotlin",
  ".kts": "kotlin",
  ".go": "go",
  ".rs": "rust",
  ".py": "python",
  ".rb": "ruby",
  ".php": "php",
  ".sql": "sql",
  ".sh": "shellscript",
  ".bash": "shellscript",
  ".zsh": "shellscript",
  ".ps1": "powershell",
  ".bat": "bat",
  ".cmd": "bat",
  ".yaml": "yaml",
  ".yml": "yaml",
  ".toml": "toml",
  ".ini": "ini",
  ".conf": "ini",
  ".env": "dotenv",
  ".graphql": "graphql",
  ".gql": "graphql",
  ".prisma": "prisma",
  ".proto": "proto",
  ".dart": "dart",
  ".swift": "swift",
  ".m": "objective-c",
  ".mm": "objective-cpp",
  ".r": "r",
  ".lua": "lua",
  ".pl": "perl",
  ".pm": "perl",
  ".ex": "elixir",
  ".exs": "elixir",
  ".erl": "erlang",
  ".hrl": "erlang",
  ".fs": "fsharp",
  ".fsx": "fsharp",
  ".vb": "vb",
  ".asm": "asm",
  ".s": "asm",
  ".zig": "zig",
  ".nim": "nim",
  ".clj": "clojure",
  ".cljs": "clojure",
  ".groovy": "groovy",
  ".gradle": "gradle",
  ".cmake": "cmake",
  ".mk": "make",
  ".make": "make",
  ".tf": "terraform",
  ".tfvars": "terraform",
};

export function codeLanguageFromName(fileName: string) {
  const lower = fileName.toLowerCase();

  if (lower === "dockerfile") return "dockerfile";
  if (lower === "makefile") return "makefile";
  if (lower === ".gitignore" || lower === ".dockerignore") return "gitignore";

  const dot = lower.lastIndexOf(".");
  if (dot === -1) return "text";

  return CODE_LANGUAGES[lower.slice(dot)] ?? "text";
}
