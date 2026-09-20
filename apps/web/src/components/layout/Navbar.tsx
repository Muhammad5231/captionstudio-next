"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  LayoutDashboard,
  ShieldAlert,
  LogOut,
  LogIn,
  UserPlus,
  Menu,
  X,
  Layers,
  Palette,
  FileText,
  CreditCard,
  Info,
  HelpCircle,
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
    { href: "/features", label: "Features" },
    { href: "/styles", label: "Styles" },
    { href: "/templates", label: "Templates" },
    { href: "/pricing", label: "Pricing" },
    { href: "/about", label: "About" },
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

        {/* Right CTA / Auth Status */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2.5">
              {isAdmin && (
                <Link href="/admin">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 border-amber-800/60 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40 text-xs"
                  >
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Admin Panel
                  </Button>
                </Link>
              )}

              <Link href="/dashboard">
                <Button size="sm" variant="subtle" className="gap-1.5 text-xs">
                  <LayoutDashboard className="h-3.5 w-3.5 text-indigo-400" />
                  Dashboard
                </Button>
              </Link>

              <Link href="/create">
                <Button size="sm" className="gap-1.5 text-xs shadow-md shadow-indigo-600/20">
                  <Sparkles className="h-3.5 w-3.5" />
                  Create Captions
                </Button>
              </Link>

              <div className="h-4 w-[1px] bg-zinc-800 mx-1" />

              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 hidden lg:inline max-w-[120px] truncate">
                  {user.name}
                </span>
                <button
                  onClick={() => logout()}
                  title="Log out"
                  className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-900 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button size="sm" variant="ghost" className="gap-1.5 text-xs">
                  <LogIn className="h-3.5 w-3.5" />
                  Login
                </Button>
              </Link>

              <Link href="/signup">
                <Button size="sm" className="gap-1.5 text-xs shadow-md shadow-indigo-600/20">
                  <UserPlus className="h-3.5 w-3.5" />
                  Get Started
                </Button>
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
            {user ? (
              <>
                <div className="px-3 py-1 text-xs text-zinc-400">
                  Signed in as <span className="text-white font-medium">{user.email}</span>
                </div>
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-amber-300 bg-amber-950/40"
                  >
                    <ShieldAlert className="h-4 w-4" /> Admin Panel
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-900"
                >
                  <LayoutDashboard className="h-4 w-4 text-indigo-400" /> Workspace Dashboard
                </Link>
                <Link
                  href="/create"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-indigo-300 bg-indigo-950/40"
                >
                  <Sparkles className="h-4 w-4" /> Create Captions
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-400 hover:bg-zinc-900"
                >
                  <LogOut className="h-4 w-4" /> Log Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center rounded-lg border border-zinc-800 py-2 text-sm font-medium text-zinc-200"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

