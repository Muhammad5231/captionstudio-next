"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldAlert,
  Users,
  Film,
  Layers,
  Type,
  Activity,
  Download,
  HardDrive,
  Cpu,
  FileText,
  Settings,
  ArrowLeft,
  LayoutDashboard,
  Shield,
  Lock,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, isAdmin } = useAuth();

  const adminNav = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
    { label: "User Accounts", href: "/admin/users", icon: Users },
    { label: "All Projects", href: "/admin/projects", icon: Film },
    { label: "Templates & Styles", href: "/admin/templates", icon: Layers },
    { label: "Font Manager", href: "/admin/fonts", icon: Type },
    { label: "Background Jobs", href: "/admin/jobs", icon: Activity },
    { label: "System Exports", href: "/admin/exports", icon: Download },
    { label: "Storage & Cleanup", href: "/admin/storage", icon: HardDrive },
    { label: "Diagnostics", href: "/admin/system", icon: Cpu },
    { label: "Server Logs", href: "/admin/logs", icon: FileText },
    { label: "System Config", href: "/admin/settings", icon: Settings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
        Verifying admin authorization...
      </div>
    );
  }

  // Authorization check
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-rose-500/30 text-center shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Access Restricted</h1>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            The Admin Console requires an account with Administrator or Super Administrator privileges.
            Default local administrator credentials: <span className="text-slate-200 font-mono">admin@captionstudio.local</span> / <span className="text-slate-200 font-mono">admin123</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
            >
              Sign In as Admin
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900/90 border-r border-slate-800 p-4 md:p-6 flex flex-col justify-between shrink-0">
        <div>
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">
                Administration
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400" />
              Admin Console
            </h2>

            <Link
              href="/dashboard"
              className="mt-3 flex items-center gap-2 text-xs text-slate-400 hover:text-white p-2 rounded-lg bg-slate-950/80 border border-slate-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Creator Studio
            </Link>
          </div>

          {/* Admin Navigation */}
          <nav className="space-y-1">
            {adminNav.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-purple-600/15 text-purple-300 border border-purple-500/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-purple-400" : "text-slate-500"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Admin User Badge */}
        <div className="mt-8 pt-4 border-t border-slate-800/80">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">
            Active Administrator
          </div>
          <div className="text-xs font-bold text-white truncate">{user?.name}</div>
          <div className="text-[11px] text-slate-400 font-mono truncate">{user?.email}</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-6 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

