"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Cpu, HardDrive } from "lucide-react";

export const Footer: React.FC = () => {
  const pathname = usePathname();

  // Hide on editor page for max canvas
  if (pathname.startsWith("/editor/")) {
    return null;
  }

  return (
    <footer className="border-t border-zinc-800/80 bg-zinc-950 text-zinc-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand & Mission */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white text-sm">
                CS
              </div>
              <span className="text-base font-bold text-white tracking-tight">
                Caption<span className="text-indigo-400">Studio</span>
              </span>
            </Link>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
              The professional, local-first caption generation suite. Powered by
              faster-whisper and FFmpeg for frame-accurate rendering with 100% on-device privacy.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-900/60 bg-emerald-950/40 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
                <ShieldCheck className="h-3 w-3" />
                Zero Cloud Egress
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-900/60 bg-indigo-950/40 px-2.5 py-0.5 text-[10px] font-medium text-indigo-400">
                <Cpu className="h-3 w-3" />
                faster-whisper AI
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 py-0.5 text-[10px] font-medium text-zinc-300">
                <HardDrive className="h-3 w-3" />
                Local Storage
              </span>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider mb-3">
              Product
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/create" className="hover:text-white transition-colors">
                  Create Captions
                </Link>
              </li>
              <li>
                <Link href="/features" className="hover:text-white transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/styles" className="hover:text-white transition-colors">
                  60+ Styles
                </Link>
              </li>
              <li>
                <Link href="/templates" className="hover:text-white transition-colors">
                  Templates
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors">
                  Pricing Plans
                </Link>
              </li>
            </ul>
          </div>

          {/* Workspace */}
          <div>
            <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider mb-3">
              Workspace
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/dashboard/projects" className="hover:text-white transition-colors">
                  My Projects
                </Link>
              </li>
              <li>
                <Link href="/dashboard/templates" className="hover:text-white transition-colors">
                  Favorite Styles
                </Link>
              </li>
              <li>
                <Link href="/dashboard/fonts" className="hover:text-white transition-colors">
                  Fonts Library
                </Link>
              </li>
              <li>
                <Link href="/dashboard/exports" className="hover:text-white transition-colors">
                  Exports History
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources & Legal */}
          <div>
            <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider mb-3">
              Resources
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/help" className="hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-zinc-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>&copy; {new Date().getFullYear()} CaptionStudio. Built for creators and developers.</p>
          <p className="flex items-center gap-2">
            <span>v1.0 Local Production</span>
            <span>&bull;</span>
            <span>Windows Compatible</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

