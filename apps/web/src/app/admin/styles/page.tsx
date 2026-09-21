"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminGetStyles, adminLogout, adminGetMe, StyleSummary } from "@/lib/api";

const CATEGORIES = [
  "ALL",
  "VIRAL_BOLD",
  "MINIMAL",
  "KINETIC",
  "HIGHLIGHT",
  "CINEMATIC",
  "CREATOR_SOCIAL",
];

export default function AdminStylesPage() {
  const router = useRouter();
  const [styles, setStyles] = useState<StyleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        await adminGetMe();
        const data = await adminGetStyles("ALL");
        setStyles(data);
      } catch (err: any) {
        if (err.message?.includes("Not authenticated") || err.message?.includes("401")) {
          router.push("/admin/login");
        } else {
          setError(err.message || "Failed to load styles");
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  const handleLogout = async () => {
    await adminLogout();
    router.push("/admin/login");
  };

  const filteredStyles = styles.filter((s) => {
    const matchesCat = activeCategory === "ALL" || s.category.toUpperCase() === activeCategory;
    const matchesSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Admin Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-sm shadow-md shadow-indigo-500/20">
                CS
              </span>
              <span>CaptionStudio</span>
            </Link>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-medium">
              Admin Studio
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/styles/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm shadow-indigo-600/30 transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Python Style
            </Link>
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Public App
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded-lg hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Python Caption Styles</h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage the 15 built-in styles and author custom styles using the sandboxed Python Style SDK.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search styles..."
                className="bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48 sm:w-64"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-xs px-3.5 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap ${
                activeCategory === cat
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                  : "bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {cat.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Styles Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
            {error}
          </div>
        ) : filteredStyles.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/40 rounded-2xl border border-slate-800/80">
            <p className="text-slate-400 text-sm">No styles match your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredStyles.map((s) => (
              <div
                key={s.id}
                className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between group shadow-sm hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h2 className="text-base font-semibold text-white group-hover:text-indigo-400 transition-colors">
                        {s.name}
                      </h2>
                      <span className="text-xs font-mono text-slate-500">{s.id}</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {s.is_builtin ? (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                          Built-in
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                          Custom
                        </span>
                      )}
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700/60">
                        v{s.current_version}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                    {s.description || "No description provided."}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    {s.category.replace("_", " ")}
                  </span>

                  <Link
                    href={`/admin/styles/${s.id}/edit`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit in Studio
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
