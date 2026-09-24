"use client";

import { Cloud, LogIn, LogOut, RefreshCw, UploadCloud } from "lucide-react";
import { useEffect, useState } from "react";
import { cloudConfigured, restoreLibraryFromCloud, signIn, signOut, signUp, supabase, uploadLibraryToCloud } from "@/lib/cloud";

export function CloudPanel() {
  const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [user,setUser]=useState<string|null>(null); const [message,setMessage]=useState(""); const [busy,setBusy]=useState(false);
  useEffect(()=>{ if(!supabase)return; supabase.auth.getUser().then(({data})=>setUser(data.user?.email??null)); const {data}=supabase.auth.onAuthStateChange((_e,s)=>setUser(s?.user?.email??null)); return()=>data.subscription.unsubscribe(); },[]);
  if(!cloudConfigured) return <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4"><div className="flex items-center gap-2 font-medium"><Cloud size={17}/>Cloud storage</div><p className="mt-2 text-sm text-[var(--color-muted)]">Optional. Add the Supabase environment variables to enable cloud backup.</p></div>;
  async function run(action:()=>Promise<unknown>, ok:string){setBusy(true);setMessage("");try{await action();setMessage(ok)}catch(e){setMessage(e instanceof Error?e.message:"Something went wrong")}finally{setBusy(false)}}
  return <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
    <div className="flex items-center gap-2 font-medium"><Cloud size={17}/>Cloud storage</div>
    {!user ? <div className="mt-3 space-y-2">
      <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="h-9 w-full rounded-md border border-[var(--color-border)] bg-transparent px-3 text-sm outline-none focus:border-[var(--color-brand)]"/>
      <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" className="h-9 w-full rounded-md border border-[var(--color-border)] bg-transparent px-3 text-sm outline-none focus:border-[var(--color-brand)]"/>
      <div className="flex gap-2"><button disabled={busy} onClick={()=>run(()=>signIn(email,password),"Signed in")} className="rounded-md bg-[var(--color-brand)] px-3 py-2 text-xs text-white"><LogIn size={14} className="mr-1 inline"/>Sign in</button><button disabled={busy} onClick={()=>run(()=>signUp(email,password),"Account created. Check your email if confirmation is enabled.")} className="rounded-md border border-[var(--color-border)] px-3 py-2 text-xs">Create account</button></div>
    </div> : <div className="mt-3 space-y-3">
      <p className="text-sm text-[var(--color-muted)]">Signed in as {user}</p>
      <div className="flex flex-wrap gap-2"><button disabled={busy} onClick={()=>run(uploadLibraryToCloud,"Local library uploaded")} className="rounded-md bg-[var(--color-brand)] px-3 py-2 text-xs text-white"><UploadCloud size={14} className="mr-1 inline"/>Upload library</button><button disabled={busy} onClick={()=>run(restoreLibraryFromCloud,"Cloud files restored locally")} className="rounded-md border border-[var(--color-border)] px-3 py-2 text-xs"><RefreshCw size={14} className="mr-1 inline"/>Restore cloud</button><button disabled={busy} onClick={()=>run(signOut,"Signed out")} className="rounded-md border border-[var(--color-border)] px-3 py-2 text-xs"><LogOut size={14} className="mr-1 inline"/>Sign out</button></div>
    </div>}
    {message&&<p className="mt-3 text-xs text-[var(--color-muted)]">{message}</p>}
  </div>;
}