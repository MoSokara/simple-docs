import type { Metadata } from "next";
import "./globals.css";
import { ServiceWorker } from "@/components/docs/service-worker";

export const metadata:Metadata={title:"Sokara Docs",description:"Sokara's personal offline-first documentation and learning library.",manifest:"/manifest.webmanifest"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" className="dark h-full"><body className="h-full antialiased"><ServiceWorker/>{children}</body></html>}