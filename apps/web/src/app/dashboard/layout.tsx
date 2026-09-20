"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Film,
  Layers,
  Type,
  Download,
  Settings,
  PlusCircle,
  Shield,
  LogOut,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout, isAdmin } = useAuth();

  const navItems = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard, exact: true },
    { label: "My Projects", href: "/dashboard/projects", icon: Film },
    { label: "Templates", href: "/dashboard/templates", icon: Layers },
    { label: "Custom Fonts", href: "/dashboard/fonts", icon: Type },
    { label: "Render Exports", href: "/dashboard/exports", icon: Download },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900/70 border-r border-slate-800 p-4 md:p-6 flex flex-col justify-between shrink-0">
        <div>
          {/* Workspace Title & Create Button */}
          <div className="mb-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Workspace
            </div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Creator Studio
            </h2>

            <Link
              href="/create"
              className="mt-4 w-full py-2.5 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Project</span>
            </Link>
          </div>

          {/* Nav List */}
          <nav className="space-y-1">
            {navItems.map((item) => {
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
                      ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-blue-400" : "text-slate-500"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Admin Switcher if role allows */}
          {isAdmin && (
            <div className="mt-6 pt-4 border-t border-slate-800/80">
              <Link
                href="/admin"
                className="flex items-center justify-between p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold hover:bg-purple-500/20 transition-all"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span>Admin Panel</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-purple-400" />
              </Link>
            </div>
          )}
        </div>

        {/* User Card & Logout */}
        <div className="mt-8 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold uppercase shrink-0">
                {user ? user.name?.charAt(0) || user.email?.charAt(0) : "U"}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate">
                  {user ? user.name : "Guest Creator"}
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  {user ? user.email : "Local session"}
                </div>
              </div>
            </div>

            {user && (
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-6 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

