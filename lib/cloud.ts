import { createClient } from "@supabase/supabase-js";
import { db } from "@/lib/local-db";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const cloudConfigured = Boolean(url && key);
export const supabase = cloudConfigured ? createClient(url!, key!) : null;
export const CLOUD_BUCKET = "sokara-docs";

export async function signIn(email: string, password: string) {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string) {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase.auth.signUp({ email, password });
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function uploadLibraryToCloud() {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in first");
  const files = await db.files.toArray();
  for (const file of files) {
    const path = user.id + "/" + file.path;
    const { error } = await supabase.storage.from(CLOUD_BUCKET).upload(path, file.blob, {
      contentType: file.mimeType,
      upsert: true,
      cacheControl: "3600",
    });
    if (error) throw error;
  }
}

export async function restoreLibraryFromCloud() {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in first");
  const { data, error } = await supabase.storage.from(CLOUD_BUCKET).list(user.id, {
    limit: 1000,
    sortBy: { column: "name", order: "asc" },
  });
  if (error) throw error;
  for (const item of data || []) {
    if (!item.name || item.id === null) continue;
    const { data: blob, error: downloadError } = await supabase.storage
      .from(CLOUD_BUCKET)
      .download(user.id + "/" + item.name);
    if (downloadError) continue;
    const ext = item.name.split(".").pop()?.toLowerCase();
    const type =
      ext === "md" ? "markdown" :
      ext === "txt" ? "text" :
      ext === "pdf" ? "pdf" :
      ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext || "") ? "image" : null;
    if (!type) continue;
    await db.files.put({
      id: crypto.randomUUID(),
      name: item.name,
      path: item.name,
      type,
      mimeType: blob.type || "application/octet-stream",
      size: blob.size,
      modifiedAt: Date.now(),
      blob,
    });
  }
}