import { createClient } from "@supabase/supabase-js";
import { db, typeFromName } from "@/lib/local-db";

const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const cloudConfigured=Boolean(url&&key);
export const supabase=cloudConfigured?createClient(url!,key!):null;
export const CLOUD_BUCKET="sokara-docs";

export async function signIn(email:string,password:string){if(!supabase)throw new Error("Supabase is not configured");return supabase.auth.signInWithPassword({email,password});}
export async function signUp(email:string,password:string){if(!supabase)throw new Error("Supabase is not configured");return supabase.auth.signUp({email,password});}
export async function signOut(){if(supabase)await supabase.auth.signOut();}

export async function uploadLibraryToCloud(){
  if(!supabase)throw new Error("Supabase is not configured");
  const {data:{user}}=await supabase.auth.getUser();if(!user)throw new Error("Sign in first");
  const files=await db.files.toArray();
  for(const file of files){
    const {error}=await supabase.storage.from(CLOUD_BUCKET).upload(user.id+"/"+file.path,file.blob,{contentType:file.mimeType,upsert:true,cacheControl:"3600"});
    if(error)throw error;
  }
}

export async function restoreLibraryFromCloud(){
  if(!supabase)throw new Error("Supabase is not configured");
  const {data:{user}}=await supabase.auth.getUser();if(!user)throw new Error("Sign in first");
  await listAndRestore(user.id,"");
}

async function listAndRestore(userId:string,prefix:string){
  if(!supabase)return;
  const {data,error}=await supabase.storage.from(CLOUD_BUCKET).list(userId+"/"+prefix,{limit:1000,sortBy:{column:"name",order:"asc"}});
  if(error)throw error;
  for(const item of data||[]){
    const path=prefix?prefix+"/"+item.name:item.name;
    if(item.id===null){await listAndRestore(userId,path);continue;}
    const {data:blob,error:downloadError}=await supabase.storage.from(CLOUD_BUCKET).download(userId+"/"+path);
    if(downloadError||!blob)continue;
    const type=typeFromName(item.name);if(!type)continue;
    const parts=path.split("/").slice(0,-1);
    for(let i=1;i<=parts.length;i++)await db.folders.put({path:parts.slice(0,i).join("/"),createdAt:Date.now()});
    const existing=await db.files.where("path").equals(path).first();
    await db.files.put({id:existing?.id||crypto.randomUUID(),name:item.name,path,type,mimeType:blob.type||"application/octet-stream",size:blob.size,modifiedAt:Date.now(),blob});
  }
}
