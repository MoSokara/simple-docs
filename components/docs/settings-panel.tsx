"use client";

import { Database, Download, HardDrive, Moon, Sun, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { exportBackup, importBackup } from "@/lib/backup";
import { makeStoragePersistent } from "@/lib/local-db";
import { CloudPanel } from "./cloud-panel";

export function SettingsPanel({dark,onToggleTheme}:{dark:boolean;onToggleTheme:()=>void}) {
  const [storage,setStorage]=useState<{usage?:number;quota?:number}>({}); const [persistent,setPersistent]=useState(false);
  useEffect(()=>{void makeStoragePersistent();navigator.storage?.persisted?.().then(setPersistent);navigator.storage?.estimate?.().then(e=>setStorage({usage:e.usage,quota:e.quota}))},[]);
  const mb=(n?:number)=>n?((n/1024/1024).toFixed(1)+" MB"):"—";
  return <div className="docs-scroll h-full overflow-auto p-4 md:p-8"><div className="mx-auto max-w-3xl space-y-5">
    <div><h1 className="text-xl font-semibold">Settings</h1><p className="mt-1 text-sm text-[var(--color-muted)]">Local storage, backup, appearance, and optional cloud.</p></div>
    <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4"><div className="flex items-center justify-between gap-4"><div><h2 className="font-medium">Appearance</h2><p className="mt-1 text-sm text-[var(--color-muted)]">Use a simple light or dark theme.</p></div><button onClick={onToggleTheme} className="rounded-md border border-[var(--color-border)] px-3 py-2 text-sm">{dark?<><Sun size={15} className="mr-1 inline"/>Light</>:<><Moon size={15} className="mr-1 inline"/>Dark</>}</button></div></section>
    <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4"><div className="flex items-center gap-2 font-medium"><HardDrive size={17}/>Local storage</div><div className="mt-3 grid gap-3 sm:grid-cols-3"><div><span className="text-xs text-[var(--color-muted)]">Used</span><p className="font-medium">{mb(storage.usage)}</p></div><div><span className="text-xs text-[var(--color-muted)]">Quota</span><p className="font-medium">{mb(storage.quota)}</p></div><div><span className="text-xs text-[var(--color-muted)]">Persistent</span><p className="font-medium">{persistent?"Yes":"Best effort"}</p></div></div><p className="mt-3 text-xs text-[var(--color-muted)]">Your documents are stored in browser IndexedDB. They are not GitHub files and saving them never creates Git commits.</p></section>
    <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4"><div className="flex items-center gap-2 font-medium"><Database size={17}/>Backup</div><p className="mt-1 text-sm text-[var(--color-muted)]">Export the complete library as a compressed .sokara file.</p><div className="mt-3 flex flex-wrap gap-2"><button onClick={()=>void exportBackup()} className="rounded-md bg-[var(--color-brand)] px-3 py-2 text-xs text-white"><Download size={14} className="mr-1 inline"/>Export backup</button><label className="cursor-pointer rounded-md border border-[var(--color-border)] px-3 py-2 text-xs"><Upload size={14} className="mr-1 inline"/>Import backup<input hidden type="file" accept=".sokara" onChange={async e=>{const f=e.target.files?.[0];if(f)await importBackup(f)}}/></label></div></section>
    <CloudPanel/>
  </div></div>;
}