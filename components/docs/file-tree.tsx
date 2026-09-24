"use client";

import { ChevronDown, ChevronRight, FileCode2, FileImage, FileText, FileType2, Folder, FolderOpen } from "lucide-react";
import { useState } from "react";
import type { DocFile, DocFolder } from "@/types/docs";

const icons={markdown:FileCode2,text:FileText,pdf:FileType2,image:FileImage,other:FileText};

export function FileTree({folder,selectedPath,onSelect,onFolderAction,depth=0}:{folder:DocFolder;selectedPath:string|null;onSelect:(f:DocFile)=>void;onFolderAction?:(folder:DocFolder)=>void;depth?:number}){
  const [open,setOpen]=useState(true);
  return <div>
    {folder.path&&<div className="group flex items-center gap-1 rounded px-1 py-1 text-sm text-[var(--color-soft)] hover:bg-[var(--color-surface-soft)]" style={{paddingLeft:depth*12+4}}><button onClick={()=>setOpen(v=>!v)} className="rounded p-1">{open?<ChevronDown size={14}/>:<ChevronRight size={14}/>}</button><button onClick={()=>setOpen(v=>!v)} className="flex min-w-0 flex-1 items-center gap-2 text-left">{open?<FolderOpen size={16}/>:<Folder size={16}/>}<span className="truncate">{folder.name}</span></button>{onFolderAction&&<button onClick={()=>onFolderAction(folder)} className="rounded px-1.5 text-xs opacity-0 group-hover:opacity-100">•••</button>}</div>}
    {open&&<div>{folder.folders.map(c=><FileTree key={c.path} folder={c} selectedPath={selectedPath} onSelect={onSelect} onFolderAction={onFolderAction} depth={depth+(folder.path?1:0)}/>)}{folder.files.map(f=>{const Icon=icons[f.type];return <button key={f.id} title={f.path} onClick={()=>onSelect(f)} className={"flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm "+(selectedPath===f.path?"bg-[var(--color-brand-soft)] text-[var(--color-brand-strong)]":"text-[var(--color-soft)] hover:bg-[var(--color-surface-soft)]")} style={{paddingLeft:(depth+(folder.path?1:0))*12+24}}><Icon size={15}/><span className="truncate">{f.name}</span></button>})}</div>}
  </div>;
}