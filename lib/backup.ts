import JSZip from "jszip";
import { db, normalizePath, type } from "@/lib/local-db";

export async function exportBackup() {
  const zip = new JSZip();
  const files = await db.files.toArray();
  const folders = await db.folders.toArray();
  const manifest = {
    format: "sokara-docs",
    version: 1,
    createdAt: new Date().toISOString(),
    folders,
    files: files.map(({ id, name, path, type, mimeType, size, modifiedAt }) => ({
      id, name, path, type, mimeType, size, modifiedAt,
    })),
  };
  zip.file("manifest.json", JSON.stringify(manifest, null, 2));
  for (const file of files) zip.file("library/" + file.path, file.blob);
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  downloadBlob(blob, "SokaraDocs-Backup-" + new Date().toISOString().slice(0, 10) + ".sokara");
}

export async function importBackup(file: File) {
  const zip = await JSZip.loadAsync(file);
  const manifestText = await zip.file("manifest.json")?.async("text");
  if (!manifestText) throw new Error("Invalid Sokara backup");
  const manifest = JSON.parse(manifestText) as {
    folders?: { path: string; createdAt: number }[];
    files?: Array<{ id: string; name: string; path: string; type: any; mimeType: string; size: number; modifiedAt: number }>;
  };
  if (!Array.isArray(manifest.files)) throw new Error("Invalid backup manifest");
  await db.transaction("rw", db.files, db.folders, async () => {
    for (const folder of manifest.folders || []) await db.folders.put(folder);
    for (const meta of manifest.files) {
      const entry = zip.file("library/" + normalizePath(meta.path));
      if (!entry) continue;
      const blob = await entry.async("blob");
      await db.files.put({ ...meta, blob });
    }
  });
}

export async function exportFile(fileId: string) {
  const file = await db.files.get(fileId);
  if (!file) throw new Error("File not found");
  downloadBlob(file.blob, file.name);
}

export async function exportFolder(path: string) {
  const files = await db.files.toArray();
  const selected = files.filter((f) => f.path === path || f.path.startsWith(path + "/"));
  const zip = new JSZip();
  for (const file of selected) zip.file(file.path.slice(path.length).replace(/^\//, ""), file.blob);
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  downloadBlob(blob, (path.split("/").pop() || "folder") + ".zip");
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}