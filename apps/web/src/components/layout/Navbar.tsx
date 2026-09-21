"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  ShieldAlert,
  LogOut,
  Lock,
  Menu,
  X,
  Palette,
  Layers,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // In the professional editor, hide the main marketing header to provide a full-screen editing canvas
  if (pathname.startsWith("/editor/")) {
    return null;
  }

  const navLinks = [
    { href: "/create", label: "Studio Studio", icon: Sparkles },
    { href: "/styles", label: "Styles (15)", icon: Palette },
    { href: "/features", label: "Features", icon: Layers },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-md shadow-indigo-500/20 text-white font-black text-lg group-hover:scale-105 transition-transform">
              CS
            </div>
            <span className="text-base font-bold tracking-tight text-white">
              Caption<span className="text-indigo-400">Studio</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "text-white bg-zinc-900"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right CTA / Admin Status */}
        <div className="hidden md:flex items-center gap-3">
          {isAdmin ? (
            <div className="flex items-center gap-2.5">
              <Link href="/admin/styles">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-indigo-800/60 bg-indigo-950/30 text-indigo-300 hover:bg-indigo-900/40 text-xs"
                >
                  <ShieldAlert className="h-3.5 w-3.5 text-indigo-400" />
                  Admin Studio
                </Button>
              </Link>

              <Link href="/create">
                <Button size="sm" className="gap-1.5 text-xs shadow-md shadow-indigo-600/20">
                  <Sparkles className="h-3.5 w-3.5" />
                  Create Captions
                </Button>
              </Link>

              <div className="h-4 w-[1px] bg-zinc-800 mx-1" />

              <button
                onClick={() => logout()}
                title="Log out from Admin"
                className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-900 rounded-lg transition-colors flex items-center gap-1 text-xs"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link href="/create">
                <Button size="sm" className="gap-1.5 text-xs shadow-md shadow-indigo-600/20">
                  <Sparkles className="h-3.5 w-3.5" />
                  Create Captions
                </Button>
              </Link>

              <Link
                href="/admin/login"
                title="Admin Control"
                className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 rounded-lg transition-colors"
              >
                <Lock className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-zinc-800 bg-zinc-950 px-4 py-4 space-y-3">
          <nav className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="pt-3 border-t border-zinc-800/80 space-y-2">
            <Link
              href="/create"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30"
            >
              <Sparkles className="h-4 w-4" /> Create Captions
            </Link>

            {isAdmin ? (
              <>
                <Link
                  href="/admin/styles"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-indigo-300 bg-indigo-950/40"
                >
                  <ShieldAlert className="h-4 w-4" /> Admin Studio
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-400 hover:bg-zinc-900"
                >
                  <LogOut className="h-4 w-4" /> Admin Log Out
                </button>
              </>
            ) : (
              <Link
                href="/admin/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200"
              >
                <Lock className="h-3.5 w-3.5" /> Admin Control
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
