import Dexie, { type EntityTable } from "dexie";
import type { StoredFile, StoredFolder } from "@/types/docs";

class SokaraDatabase extends Dexie {
  files!: EntityTable<StoredFile, "id">;
  folders!: EntityTable<StoredFolder, "path">;

  constructor() {
    super("sokara-docs");
    this.version(1).stores({
      files: "id, path, name, type, modifiedAt",
      folders: "path, createdAt",
    });
  }
}

export const db = new SokaraDatabase();

export async function ensureLibrarySeed() {
  if (typeof window === "undefined") return;
  const count = await db.files.count();
  if (count > 0) return;

  const now = Date.now();
  await db.transaction("rw", db.files, db.folders, async () => {
    await db.files.bulkAdd([
      {
        id: crypto.randomUUID(),
        name: "Welcome.md",
        path: "Welcome.md",
        type: "markdown",
        mimeType: "text/markdown",
        size: 0,
        modifiedAt: now,
        blob: new Blob(
          [
            "# Welcome to Sokara Docs\n\n" +
              "This is your personal offline-first learning library.\n\n" +
              "Use **Import** to add your existing Markdown, TXT, PDF, and image files.\n\n" +
              "Create folders and notes directly from the  button.\n",
          ],
          { type: "text/markdown" },
        ),
      },
      {
        id: crypto.randomUUID(),
        name: "Getting Started.md",
        path: "Notes/Getting Started.md",
        type: "markdown",
        mimeType: "text/markdown",
        size: 0,
        modifiedAt: now,
        blob: new Blob(
          [
            "# Getting Started\n\n" +
              "Your files live in your browser's local IndexedDB storage.\n\n" +
              "They are not committed to GitHub. Cloud storage is optional.\n",
          ],
          { type: "text/markdown" },
        ),
      },
    ]);
    await db.folders.add({ path: "Notes", createdAt: now });
  });
}

export async function readFileBlob(id: string) {
  const file = await db.files.get(id);
  return file?.blob ?? null;
}

export async function saveFileContent(id: string, content: string) {
  const file = await db.files.get(id);
  if (!file) throw new Error("File not found");
  const blob = new Blob([content], { type: file.mimeType || "text/plain" });
  await db.files.update(id, {
    blob,
    size: blob.size,
    modifiedAt: Date.now(),
  });
}

export async function createFolder(path: string) {
  const clean = normalizePath(path);
  if (!clean) throw new Error("Folder name is required");
  const existing = await db.folders.get(clean);
  if (existing) throw new Error("Folder already exists");
  await db.folders.add({ path: clean, createdAt: Date.now() });
}

export async function createTextFile(
  name: string,
  folder: string,
  type: "markdown" | "text",
) {
  const fileName = name.includes(".") ? name : name + (type === "markdown" ? ".md" : ".txt");
  const path = joinPath(folder, fileName);
  if (await db.files.where("path").equals(path).count()) throw new Error("File already exists");
  const mimeType = type === "markdown" ? "text/markdown" : "text/plain";
  const blob = new Blob([""], { type: mimeType });
  const record: StoredFile = {
    id: crypto.randomUUID(),
    name: fileName,
    path,
    type,
    mimeType,
    size: blob.size,
    modifiedAt: Date.now(),
    blob,
  };
  await db.files.add(record);
  return record;
}

export async function importBrowserFiles(
  files: FileList | File[],
  destination = "",
) {
  const list = Array.from(files);
  for (const file of list) {
    const relative = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
    const importedPath = relative || joinPath(destination, file.name);
    const path = normalizePath(importedPath);
    const name = path.split("/").pop() || file.name;
    const type = typeFromName(name);
    if (!type) continue;
    const folderParts = path.split("/").slice(0, -1);
    for (let i = 1; i <= folderParts.length; i++) {
      await db.folders.put({
        path: folderParts.slice(0, i).join("/"),
        createdAt: Date.now(),
      });
    }
    const existing = await db.files.where("path").equals(path).first();
    const record: StoredFile = {
      id: existing?.id || crypto.randomUUID(),
      name,
      path,
      type,
      mimeType: file.type || mimeFor(type),
      size: file.size,
      modifiedAt: file.lastModified || Date.now(),
      blob: file,
    };
    await db.files.put(record);
  }
}

export async function renameFile(id: string, name: string) {
  const file = await db.files.get(id);
  if (!file) throw new Error("File not found");
  const clean = name.trim();
  if (!clean) throw new Error("Name is required");
  const folder = file.path.split("/").slice(0, -1).join("/");
  const nextPath = joinPath(folder, clean);
  const conflict = await db.files.where("path").equals(nextPath).first();
  if (conflict && conflict.id !== id) throw new Error("A file with this name already exists");
  await db.files.update(id, { name: clean, path: nextPath, modifiedAt: Date.now() });
}

export async function renameFolder(path: string, name: string) {
  const clean = name.trim();
  if (!clean) throw new Error("Name is required");
  const parent = path.split("/").slice(0, -1).join("/");
  const nextRoot = joinPath(parent, clean);
  if (nextRoot === path) return;
  const [files, folders] = await Promise.all([
    db.files.toArray(),
    db.folders.toArray(),
  ]);
  const affectedFiles = files.filter((f) => f.path === path || f.path.startsWith(path + "/"));
  const affectedFolders = folders.filter((f) => f.path === path || f.path.startsWith(path + "/"));
  await db.transaction("rw", db.files, db.folders, async () => {
    for (const f of affectedFiles) {
      await db.files.update(f.id, { path: nextRoot + f.path.slice(path.length) });
    }
    for (const folder of affectedFolders) {
      await db.folders.delete(folder.path);
    }
    for (const folder of affectedFolders) {
      await db.folders.put({
        path: nextRoot + folder.path.slice(path.length),
        createdAt: folder.createdAt,
      });
    }
  });
}

export async function moveFile(id: string, folder: string) {
  const file = await db.files.get(id);
  if (!file) throw new Error("File not found");
  const nextPath = joinPath(folder, file.name);
  const conflict = await db.files.where("path").equals(nextPath).first();
  if (conflict && conflict.id !== id) throw new Error("A file with that name already exists");
  await db.files.update(id, { path: nextPath, modifiedAt: Date.now() });
}

export async function moveFolder(path: string, destination: string) {
  const folderName = path.split("/").pop() || path;
  const nextRoot = joinPath(destination, folderName);
  if (nextRoot === path || nextRoot.startsWith(path + "/")) throw new Error("Invalid destination");
  const [files, folders] = await Promise.all([db.files.toArray(), db.folders.toArray()]);
  const affectedFiles = files.filter((f) => f.path === path || f.path.startsWith(path + "/"));
  const affectedFolders = folders.filter((f) => f.path === path || f.path.startsWith(path + "/"));
  await db.transaction("rw", db.files, db.folders, async () => {
    for (const f of affectedFiles) await db.files.update(f.id, { path: nextRoot + f.path.slice(path.length) });
    for (const f of affectedFolders) await db.folders.delete(f.path);
    for (const f of affectedFolders) await db.folders.put({ path: nextRoot + f.path.slice(path.length), createdAt: f.createdAt });
  });
}

export async function deleteFile(id: string) {
  await db.files.delete(id);
}

export async function deleteFolder(path: string) {
  const [files, folders] = await Promise.all([db.files.toArray(), db.folders.toArray()]);
  await db.transaction("rw", db.files, db.folders, async () => {
    for (const f of files) if (f.path === path || f.path.startsWith(path + "/")) await db.files.delete(f.id);
    for (const f of folders) if (f.path === path || f.path.startsWith(path + "/")) await db.folders.delete(f.path);
  });
}

export function normalizePath(value: string) {
  return value.replaceAll("\\", "/").split("/").filter(Boolean).join("/");
}

export function joinPath(a: string, b: string) {
  return [a, b].filter(Boolean).join("/");
}

export function typeFromName(name: string): StoredFile["type"] | null {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "md") return "markdown";
  if (ext === "txt") return "text";
  if (ext === "pdf") return "pdf";
  if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext || "")) return "image";
  return null;
}

function mimeFor(type: StoredFile["type"]) {
  if (type === "markdown") return "text/markdown";
  if (type === "text") return "text/plain";
  if (type === "pdf") return "application/pdf";
  return "application/octet-stream";
}

export async function makeStoragePersistent() {
  if (navigator.storage?.persist) {
    try { await navigator.storage.persist(); } catch {}
  }
}