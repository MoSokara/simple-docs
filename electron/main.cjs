const { app, BrowserWindow, dialog, ipcMain, shell, Menu, net, protocol } = require("electron");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { spawn, execFileSync } = require("node:child_process");
const archiver = require("archiver");
const { autoUpdater } = require("electron-updater");

// Use the application's own toolbar instead of Electron's default menu bar.
Menu.setApplicationMenu(null);

protocol.registerSchemesAsPrivileged([
  {
    scheme: "simple-docs",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
    },
  },
]);

const SUPPORTED = new Map([
  [".md", "markdown"], [".txt", "text"], [".pdf", "pdf"],
  [".png", "image"], [".jpg", "image"], [".jpeg", "image"],
  [".webp", "image"], [".gif", "image"], [".svg", "image"],
  [".doc", "word"], [".docx", "word"], [".docm", "word"], [".dot", "word"], [".dotx", "word"], [".dotm", "word"],
  [".ppt", "powerpoint"], [".pptx", "powerpoint"], [".pptm", "powerpoint"], [".pps", "powerpoint"], [".ppsx", "powerpoint"], [".pot", "powerpoint"], [".potx", "powerpoint"],
  [".xls", "excel"], [".xlsx", "excel"], [".xlsm", "excel"], [".xlsb", "excel"], [".xlt", "excel"], [".xltx", "excel"], [".xltm", "excel"],
  [".mdb", "access"], [".accdb", "access"], [".accde", "access"], [".mde", "access"],
]);

const CODE_EXTENSIONS = new Set([
  ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".json", ".html", ".htm",
  ".css", ".scss", ".sass", ".less", ".xml", ".vue", ".svelte", ".c", ".h",
  ".cc", ".cpp", ".cxx", ".hpp", ".hh", ".cs", ".java", ".kt", ".kts",
  ".go", ".rs", ".py", ".rb", ".php", ".sql", ".sh", ".bash", ".zsh",
  ".ps1", ".bat", ".cmd", ".yaml", ".yml", ".toml", ".ini", ".conf", ".env",
  ".jsonc", ".graphql", ".gql", ".prisma", ".proto", ".astro", ".dart", ".swift",
  ".m", ".mm", ".r", ".lua", ".pl", ".pm", ".ex", ".exs", ".erl", ".hrl",
  ".fs", ".fsx", ".vb", ".asm", ".s", ".zig", ".nim", ".clj", ".cljs", ".groovy",
  ".gradle", ".cmake", ".mk", ".make", ".tf", ".tfvars",
]);

const PREVIEW_TYPES = new Set(["markdown", "text", "code", "pdf", "image"]);

const MIME = {
  markdown: "text/markdown",
  text: "text/plain",
  code: "text/plain",
  pdf: "application/pdf",
};

const imageMime = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

let mainWindow = null;
let rootPath = null;
let selectedPath = null;
let watcher = null;
let changeTimer = null;
let lastExportPath = null;

const stateFile = () => path.join(app.getPath("userData"), "state.json");
const rendererPath = path.join(__dirname, "..", "out");

function registerAppProtocol() {
  protocol.handle("simple-docs", (request) => {
    const requestUrl = new URL(request.url);
    let pathname = decodeURIComponent(requestUrl.pathname);

    if (pathname === "/") {
      pathname = "/index.html";
    } else if (pathname.endsWith("/")) {
      pathname += "index.html";
    }

    const requestedPath = path.resolve(rendererPath, "." + pathname);
    const relativePath = path.relative(rendererPath, requestedPath);
    const isSafe =
      relativePath &&
      !relativePath.startsWith("..") &&
      !path.isAbsolute(relativePath);

    if (!isSafe) {
      return new Response("Not found", { status: 404 });
    }

    return net.fetch(pathToFileURL(requestedPath).toString());
  });
}

function setupAutoUpdater() {
  if (!app.isPackaged) return;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  void autoUpdater.checkForUpdatesAndNotify().catch(() => {});
}

async function loadState() {
  try {
    const state = JSON.parse(await fsp.readFile(stateFile(), "utf8"));
    rootPath = typeof state.rootPath === "string" ? state.rootPath : null;
    selectedPath = typeof state.selectedPath === "string" ? state.selectedPath : null;

    if (rootPath) {
      try {
        if (!(await fsp.stat(rootPath)).isDirectory()) rootPath = null;
      } catch {
        rootPath = null;
      }
    }

    if (!rootPath) selectedPath = null;
  } catch {}
}

async function saveState() {
  await fsp.mkdir(path.dirname(stateFile()), { recursive: true });
  await fsp.writeFile(stateFile(), JSON.stringify({ rootPath, selectedPath }, null, 2), "utf8");
}

function relativeSafe(relativePath) {
  if (!rootPath || typeof relativePath !== "string") throw new Error("No folder is open.");

  const clean = path.normalize(relativePath);
  if (path.isAbsolute(clean)) throw new Error("Expected a relative file path.");

  const base = path.resolve(rootPath);
  const full = path.resolve(base, clean);

  if (full !== base && !full.startsWith(base + path.sep)) {
    throw new Error("Invalid file path.");
  }

  return full;
}

async function existingPath(relativePath) {
  const full = relativeSafe(relativePath);
  await fsp.access(full, fs.constants.F_OK);
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

  let entries;
  try {
    entries = await fsp.readdir(dir, { withFileTypes: true });
  } catch {
    return null;
  }

  entries.sort((a, b) => a.name.localeCompare(b.name, undefined, {
    numeric: true,
    sensitivity: "base",
  }));

  const folders = [];
  const files = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = relative ? path.join(relative, entry.name) : entry.name;

    if (entry.isDirectory()) {
      const child = await scanFolder(full, rel);
      if (child) folders.push(child);
      continue;
    }

    try {
      const stat = await fsp.stat(full);
      files.push({
        name: entry.name,
        path: rel.split(path.sep).join("/"),
        type: typeOf(full),
        size: stat.size,
        modifiedAt: stat.mtimeMs,
      });
    } catch {}
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
  changeTimer = setTimeout(() => {
    mainWindow?.webContents.send("folder:changed");
  }, 250);
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

  rootPath = path.resolve(result.filePaths[0]);
  selectedPath = null;
  lastExportPath = null;
  await saveState();
  startWatcher();

  return { rootPath, tree: await scanFolder() };
}

async function existingDirectory(relativePath = "") {
  const full = await existingPath(relativePath);
  const stat = await fsp.stat(full);

  if (!stat.isDirectory()) throw new Error("The selected location is not a folder.");
  return full;
}

function validateNewItemName(value, kind) {
  if (typeof value !== "string") throw new Error(`Invalid ${kind} name.`);

  const name = value.trim();

  if (!name || name === "." || name === "..") {
    throw new Error(`Enter a valid ${kind} name.`);
  }

  if (/[<>:"/\\|?*\u0000-\u001F]/.test(name) || /[ .]$/.test(name)) {
    throw new Error(`The ${kind} name contains invalid characters.`);
  }

  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i.test(name)) {
    throw new Error(`The ${kind} name is reserved by Windows.`);
  }

  return name;
}

async function createFolder(relativeParent, name) {
  const parent = await existingDirectory(relativeParent || "");
  const safeName = validateNewItemName(name, "folder");
  const full = path.join(parent, safeName);

  try {
    await fsp.mkdir(full);
  } catch (error) {
    if (error?.code === "EEXIST") {
      return { ok: false, message: "A folder with this name already exists." };
    }
    throw error;
  }

  scheduleChange();
  return {
    ok: true,
    path: path.relative(rootPath, full).split(path.sep).join("/"),
  };
}

async function createFile(relativeParent, name) {
  const parent = await existingDirectory(relativeParent || "");
  const safeName = validateNewItemName(name, "file");
  const full = path.join(parent, safeName);

  try {
    await fsp.writeFile(full, "", { encoding: "utf8", flag: "wx" });
  } catch (error) {
    if (error?.code === "EEXIST") {
      return { ok: false, message: "A file with this name already exists." };
    }
    throw error;
  }

  scheduleChange();
  return {
    ok: true,
    path: path.relative(rootPath, full).split(path.sep).join("/"),
  };
}

async function openRootInExplorer() {
  if (!rootPath) throw new Error("No folder is open.");

  try {
    const error = await shell.openPath(rootPath);
    return error ? { ok: false, message: error } : { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not open the folder.",
    };
  }
}

async function deleteItem(relativePath) {
  if (!rootPath) throw new Error("No folder is open.");

  const full = await existingPath(relativePath);
  const cleanRelative = path.relative(rootPath, full);

  if (
    !cleanRelative ||
    cleanRelative === "." ||
    path.isAbsolute(cleanRelative)
  ) {
    throw new Error("The opened root folder itself cannot be deleted.");
  }

  const stat = await fsp.lstat(full);
  const confirmation = await dialog.showMessageBox(mainWindow, {
    type: "warning",
    title: "Delete item",
    message: `Delete "${path.basename(full)}"?`,
    detail: stat.isDirectory()
      ? "The folder and all of its contents will be permanently deleted."
      : "This file will be permanently deleted.",
    buttons: ["Cancel", "Delete"],
    defaultId: 0,
    cancelId: 0,
    noLink: true,
  });

  if (confirmation.response !== 1) {
    return { ok: true, canceled: true };
  }

  await fsp.rm(full, {
    recursive: stat.isDirectory(),
    force: false,
  });

  const deletedPath = cleanRelative.split(path.sep).join("/");
  if (
    selectedPath === deletedPath ||
    (selectedPath && selectedPath.startsWith(deletedPath + "/"))
  ) {
    selectedPath = null;
    await saveState();
  }

  scheduleChange();

  return {
    ok: true,
    path: deletedPath,
  };
}

async function readFile(relativePath) {
  const full = await existingPath(relativePath);
  const stat = await fsp.stat(full);
  const type = typeOf(full);

  if (!PREVIEW_TYPES.has(type)) {
    throw new Error("This file opens with the default desktop application.");
  }

  const buffer = await fsp.readFile(full);
  const ext = path.extname(full).toLowerCase();

  return {
    type,
    mimeType: type === "image"
      ? (imageMime[ext] || "application/octet-stream")
      : (MIME[type] || "application/octet-stream"),
    base64: buffer.toString("base64"),
    size: stat.size,
    modifiedAt: stat.mtimeMs,
  };
}

async function searchFiles(query) {
  if (!rootPath || !query.trim()) return [];

  const q = query.trim().toLowerCase();
  const tree = await scanFolder();
  if (!tree) return [];

  const results = [];

  async function walk(folder) {
    for (const file of folder.files) {
      const pathMatch = file.path.toLowerCase().includes(q) || file.name.toLowerCase().includes(q);

      if (pathMatch) {
        results.push({
          ...file,
          match: file.name.toLowerCase().includes(q) ? "name" : "path",
        });
        continue;
      }

      if (file.type === "markdown" || file.type === "text" || file.type === "code") {
        try {
          const content = await fsp.readFile(relativeSafe(file.path), "utf8");
          if (content.toLowerCase().includes(q)) {
            results.push({ ...file, match: "content" });
          }
        } catch {}
      }
    }

    for (const child of folder.folders) await walk(child);
  }

  await walk(tree);
  return results.slice(0, 100);
}

function vscodeUri(fullPath) {
  const normalized = fullPath.replaceAll("\\", "/");
  const encoded = normalized.split("/").map((segment) => encodeURIComponent(segment)).join("/");
  return `vscode://file/${encoded}`;
}

function findVSCodeExecutable() {
  const candidates = [
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "Programs", "Microsoft VS Code", "Code.exe"),
    process.env.ProgramFiles && path.join(process.env.ProgramFiles, "Microsoft VS Code", "Code.exe"),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "Programs", "Microsoft VS Code Insiders", "Code - Insiders.exe"),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "Programs", "Microsoft VS Code Insiders", "Code.exe"),
    process.env.ProgramFiles && path.join(process.env.ProgramFiles, "Microsoft VS Code Insiders", "Code - Insiders.exe"),
    process.env.ProgramFiles && path.join(process.env.ProgramFiles, "Microsoft VS Code Insiders", "Code.exe"),
    process.env["ProgramFiles(x86)"] && path.join(process.env["ProgramFiles(x86)"], "Microsoft VS Code", "Code.exe"),
  ].filter(Boolean);

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

function findVSCodeCli() {
  if (process.platform !== "win32") return null;

  try {
    const output = execFileSync("where.exe", ["code"], {
      encoding: "utf8",
      windowsHide: true,
    });

    return output.split(/\r?\n/).map((value) => value.trim()).find(Boolean) ?? null;
  } catch {
    return null;
  }
}

function spawnDetached(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
      ...options,
    });

    child.once("error", (error) => resolve({
      ok: false,
      message: error instanceof Error ? error.message : "Could not launch application.",
    }));

    child.once("spawn", () => {
      child.unref();
      resolve({ ok: true });
    });
  });
}

async function openInEditor(relativePath) {
  const full = await existingPath(relativePath);

  if (process.platform === "win32") {
    const executable = findVSCodeExecutable();
    if (executable) {
      const result = await spawnDetached(executable, [full]);
      if (result.ok) return { ...result, method: "vscode-exe" };
    }

    const cli = findVSCodeCli();
    if (cli) {
      const result = await spawnDetached("cmd.exe", [
        "/d",
        "/s",
        "/c",
        `"${cli}" "${full}"`,
      ]);
      if (result.ok) return { ...result, method: "vscode-cli" };
    }
  } else {
    const result = await spawnDetached("code", [full], { windowsHide: false });
    if (result.ok) return { ...result, method: "vscode-cli" };
  }

  try {
    await shell.openExternal(vscodeUri(full));
    return { ok: true, method: "vscode-protocol" };
  } catch {}

  const error = await shell.openPath(full);
  return error ? { ok: false, message: error } : { ok: true, method: "default-app" };
}

async function revealRelative(relativePath) {
  const full = await existingPath(relativePath);

  try {
    shell.showItemInFolder(full);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not open the folder.",
    };
  }
}

async function revealAbsolute(absolutePath) {
  if (typeof absolutePath !== "string" || !path.isAbsolute(absolutePath)) {
    throw new Error("Expected an absolute path.");
  }

  if (!lastExportPath || path.resolve(absolutePath) !== path.resolve(lastExportPath)) {
    throw new Error("This export path is no longer available.");
  }

  await fsp.access(absolutePath, fs.constants.F_OK);

  try {
    shell.showItemInFolder(absolutePath);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not open the folder.",
    };
  }
}

async function openDefault(relativePath) {
  const full = await existingPath(relativePath);
  const error = await shell.openPath(full);
  return error ? { ok: false, message: error } : { ok: true };
}

async function openExternalUrl(url) {
  if (typeof url !== "string") throw new Error("Invalid external URL.");

  const parsed = new URL(url);
  if (!["http:", "https:", "mailto:"].includes(parsed.protocol)) {
    throw new Error("Only web and mail links can be opened externally.");
  }

  await shell.openExternal(url);
  return { ok: true };
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
          totalBytes += (await fsp.stat(full)).size;
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
    defaultPath: path.join(
      app.getPath("downloads"),
      `${path.basename(rootPath)}-backup.zip`,
    ),
    filters: [{ name: "ZIP archive", extensions: ["zip"] }],
  });

  if (result.canceled || !result.filePath) return { ok: false, canceled: true };

  const outputPath = path.resolve(result.filePath);
  lastExportPath = null;

  sendExportProgress({
    status: "preparing",
    percent: 0,
    processedBytes: 0,
    totalBytes: 0,
    processedFiles: 0,
    totalFiles: 0,
  });

  try {
    const stats = await collectFolderStats(rootPath);

    await new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const archive = archiver("zip", { zlib: { level: 9 } });
      let settled = false;

      const fail = (error) => {
        if (!settled) {
          settled = true;
          reject(error);
        }
      };

      output.once("error", fail);
      archive.once("error", fail);

      archive.on("progress", (progress) => {
        const processedBytes = progress.fs?.processedBytes ?? 0;
        const processedFiles = progress.entries?.processed ?? 0;
        const percent = stats.totalBytes > 0
          ? Math.min(99, Math.floor((processedBytes / stats.totalBytes) * 100))
          : Math.min(99, Math.floor(
              (processedFiles / Math.max(stats.totalFiles, 1)) * 100,
            ));

        sendExportProgress({
          status: "compressing",
          percent,
          processedBytes,
          totalBytes: stats.totalBytes,
          processedFiles,
          totalFiles: stats.totalFiles,
        });
      });

      output.once("close", () => {
        if (!settled) {
          settled = true;
          resolve();
        }
      });

      archive.pipe(output);
      archive.directory(rootPath, path.basename(rootPath));
      void archive.finalize().catch(fail);
    });

    lastExportPath = outputPath;

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
    const message = error instanceof Error ? error.message : "Export failed.";
    lastExportPath = null;
    sendExportProgress({ status: "error", percent: 0, message });
    return { ok: false, message };
  }
}

function registerIpc() {
  ipcMain.handle("state:get", () => ({ rootPath, selectedPath }));

  ipcMain.handle("state:selected", async (_event, value) => {
    selectedPath = typeof value === "string" ? value : null;
    await saveState();
  });

  ipcMain.handle("folder:open", chooseFolder);
  ipcMain.handle("folder:create", (_event, relativeParent, name) => createFolder(relativeParent, name));
  ipcMain.handle("file:create", (_event, relativeParent, name) => createFile(relativeParent, name));
  ipcMain.handle("item:delete", (_event, relativePath) => deleteItem(relativePath));
  ipcMain.handle("root:openInExplorer", openRootInExplorer);
  ipcMain.handle("folder:scan", () => rootPath ? scanFolder() : null);
  ipcMain.handle("file:read", (_event, relativePath) => readFile(relativePath));
  ipcMain.handle("file:search", (_event, query) => searchFiles(query));
  ipcMain.handle("file:edit", (_event, relativePath) => openInEditor(relativePath));
  ipcMain.handle("file:reveal", (_event, relativePath) => revealRelative(relativePath));
  ipcMain.handle("export:reveal", (_event, absolutePath) => revealAbsolute(absolutePath));
  ipcMain.handle("file:openDefault", (_event, relativePath) => openDefault(relativePath));
  ipcMain.handle("shell:openExternal", (_event, url) => openExternalUrl(url));
  ipcMain.handle("folder:export", exportFolder);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 620,
    backgroundColor: "#090b0f",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.maximize();

  if (process.platform === "win32" || process.platform === "linux") {
    mainWindow.removeMenu();
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^(https?|mailto):/i.test(url)) {
      void shell.openExternal(url);
    }
    return { action: "deny" };
  });

  mainWindow.loadURL(app.isPackaged ? "simple-docs://app/" : "http://localhost:3000");
}

app.whenReady().then(async () => {
  await loadState();
  registerIpc();
  if (app.isPackaged) registerAppProtocol();
  createWindow();
  startWatcher();
  setupAutoUpdater();
});

app.on("window-all-closed", () => {
  clearTimeout(changeTimer);
  watcher?.close();
  if (process.platform !== "darwin") app.quit();
});
