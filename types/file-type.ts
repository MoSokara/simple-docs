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

type FileTypeMeta = {
  label: string;
};

export const FILE_TYPE_META: Record<FileType, FileTypeMeta> = {
  markdown: { label: "Markdown" },
  text: { label: "Text" },
  code: { label: "Code" },
  pdf: { label: "PDF" },
  image: { label: "Image" },
  word: { label: "Word" },
  powerpoint: { label: "PowerPoint" },
  excel: { label: "Excel" },
  access: { label: "Access" },
  other: { label: "File" },
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

const FILE_COLOR_KEYS = new Set([
  "md", "txt", "js", "jsx", "ts", "tsx", "mjs", "cjs", "json", "jsonc",
  "html", "htm", "css", "scss", "sass", "less", "xml", "vue", "svelte", "astro",
  "c", "h", "cc", "cpp", "cxx", "hpp", "hh", "cs", "java", "kt", "kts",
  "go", "rs", "py", "rb", "php", "sql", "sh", "bash", "zsh", "ps1", "bat", "cmd",
  "yaml", "yml", "toml", "ini", "conf", "env", "graphql", "gql", "prisma", "proto",
  "dart", "swift", "m", "mm", "r", "lua", "pl", "pm", "ex", "exs", "erl", "hrl",
  "fs", "fsx", "vb", "asm", "s", "zig", "nim", "clj", "cljs", "groovy", "gradle",
  "cmake", "mk", "make", "tf", "tfvars",
  "pdf", "png", "jpg", "jpeg", "webp", "gif", "svg",
  "doc", "docx", "docm", "dot", "dotx", "dotm",
  "ppt", "pptx", "pptm", "pps", "ppsx", "pot", "potx",
  "xls", "xlsx", "xlsm", "xlsb", "xlt", "xltx", "xltm",
  "mdb", "accdb", "accde", "mde",
]);

const SPECIAL_FILE_COLORS: Record<string, string> = {
  dockerfile: "dockerfile",
  makefile: "makefile",
  ".gitignore": "gitignore",
  ".dockerignore": "dockerignore",
};

export function fileColorKeyFromName(fileName: string) {
  const lower = fileName.toLowerCase();
  const special = SPECIAL_FILE_COLORS[lower];

  if (special) return special;
  if (lower === ".env") return "env";

  const dot = lower.lastIndexOf(".");
  const key = dot === -1 ? "" : lower.slice(dot + 1);

  return FILE_COLOR_KEYS.has(key) ? key : "other";
}

export function fileColorStyle(fileName: string) {
  return {
    color: `var(--token-ext-${fileColorKeyFromName(fileName)}, var(--token-file-other))`,
  };
}

export function codeLanguageFromName(fileName: string) {
  const lower = fileName.toLowerCase();

  if (lower === "dockerfile") return "dockerfile";
  if (lower === "makefile") return "makefile";
  if (lower === ".gitignore" || lower === ".dockerignore") return "gitignore";

  const dot = lower.lastIndexOf(".");
  if (dot === -1) return "text";

  return CODE_LANGUAGES[lower.slice(dot)] ?? "text";
}
