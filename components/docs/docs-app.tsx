"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { FilePlus2, FolderPlus, Library, Menu, Move, Pencil, Plus, Search, Settings, Trash2, Upload, Download, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { db, ensureLibrarySeed, importBrowserFiles, createFolder, createTextFile, deleteFile, deleteFolder, moveFile, moveFolder, renameFile, renameFolder } from "@/lib/local-db";
import { exportFile, exportFolder } from "@/lib/backup";
import { FileTree } from "./file-tree";
import { FileViewer } from "./file-viewer";
import { Editor } from "./editor";
import { SettingsPanel } from "./settings-panel";
import type { DocFile, DocFolder, StoredFile } from "@/types/docs";

function buildTree(files:StoredFile[],paths:string[]):DocFolder{
  const root:DocFolder={name:"Library",path:"",folders:[],files:[]};
  function folder(path:string){if(!path)return root;let cur=root,built="";for(const part of path.split("/")){built=built?built+"/"+part:part;let child=cur.folders.find(f=>f.path===built);if(!child){child={name:part,path:built,folders:[],files:[]};cur.folders.push(child)}cur=child}return cur}
  paths.forEach(folder);
  files.forEach(f=>folder(f.path.split("/").slice(0,-1).join("/")).files.push({id:f.id,name:f.name,path:f.path,type:f.type,size:f.size,modifiedAt:f.modifiedAt}));
  function sort(f:DocFolder){f.folders.sort((a,b)=>a.name.localeCompare(b.name,{numeric:true}));f.files.sort((a,b)=>a.name.localeCompare(b.name,{numeric:true}));f.folders.forEach(sort)} sort(root);return root;
}

export function DocsApp(){
  const [ready,setReady]=useState(false),[selected,setSelected]=useState<DocFile|null>(null),[editing,setEditing]=useState<DocFile|null>(null),[settings,setSettings]=useState(false),[mobileOpen,setMobileOpen]=useState(false),[query,setQuery]=useState(""),[matches,setMatches]=useState<DocFile[]>([]),[dark,setDark]=useState(true);
  const fileInput=useRef<HTMLInputElement>(null),folderInput=useRef<HTMLInputElement>(null);
  useEffect(()=>{ensureLibrarySeed().then(()=>setReady(true));const t=localStorage.getItem("sokara-theme");setDark(t!=="light")},[]);
  useEffect(()=>{document.documentElement.classList.toggle("dark",dark);localStorage.setItem("sokara-theme",dark?"dark":"light")},[dark]);
  const files=useLiveQuery(()=>db.files.toArray(),[],[]);
  const folders=useLiveQuery(()=>db.folders.toArray(),[],[]);
  const tree=useMemo(()=>buildTree(files||[],(folders||[]).map(f=>f.path)),[files,folders]);

  useEffect(()=>{
    let active=true; const run=async()=>{const q=query.trim().toLowerCase();if(!q){setMatches([]);return}const out:DocFile[]=[];for(const f of files||[]){if(f.name.toLowerCase().includes(q)||f.path.toLowerCase().includes(q)){out.push({id:f.id,name:f.name,path:f.path,type:f.type,size:f.size,modifiedAt:f.modifiedAt});continue}if(f.type==="markdown"||f.type==="text"){const text=await f.blob.text();if(text.toLowerCase().includes(q))out.push({id:f.id,name:f.name,path:f.path,type:f.type,size:f.size,modifiedAt:f.modifiedAt})}}if(active)setMatches(out.slice(0,50))};void run();return()=>{active=false}
  },[query,files]);

  useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="p"){e.preventDefault();document.getElementById("docs-search")?.focus()}if((e.ctrlKey||e.metaKey)&&e.shiftKey&&e.key.toLowerCase()==="f"){e.preventDefault();document.getElementById("docs-search")?.focus()}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="b"){e.preventDefault();setMobileOpen(v=>!v)}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="o"){e.preventDefault();folderInput.current?.click()}};window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey)},[]);

  function selectFile(f:DocFile){setSelected(f);setEditing(null);setSettings(false);setMobileOpen(false)}
  async function importFiles(list:FileList|null){if(list)await importBrowserFiles(list);setQuery("")}
  async function newFolder(){const name=window.prompt("Folder name");if(!name)return;const parent=selected?.path.split("/").slice(0,-1).join("/")||"";try{await createFolder([parent,name].filter(Boolean).join("/"))}catch(e){alert(e instanceof Error?e.message:"Could not create folder")}}
  async function newFile(type:"markdown"|"text"){const name=window.prompt(type==="markdown"?"Markdown file name":"Text file name");if(!name)return;const parent=selected?.path.split("/").slice(0,-1).join("/")||"";try{const f=await createTextFile(name,parent,type);selectFile({id:f.id,name:f.name,path:f.path,type:f.type,size:f.size,modifiedAt:f.modifiedAt});setEditing({id:f.id,name:f.name,path:f.path,type:f.type,size:f.size,modifiedAt:f.modifiedAt})}catch(e){alert(e instanceof Error?e.message:"Could not create file")}}
  async function folderAction(folder:DocFolder){const action=window.prompt("Folder action: rename, move, export, delete");if(!action)return;try{if(action==="rename"){const n=window.prompt("New folder name",folder.name);if(n)await renameFolder(folder.path,n)}else if(action==="move"){const d=window.prompt("Destination folder path (empty = root)","");if(d!==null)await moveFolder(folder.path,d)}else if(action==="export")await exportFolder(folder.path);else if(action==="delete"&&confirm("Delete "+folder.path+" and everything inside it?"))await deleteFolder(folder.path)}catch(e){alert(e instanceof Error?e.message:"Operation failed")}}
  async function fileAction(action:string){if(!selected)return;try{if(action==="rename"){const n=window.prompt("New file name",selected.name);if(n)await renameFile(selected.id,n)}else if(action==="move"){const d=window.prompt("Destination folder path (empty = root)","");if(d!==null)await moveFile(selected.id,d)}else if(action==="download")await exportFile(selected.id);else if(action==="delete"&&confirm("Delete "+selected.name+"?")){await deleteFile(selected.id);setSelected(null)}}catch(e){alert(e instanceof Error?e.message:"Operation failed")}}

  if(!ready)return <div className="flex h-screen items-center justify-center text-sm text-[var(--color-muted)]">Loading your library…</div>;
  return <div className="flex h-screen min-h-0 flex-col overflow-hidden">
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2 md:px-4">
      <button className="rounded-md p-2 md:hidden" onClick={()=>setMobileOpen(v=>!v)}>{mobileOpen?<X size={19}/>:<Menu size={19}/>}</button>
      <button onClick={()=>{setSettings(false);setSelected(null)}} className="flex shrink-0 items-center gap-2 font-semibold"><span className="text-[var(--color-brand)]">Sokara</span><span>Docs</span></button>
      <div className="relative ml-auto w-full max-w-xl"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-placeholder)]"/><input id="docs-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search files and notes…" className="h-9 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] pl-9 pr-3 text-sm outline-none focus:border-[var(--color-brand)]"/>
        {query.trim()&&<div className="docs-scroll absolute left-0 right-0 top-11 z-50 max-h-96 overflow-auto rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-xl">{matches.length?matches.map(f=><button key={f.id} onClick={()=>{selectFile(f);setQuery("")}} className="flex w-full flex-col rounded px-3 py-2 text-left hover:bg-[var(--color-surface-soft)]"><span className="truncate text-sm font-medium">{f.name}</span><span className="truncate text-xs text-[var(--color-muted)]">{f.path}</span></button>):<div className="p-3 text-sm text-[var(--color-muted)]">No matches.</div>}</div>}
      </div>
      <button onClick={()=>setSettings(true)} className="rounded-md p-2 hover:bg-[var(--color-surface-soft)]" title="Settings"><Settings size={18}/></button>
    </header>
    <div className="relative flex min-h-0 flex-1">
      <aside className={"absolute inset-y-0 left-0 z-30 w-72 border-r border-[var(--color-border)] bg-[var(--color-bg-elevated)] transition-transform md:static md:translate-x-0 "+(mobileOpen?"translate-x-0":"-translate-x-full")}>
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-3 py-2"><span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]"><Library size={14} className="mr-1 inline"/>Library</span><div className="flex gap-0.5">
            <button onClick={()=>void newFile("markdown")} className="rounded p-1.5 hover:bg-[var(--color-surface-soft)]" title="New Markdown"><FilePlus2 size={15}/></button><button onClick={newFolder} className="rounded p-1.5 hover:bg-[var(--color-surface-soft)]" title="New Folder"><FolderPlus size={15}/></button><button onClick={()=>fileInput.current?.click()} className="rounded p-1.5 hover:bg-[var(--color-surface-soft)]" title="Import Files"><Upload size={15}/></button><button onClick={()=>folderInput.current?.click()} className="rounded p-1.5 hover:bg-[var(--color-surface-soft)]" title="Import Folder"><Plus size={15}/></button>
          </div></div>
          <div className="docs-scroll min-h-0 flex-1 overflow-auto p-2"><FileTree folder={tree} selectedPath={selected?.path??null} onSelect={selectFile} onFolderAction={folderAction}/></div>
        </div>
      </aside>
      {mobileOpen&&<button className="absolute inset-0 z-20 bg-black/35 md:hidden" onClick={()=>setMobileOpen(false)}/>}
      <main className="min-w-0 flex-1">{settings?<SettingsPanel dark={dark} onToggleTheme={()=>setDark(v=>!v)}/>:editing&&(editing.type==="markdown"||editing.type==="text")?<Editor file={editing} onClose={()=>setEditing(null)}/>:<FileViewer file={selected} onEdit={f=>setEditing(f)}/>}</main>
    </div>
    {selected&&!settings&&!editing&&<div className="fixed bottom-3 right-3 z-40 flex max-w-[calc(100vw-1.5rem)] flex-wrap items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-1 shadow-lg">
      <button onClick={()=>setEditing(selected)} className="rounded px-2 py-1.5 text-xs hover:bg-[var(--color-surface-soft)]"><Pencil size={14} className="mr-1 inline"/>Edit</button><button onClick={()=>void fileAction("download")} className="rounded px-2 py-1.5 text-xs hover:bg-[var(--color-surface-soft)]"><Download size={14} className="mr-1 inline"/>Download</button><button onClick={()=>void fileAction("rename")} className="rounded px-2 py-1.5 text-xs hover:bg-[var(--color-surface-soft)]"><Pencil size={14} className="mr-1 inline"/>Rename</button><button onClick={()=>void fileAction("move")} className="rounded px-2 py-1.5 text-xs hover:bg-[var(--color-surface-soft)]"><Move size={14} className="mr-1 inline"/>Move</button><button onClick={()=>void fileAction("delete")} className="rounded p-1.5 text-red-400 hover:bg-red-500/10"><Trash2 size={14}/></button>
    </div>}
    <input ref={fileInput} hidden type="file" multiple accept=".md,.txt,.pdf,.png,.jpg,.jpeg,.webp,.gif,.svg" onChange={e=>void importFiles(e.target.files)}/><input ref={folderInput} hidden type="file" multiple {...({webkitdirectory:""} as React.InputHTMLAttributes<HTMLInputElement>)} onChange={e=>void importFiles(e.target.files)}/>
  </div>;
}