"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { desktop, isDesktopAvailable } from "@/lib/desktop-api";
import type { DocFile, DocFolder, SearchResult } from "@/types/docs";
import { DocsHeader } from "./docs-header";
import { DocsSidebar } from "./docs-sidebar";
import { ExportStatus } from "./export-status";
import { NewItemDialog } from "./new-item-dialog";
import { FileViewer } from "./file-viewer";

function findFile(folder: DocFolder | null, target: string | null): DocFile | null {
  if (!folder || !target) return null;

  const direct = folder.files.find((file) => file.path === target);
  if (direct) return direct;

  for (const child of folder.folders) {
    const match = findFile(child, target);
    if (match) return match;
  }

  return null;
}

export function DocsApp() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [tree, setTree] = useState<DocFolder | null>(null);
  const [rootPath, setRootPath] = useState<string | null>(null);
  const [selected, setSelected] = useState<DocFile | null>(null);
  const selectedPathRef = useRef<string | null>(null);
  const [selectedAnchor, setSelectedAnchor] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState<"idle" | "preparing" | "compressing" | "complete" | "error">("idle");
  const [exportPath, setExportPath] = useState<string | null>(null);
  const [exportMessage, setExportMessage] = useState("");
  const [creationType, setCreationType] = useState<"folder" | "file" | null>(null);
  const [creationParentPath, setCreationParentPath] = useState("");
  const [creationName, setCreationName] = useState("");
  const [creationError, setCreationError] = useState("");
  const [creationBusy, setCreationBusy] = useState(false);

  useEffect(() => {
    if (!mounted || !isDesktopAvailable()) return;

    let active = true;

    desktop.getState()
      .then(async (state) => {
        if (!active) return;

        setRootPath(state.rootPath);
        const next = await desktop.scan();
        if (!active) return;

        setTree(next);
        const file = findFile(next, state.selectedPath);
        setSelected(file);
        selectedPathRef.current = file?.path ?? null;
        setSelectedAnchor(null);
      })
      .catch(() => active && setTree(null));

    const offFolder = desktop.onFolderChanged(async () => {
      const current = selectedPathRef.current;

      try {
        const next = await desktop.scan();
        if (!active) return;

        setTree(next);
        const file = findFile(next, current);
        setSelected(file);
        selectedPathRef.current = file?.path ?? null;
      } catch {}
    });

    const offExport = desktop.onExportProgress((payload) => {
      if (!active) return;

      setExportProgress(payload.percent);
      setExportStatus(payload.status);

      if (payload.status === "complete") {
        setExporting(false);
        setExportPath(payload.path ?? null);
        setExportMessage("ZIP backup is ready.");
      }

      if (payload.status === "error") {
        setExporting(false);
        setExportPath(null);
        setExportMessage(payload.message ?? "Export failed.");
      }
    });

    return () => {
      active = false;
      offFolder();
      offExport();
    };
  }, [mounted]);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (!value.trim()) setResults([]);
  }

  useEffect(() => {
    if (!isDesktopAvailable()) return;

    const q = query.trim();
    if (!q) return;

    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const found = await desktop.search(q);
        if (active) setResults(found.slice(0, 50));
      } catch {
        if (active) setResults([]);
      }
    }, 180);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query]);

  function openCreateDialog(type: "folder" | "file", parentPath: string) {
    setCreationType(type);
    setCreationParentPath(parentPath);
    setCreationName(type === "folder" ? "New Folder" : "new-file.md");
    setCreationError("");
  }

  function closeCreateDialog() {
    if (creationBusy) return;

    setCreationType(null);
    setCreationParentPath("");
    setCreationName("");
    setCreationError("");
  }

  async function refreshAfterCreation(createdPath?: string, selectCreatedFile = false) {
    const next = await desktop.scan();
    if (!next) return;

    setTree(next);

    if (selectCreatedFile && createdPath) {
      const createdFile = findFile(next, createdPath);
      if (createdFile) selectFile(createdFile);
    }
  }

  async function deleteRootItem(relativePath: string) {
    try {
      const result = await desktop.deleteRootItem(relativePath);
      if (!result.ok || result.canceled) return;

      const deletedPath = relativePath.replaceAll("\\", "/");
      const currentPath = selectedPathRef.current;
      const selectionDeleted = !!currentPath && (
        currentPath === deletedPath ||
        currentPath.startsWith(deletedPath + "/")
      );

      const next = await desktop.scan();
      setTree(next);

      if (selectionDeleted) {
        setSelected(null);
        selectedPathRef.current = null;
        setSelectedAnchor(null);
        await desktop.setSelectedFile(null);
      }
    } catch {}
  }

  async function submitCreateDialog() {
    const name = creationName.trim();
    if (!creationType) return;

    if (!name) {
      setCreationError("Enter a name.");
      return;
    }

    setCreationBusy(true);
    setCreationError("");

    try {
      const result = creationType === "folder"
        ? await desktop.createFolder(creationParentPath, name)
        : await desktop.createFile(creationParentPath, name);

      if (!result.ok) {
        setCreationError(result.message ?? "Could not create the item.");
        return;
      }

      await refreshAfterCreation(
        result.path,
        creationType === "file",
      );
      setCreationType(null);
      setCreationParentPath("");
      setCreationName("");
      setCreationError("");
    } catch (error) {
      setCreationError(
        error instanceof Error ? error.message : "Could not create the item.",
      );
    } finally {
      setCreationBusy(false);
    }
  }

  async function openFolder() {
    setBusy(true);

    try {
      const result = await desktop.openFolder();
      setTree(result.tree);
      setRootPath(result.rootPath);
      setSelected(null);
      selectedPathRef.current = null;
      setSelectedAnchor(null);
      setQuery("");
      setResults([]);
      setMobileOpen(false);
    } finally {
      setBusy(false);
    }
  }

  function selectFile(file: DocFile, anchor: string | null = null) {
    setSelected(file);
    selectedPathRef.current = file.path;
    setSelectedAnchor(anchor);
    void desktop.setSelectedFile(file.path);
    setMobileOpen(false);
  }

  function navigateTo(path: string, anchor: string | null) {
    const file = findFile(tree, path);
    if (!file) return;
    selectFile(file, anchor);
  }

  async function editFile(file: DocFile) {
    setSelectedAnchor(null);

    try {
      const result = await desktop.openInEditor(file.path);

      if (!result.ok) {
        window.alert(result.message ?? "Could not open VS Code.");
      }
    } catch (reason) {
      window.alert(reason instanceof Error ? reason.message : "Could not open VS Code.");
    }
  }

  async function exportZip() {
    setExportPath(null);
    setExportMessage("");
    setExportProgress(0);
    setExportStatus("preparing");
    setExporting(true);

    try {
      const result = await desktop.exportZip();

      if (result.canceled) {
        setExporting(false);
        setExportStatus("idle");
      } else if (!result.ok) {
        setExporting(false);
        setExportStatus("error");
        setExportMessage(result.message ?? "Export failed.");
      }
    } catch (error) {
      setExporting(false);
      setExportStatus("error");
      setExportMessage(error instanceof Error ? error.message : "Export failed.");
    }
  }

  if (!mounted) return <div className="h-screen bg-bg" />;

  if (!isDesktopAvailable()) {
    return (
      <div className="flex h-screen items-center justify-center p-8 text-center">
        <div>
          <h1 className="text-2xl font-semibold">Simple Docs</h1>
          <p className="mt-2 text-sm text-muted">
            Run the desktop app with <code>npm run dev</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-bg text-text">
      <DocsHeader
        query={query}
        results={results}
        exporting={exporting}
        hasFolder={!!rootPath}
        mobileOpen={mobileOpen}
        onQueryChange={handleQueryChange}
        onSelectResult={(file) => {
          selectFile(file);
          setQuery("");
        }}
        onExport={() => void exportZip()}
        onToggleMobile={() => setMobileOpen((value) => !value)}
      />

      <NewItemDialog
        type={creationType}
        parentPath={creationParentPath}
        name={creationName}
        error={creationError}
        busy={creationBusy}
        onNameChange={(value) => {
          setCreationName(value);
          if (creationError) setCreationError("");
        }}
        onSubmit={() => void submitCreateDialog()}
        onClose={closeCreateDialog}
      />

      <ExportStatus
        status={exportStatus}
        progress={exportProgress}
        message={exportMessage}
        path={exportPath}
        onShow={() => {
          if (!exportPath) return;

          void desktop.revealExport(exportPath).then((result) => {
            if (!result.ok) setExportMessage(result.message ?? "Could not open the folder.");
          }).catch((reason) => {
            setExportMessage(reason instanceof Error ? reason.message : "Could not open the folder.");
          });
        }}
        onDismiss={() => {
          setExportStatus("idle");
          setExportPath(null);
          setExportMessage("");
        }}
      />

      <div className="flex min-h-0 flex-1">
        <DocsSidebar
          tree={tree}
          rootPath={rootPath}
          selectedPath={selected?.path ?? null}
          mobileOpen={mobileOpen}
          busy={busy}
          onSelect={selectFile}
          onOpenFolder={() => void openFolder()}
          onCreateFolder={(parentPath) => openCreateDialog("folder", parentPath)}
          onCreateFile={(parentPath) => openCreateDialog("file", parentPath)}
          onDeleteRootItem={(relativePath) => void deleteRootItem(relativePath)}
          onOpenRootInExplorer={async () => {
            if (!rootPath) return;
            const result = await desktop.openRootInExplorer();
            if (!result.ok) {
              setExportMessage(result.message ?? "Could not open the folder.");
            }
          }}
        />

        {mobileOpen && (
          <button
            className="fixed inset-0 z-20 bg-black/35 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close file explorer"
          />
        )}

        <main className="min-w-0 flex-1 overflow-hidden bg-bg">
          <FileViewer
            key={selected ? selected.path + ":" + selected.modifiedAt + ":" + selected.size : "empty"}
            file={selected}
            anchor={selectedAnchor}
            onEdit={editFile}
            onNavigate={navigateTo}
          />
        </main>
      </div>
    </div>
  );
}
