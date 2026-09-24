const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("simpleDocs", {
  getState: () => ipcRenderer.invoke("state:get"),
  openFolder: () => ipcRenderer.invoke("folder:open"),
  scan: () => ipcRenderer.invoke("folder:scan"),
  readFile: (relativePath) => ipcRenderer.invoke("file:read", relativePath),
  search: (query) => ipcRenderer.invoke("file:search", query),
  openInEditor: (relativePath) => ipcRenderer.invoke("file:edit", relativePath),
  revealInExplorer: (relativePath) => ipcRenderer.invoke("file:reveal", relativePath),
  openDefault: (relativePath) => ipcRenderer.invoke("file:openDefault", relativePath),
  exportZip: () => ipcRenderer.invoke("folder:export"),
  setSelectedFile: (relativePath) => ipcRenderer.invoke("state:selected", relativePath),
  onFolderChanged: (callback) => {
    const listener = () => callback();
    ipcRenderer.on("folder:changed", listener);
    return () => ipcRenderer.removeListener("folder:changed", listener);
  },
  onExportProgress: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("export:progress", listener);
    return () => ipcRenderer.removeListener("export:progress", listener);
  },
});
