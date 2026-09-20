import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, FolderKanban, ShieldCheck } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "CaptionStudio — Local-First Professional Caption Generator",
  description:
    "Generate accurate, frame-perfect captions locally with faster-whisper and FFmpeg. 100% private, zero cloud dependencies.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-100 flex flex-col min-h-screen selection:bg-indigo-500 selection:text-white">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-md shadow-indigo-500/20 text-white font-bold text-lg">
                  CS
                </div>
                <span className="text-base font-bold tracking-tight text-white">
                  Caption<span className="text-indigo-400">Studio</span>
                </span>
              </Link>

              <nav className="hidden md:flex items-center gap-1">
                <Link
                  href="/create"
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                  Create Captions
                </Link>
                <Link
                  href="/projects"
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
                >
                  <FolderKanban className="h-3.5 w-3.5 text-zinc-400" />
                  Projects
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 rounded-full border border-emerald-900/60 bg-emerald-950/40 px-3 py-1 text-[11px] font-medium text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>100% Local-First Engine</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-500">
          <p>
            CaptionStudio — Built for local-first caption generation. Powered by
            faster-whisper &amp; FFmpeg.
          </p>
        </footer>
      </body>
    </html>
  );
}

