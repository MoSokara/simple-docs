const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const { spawn } = require("node:child_process");
const archiver = require("archiver");

const SUPPORTED = new Map([
  [".md", "markdown"], [".txt", "text"], [".pdf", "pdf"],
  [".png", "image"], [".jpg", "image"], [".jpeg", "image"], [".webp", "image"],
  [".gif", "image"], [".svg", "image"],
]);

const MIME = {
  markdown: "text/markdown",
  text: "text/plain",
  pdf: "application/pdf",
  image: "application/octet-stream",
};

function mimeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return ({
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
  })[ext] || MIME.image;
}

let mainWindow;
let rootPath = null;
let selectedPath = null;
let watcher = null;
let changeTimer = null;

const stateFile = () => path.join(app.getPath("userData"), "state.json");

async function loadState() {
  try {
    const state = JSON.parse(await fsp.readFile(stateFile(), "utf8"));
    rootPath = typeof state.rootPath === "string" ? state.rootPath : null;
    selectedPath = typeof state.selectedPath === "string" ? state.selectedPath : null;
  } catch {}
}

async function saveState() {
  await fsp.mkdir(path.dirname(stateFile()), { recursive: true });
  await fsp.writeFile(stateFile(), JSON.stringify({ rootPath, selectedPath }, null, 2));
}

function relativeSafe(relativePath) {
  if (!rootPath) throw new Error("No folder is open.");
  const clean = path.normalize(relativePath);
  const full = path.resolve(rootPath, clean);
  const base = path.resolve(rootPath);
  if (full !== base && !full.startsWith(base + path.sep)) throw new Error("Invalid file path.");
  return full;
}

function typeOf(filePath) {
  return SUPPORTED.get(path.extname(filePath).toLowerCase()) || "other";
}

async function scanFolder(dir = rootPath, relative = "") {
  if (!dir) return null;
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  const folders = [];
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = relative ? path.join(relative, entry.name) : entry.name;
    if (entry.isDirectory()) {
      folders.push(await scanFolder(full, rel));
      continue;
    }
    const type = typeOf(full);
    const stat = await fsp.stat(full);
    files.push({
      name: entry.name,
      path: rel.split(path.sep).join("/"),
      type,
      size: stat.size,
      modifiedAt: stat.mtimeMs,
    });
  }

  return {
    name: relative ? path.basename(relative) : path.basename(rootPath),
    path: relative.split(path.sep).join("/"),
    folders,
    files,
  };
}

function scheduleChange() {
  clearTimeout(changeTimer);
  changeTimer = setTimeout(() => mainWindow?.webContents.send("folder:changed"), 180);
}

function startWatcher() {
  if (watcher) watcher.close();
  watcher = null;
  if (!rootPath) return;
  try {
    watcher = fs.watch(rootPath, { recursive: true }, scheduleChange);
  } catch {
    watcher = fs.watch(rootPath, scheduleChange);
  }
}

async function chooseFolder() {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Open Docs Folder",
    properties: ["openDirectory"],
    buttonLabel: "Open Folder",
  });
  if (result.canceled || !result.filePaths[0]) return { rootPath, tree: rootPath ? await scanFolder() : null };
  rootPath = result.filePaths[0];
  selectedPath = null;
  await saveState();
  startWatcher();
  return { rootPath, tree: await scanFolder() };
}

async function readFile(relativePath) {
  const full = relativeSafe(relativePath);
  const stat = await fsp.stat(full);
  const type = typeOf(full);
  if (type === "other") throw new Error("Preview is not available for this file type.");
  const buffer = await fsp.readFile(full);
  return {
    type,
    mimeType: type === "image" ? mimeFor(full) : (MIME[type] || "application/octet-stream"),
    base64: buffer.toString("base64"),
    size: stat.size,
    modifiedAt: stat.mtimeMs,
  };
}

async function searchFiles(query) {
  if (!rootPath || !query.trim()) return [];
  const q = query.trim().toLowerCase();
  const tree = await scanFolder();
  const results = [];
  async function walk(folder) {
    for (const file of folder.files) {
      const pathMatch = file.path.toLowerCase().includes(q) || file.name.toLowerCase().includes(q);
      if (pathMatch) {
        results.push({ ...file, match: file.name.toLowerCase().includes(q) ? "name" : "path" });
        continue;
      }
      if (file.type === "markdown" || file.type === "text") {
        try {
          const text = await fsp.readFile(relativeSafe(file.path), "utf8");
          if (text.toLowerCase().includes(q)) results.push({ ...file, match: "content" });
        } catch {}
      }
    }
    for (const child of folder.folders) await walk(child);
  }
  await walk(tree);
  return results.slice(0, 100);
}

function openInVSCode(relativePath) {
  const full = relativeSafe(relativePath);
  const command = process.platform === "win32" ? "code.cmd" : "code";
  return new Promise((resolve) => {
    const child = spawn(command, [full], {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    });
    child.once("error", async () => {
      const fallback = await shell.openPath(full);
      resolve(fallback ? { ok: false, message: fallback } : { ok: true });
    });
    child.once("spawn", () => {
      child.unref();
      resolve({ ok: true });
    });
  });
}

async function exportFolder() {
  if (!rootPath) return { ok: false, canceled: true };
  const result = await dialog.showSaveDialog(mainWindow, {
    title: "Export Docs Backup",
    defaultPath: path.join(app.getPath("downloads"), path.basename(rootPath) + "-backup.zip"),
    filters: [{ name: "ZIP archive", extensions: ["zip"] }],
  });
  if (result.canceled || !result.filePath) return { ok: false, canceled: true };

  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(result.filePath);
    const archive = archiver("zip", { zlib: { level: 9 } });
    output.on("close", resolve);
    archive.on("error", reject);
    archive.pipe(output);
    archive.directory(rootPath, path.basename(rootPath));
    archive.finalize();
  });

  return { ok: true, path: result.filePath };
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 620,
    backgroundColor: "#080b10",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const dev = process.argv.includes("--dev");
  if (dev) mainWindow.loadURL("http://localhost:3000");
  else mainWindow.loadURL("http://localhost:3000");
}

app.whenReady().then(async () => {
  await loadState();
  createWindow();
  startWatcher();

  ipcMain.handle("state:get", () => ({ rootPath, selectedPath }));
  ipcMain.handle("state:selected", async (_event, value) => {
    selectedPath = typeof value === "string" ? value : null;
    await saveState();
  });
  ipcMain.handle("folder:open", chooseFolder);
  ipcMain.handle("folder:scan", async () => rootPath ? scanFolder() : null);
  ipcMain.handle("file:read", (_event, relativePath) => readFile(relativePath));
  ipcMain.handle("file:search", (_event, query) => searchFiles(query));
  ipcMain.handle("file:edit", (_event, relativePath) => openInVSCode(relativePath));
  ipcMain.handle("file:reveal", (_event, relativePath) => shell.showItemInFolder(relativeSafe(relativePath)));
  ipcMain.handle("file:openDefault", (_event, relativePath) => shell.openPath(relativeSafe(relativePath)));
  ipcMain.handle("folder:export", exportFolder);
});

app.on("window-all-closed", () => {
  watcher?.close();
  if (process.platform !== "darwin") app.quit();
});