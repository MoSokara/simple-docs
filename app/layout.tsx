import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Simple Docs",
  description: "A simple local documentation viewer for real folders on your computer.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}