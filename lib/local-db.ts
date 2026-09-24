import Dexie, { type EntityTable } from "dexie";
import type { StoredFile, StoredFolder } from "@/types/docs";

class SokaraDatabase extends Dexie {
  files!: EntityTable<StoredFile, "id">;
  folders!: EntityTable<StoredFolder, "path">;
  constructor() {
    super("sokara-docs");
    this.version(1).stores({ files: "id, path, name, type, modifiedAt", folders: "path, createdAt" });
  }
}
export const db = new SokaraDatabase();

export async function ensureLibrarySeed() {
  if (typeof window === "undefined" || await db.files.count()) return;
  const now = Date.now();
  await db.files.bulkAdd([
    {id:crypto.randomUUID(),name:"Welcome.md",path:"Welcome.md",type:"markdown",mimeType:"text/markdown",size:0,modifiedAt:now,blob:new Blob(["# Welcome to Sokara Docs\n\nThis is your personal offline-first learning library.\n\nUse Import to add your Markdown, TXT, PDF, and image files.\n"],{type:"text/markdown"})},
    {id:crypto.randomUUID(),name:"Getting Started.md",path:"Notes/Getting Started.md",type:"markdown",mimeType:"text/markdown",size:0,modifiedAt:now,blob:new Blob(["# Getting Started\n\nYour documents live locally in IndexedDB. Cloud storage is optional.\n"],{type:"text/markdown"})}
  ]);
  await db.folders.put({path:"Notes",createdAt:now});
}

export async function readFileBlob(id:string){return (await db.files.get(id))?.blob??null;}
export async function saveFileContent(id:string,content:string){
  const file=await db.files.get(id); if(!file)throw new Error("File not found");
  const blob=new Blob([content],{type:file.mimeType||"text/plain"});
  await db.files.update(id,{blob,size:blob.size,modifiedAt:Date.now()});
}
export async function createFolder(path:string){
  const clean=normalizePath(path); if(!clean)throw new Error("Folder name is required");
  if(await db.folders.get(clean))throw new Error("Folder already exists");
  const parts=clean.split("/");
  for(let i=1;i<=parts.length;i++)await db.folders.put({path:parts.slice(0,i).join("/"),createdAt:Date.now()});
}
export async function createTextFile(name:string,folder:string,type:"markdown"|"text"){
  const fileName=name.includes(".")?name:name+(type==="markdown"?".md":".txt"); const path=joinPath(folder,fileName);
  if(await db.files.where("path").equals(path).count())throw new Error("File already exists");
  const mimeType=type==="markdown"?"text/markdown":"text/plain"; const blob=new Blob([""],{type:mimeType});
  const record:StoredFile={id:crypto.randomUUID(),name:fileName,path,type,mimeType,size:0,modifiedAt:Date.now(),blob};
  await db.files.add(record); return record;
}
export async function importBrowserFiles(files:FileList|File[],destination=""){
  for(const file of Array.from(files)){
    const relative=(file as File & {webkitRelativePath?:string}).webkitRelativePath;
    const path=normalizePath(relative||joinPath(destination,file.name)); const name=path.split("/").pop()||file.name; const type=typeFromName(name);
    if(!type)continue;
    const parts=path.split("/").slice(0,-1); for(let i=1;i<=parts.length;i++)await db.folders.put({path:parts.slice(0,i).join("/"),createdAt:Date.now()});
    const existing=await db.files.where("path").equals(path).first();
    await db.files.put({id:existing?.id||crypto.randomUUID(),name,path,type,mimeType:file.type||mimeFor(type),size:file.size,modifiedAt:file.lastModified||Date.now(),blob:file});
  }
}
export async function renameFile(id:string,name:string){
  const file=await db.files.get(id);if(!file)throw new Error("File not found");const clean=name.trim();if(!clean)throw new Error("Name is required");
  const path=joinPath(file.path.split("/").slice(0,-1).join("/"),clean);const conflict=await db.files.where("path").equals(path).first();if(conflict&&conflict.id!==id)throw new Error("A file with that name already exists");
  await db.files.update(id,{name:clean,path,modifiedAt:Date.now()});
}
export async function moveFile(id:string,folder:string){
  const file=await db.files.get(id);if(!file)throw new Error("File not found");const path=joinPath(normalizePath(folder),file.name);const conflict=await db.files.where("path").equals(path).first();if(conflict&&conflict.id!==id)throw new Error("A file with that name already exists");await db.files.update(id,{path,modifiedAt:Date.now()});
}
async function remapTree(path:string,nextRoot:string){
  const [files,folders]=await Promise.all([db.files.toArray(),db.folders.toArray()]);
  const af=files.filter(f=>f.path===path||f.path.startsWith(path+"/")); const ad=folders.filter(f=>f.path===path||f.path.startsWith(path+"/"));
  await db.transaction("rw",db.files,db.folders,async()=>{for(const f of af)await db.files.update(f.id,{path:nextRoot+f.path.slice(path.length),modifiedAt:Date.now()});for(const f of ad)await db.folders.delete(f.path);for(const f of ad)await db.folders.put({path:nextRoot+f.path.slice(path.length),createdAt:f.createdAt})});
}
export async function renameFolder(path:string,name:string){const clean=name.trim();if(!clean)throw new Error("Name is required");const next=joinPath(path.split("/").slice(0,-1).join("/"),clean);if(next!==path)await remapTree(path,next);}
export async function moveFolder(path:string,destination:string){const name=path.split("/").pop()||path;const next=joinPath(normalizePath(destination),name);if(next===path||next.startsWith(path+"/"))throw new Error("Invalid destination");await remapTree(path,next);}
export async function deleteFile(id:string){await db.files.delete(id);}
export async function deleteFolder(path:string){const [files,folders]=await Promise.all([db.files.toArray(),db.folders.toArray()]);await db.transaction("rw",db.files,db.folders,async()=>{for(const f of files)if(f.path===path||f.path.startsWith(path+"/"))await db.files.delete(f.id);for(const f of folders)if(f.path===path||f.path.startsWith(path+"/"))await db.folders.delete(f.path);});}
export function normalizePath(value:string){return value.replaceAll("\\","/").split("/").filter(Boolean).join("/");}
export function joinPath(a:string,b:string){return[a,b].filter(Boolean).join("/");}
export function typeFromName(name:string):StoredFile["type"]|null{const ext=name.split(".").pop()?.toLowerCase();if(ext==="md")return"markdown";if(ext==="txt")return"text";if(ext==="pdf")return"pdf";if(["png","jpg","jpeg","webp","gif","svg"].includes(ext||""))return"image";return null;}
function mimeFor(type:StoredFile["type"]){if(type==="markdown")return"text/markdown";if(type==="text")return"text/plain";if(type==="pdf")return"application/pdf";if(type==="image")return"application/octet-stream";return"application/octet-stream";}
export async function makeStoragePersistent(){if(navigator.storage?.persist)try{await navigator.storage.persist()}catch{}}
