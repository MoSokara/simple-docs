const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const { spawn } = require("node:child_process");
const archiver = require("archiver");

const SUPPORTED = new Map([
  [".md", "markdown"],
  [".txt", "text"],
  [".pdf", "pdf"],
  [".png", "image"],
  [".jpg", "image"],
  [".jpeg", "image"],
  [".webp", "image"],
  [".gif", "image"],
  [".svg", "image"],
]);

const CODE_EXTENSIONS = new Set([
  ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".json",
  ".html", ".htm", ".css", ".scss", ".sass", ".less",
  ".xml", ".vue", ".svelte", ".c", ".h", ".cc", ".cpp", ".cxx",
  ".hpp", ".hh", ".cs", ".java", ".kt", ".kts", ".go", ".rs",
  ".py", ".rb", ".php", ".sql", ".sh", ".bash", ".zsh",
  ".ps1", ".bat", ".cmd", ".yaml", ".yml", ".toml", ".ini",
  ".conf", ".env",
]);

const MIME = {
  markdown: "text/markdown",
  text: "text/plain",
  code: "text/plain",
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
  const ext = path.extname(filePath).toLowerCase();
  if (SUPPORTED.has(ext)) return SUPPORTED.get(ext);
  if (CODE_EXTENSIONS.has(ext)) return "code";
  return "other";
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
  watcher?.close();
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

  if (result.canceled || !result.filePaths[0]) {
    return { rootPath, tree: rootPath ? await scanFolder() : null };
  }

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

  if (type === "other") {
    throw new Error("Preview is not available for this file type.");
  }

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

      if (file.type === "markdown" || file.type === "text" || file.type === "code") {
        try {
          const text = await fsp.readFile(relativeSafe(file.path), "utf8");
          if (text.toLowerCase().includes(q)) results.push({ ...file, match: "content" });
        } catch {}
      }
    }

    for (const child of folder.folders) {
      await walk(child);
    }
  }

  await walk(tree);
  return results.slice(0, 100);
}

function findCodeCommand() {
  if (process.platform !== "win32") return "code";

  const candidates = [
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "Programs", "Microsoft VS Code", "bin", "code.cmd"),
    process.env.ProgramFiles && path.join(process.env.ProgramFiles, "Microsoft VS Code", "bin", "code.cmd"),
    process.env["ProgramFiles(x86)"] && path.join(process.env["ProgramFiles(x86)"], "Microsoft VS Code", "bin", "code.cmd"),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return "code.cmd";
}

function openInVSCode(relativePath) {
  const full = relativeSafe(relativePath);
  const command = findCodeCommand();

  return new Promise((resolve) => {
    const launch = process.platform === "win32"
      ? spawn("cmd.exe", ["/d", "/s", "/c", `"${command}" "${full}"`], { detached: true, stdio: "ignore", windowsHide: true })
      : spawn(command, [full], { detached: true, stdio: "ignore", windowsHide: true });

    launch.once("error", async () => {
      const fallback = await shell.openPath(full);
      resolve(fallback ? { ok: false, message: fallback } : { ok: true, fallback: true });
    });

    launch.once("spawn", () => {
      launch.unref();
      resolve({ ok: true });
    });
  });
}

async function collectFolderStats(dir) {
  let totalBytes = 0;
  let totalFiles = 0;

  async function walk(current) {
    const entries = await fsp.readdir(current, { withFileTypes: true });

    for (const entry of entries) {
      const full = path.join(current, entry.name);

      if (entry.isDirectory()) {
        await walk(full);
      } else {
        try {
          const stat = await fsp.stat(full);
          totalBytes += stat.size;
          totalFiles += 1;
        } catch {}
      }
    }
  }

  await walk(dir);
  return { totalBytes, totalFiles };
}

function sendExportProgress(payload) {
  mainWindow?.webContents.send("export:progress", payload);
}

async function exportFolder() {
  if (!rootPath) return { ok: false, canceled: true };

  const result = await dialog.showSaveDialog(mainWindow, {
    title: "Export Docs Backup",
    defaultPath: path.join(app.getPath("downloads"), path.basename(rootPath) + "-backup.zip"),
    filters: [{ name: "ZIP archive", extensions: ["zip"] }],
  });

  if (result.canceled || !result.filePath) {
    return { ok: false, canceled: true };
  }

  const outputPath = result.filePath;
  sendExportProgress({ status: "preparing", percent: 0, processedBytes: 0, totalBytes: 0, processedFiles: 0, totalFiles: 0 });

  try {
    const stats = await collectFolderStats(rootPath);
    sendExportProgress({
      status: "compressing",
      percent: 0,
      processedBytes: 0,
      totalBytes: stats.totalBytes,
      processedFiles: 0,
      totalFiles: stats.totalFiles,
    });

    await new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const archive = archiver("zip", { zlib: { level: 9 } });

      let settled = false;
      const fail = (error) => {
        if (settled) return;
        settled = true;
        reject(error);
      };

      output.once("close", () => {
        if (!settled) {
          settled = true;
          resolve();
        }
      });

      output.once("error", fail);
      archive.once("error", fail);
      archive.on("progress", (progress) => {
        const processedBytes = progress.fs?.processedBytes ?? 0;
        const processedFiles = progress.entries?.processed ?? 0;
        const percent = stats.totalBytes > 0
          ? Math.min(99, Math.round((processedBytes / stats.totalBytes) * 100))
          : Math.min(99, Math.round((processedFiles / Math.max(stats.totalFiles, 1)) * 100));

        sendExportProgress({
          status: "compressing",
          percent,
          processedBytes,
          totalBytes: stats.totalBytes,
          processedFiles,
          totalFiles: stats.totalFiles,
        });
      });

      archive.pipe(output);
      archive.directory(rootPath, path.basename(rootPath));
      archive.finalize().catch(fail);
    });

    sendExportProgress({
      status: "complete",
      percent: 100,
      processedBytes: stats.totalBytes,
      totalBytes: stats.totalBytes,
      processedFiles: stats.totalFiles,
      totalFiles: stats.totalFiles,
      path: outputPath,
    });

    return { ok: true, path: outputPath };
  } catch (error) {
    try { await fsp.unlink(outputPath); } catch {}
    sendExportProgress({ status: "error", percent: 0, message: error instanceof Error ? error.message : "Export failed." });
    return { ok: false, message: error instanceof Error ? error.message : "Export failed." };
  }
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
  if (dev) {
    mainWindow.loadURL("http://localhost:3000");
  } else {
    mainWindow.loadURL("http://localhost:3000");
  }
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
  clearTimeout(changeTimer);
  watcher?.close();
  if (process.platform !== "darwin") app.quit();
});
