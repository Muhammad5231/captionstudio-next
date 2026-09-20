"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  Search,
  Heart,
  ArrowRight,
  Layers,
  Copy,
  Clock,
  CheckCircle2,
  Video,
} from "lucide-react";
import { listTemplates, toggleFavoriteTemplate, getFavoriteTemplates } from "@/lib/api";
import { StyleTemplate } from "@captionstudio/caption-schema";
import { useAuth } from "@/lib/auth";

export default function TemplatesPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<StyleTemplate[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"ALL" | "FAVORITES">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await listTemplates();
        setTemplates(data || []);

        if (user) {
          try {
            const favs = await getFavoriteTemplates();
            setFavorites(favs);
          } catch {
            // Unauthenticated or not supported yet
          }
        }
      } catch (err) {
        console.error("Error loading templates:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const handleToggleFav = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) {
      alert("Please sign in to save favorite templates.");
      return;
    }
    try {
      const res = await toggleFavoriteTemplate(id);
      if (res.favorited) {
        setFavorites((prev) => [...prev, id]);
      } else {
        setFavorites((prev) => prev.filter((f) => f !== id));
      }
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      if (activeTab === "FAVORITES" && !favorites.includes(t.id)) {
        return false;
      }
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags?.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [templates, activeTab, favorites, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-4">
          <Layers className="w-3.5 h-3.5" /> Project Blueprints & Layouts
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
          Creator Templates
        </h1>
        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
          Start your next video with production-ready subtitle staging, animation timing, and color harmonies.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="max-w-7xl mx-auto mb-10 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === "ALL"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            All Templates ({templates.length})
          </button>
          <button
            onClick={() => setActiveTab("FAVORITES")}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === "FAVORITES"
                ? "bg-rose-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${activeTab === "FAVORITES" ? "fill-white" : ""}`} />
            My Favorites ({favorites.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-slate-900/50 rounded-2xl border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-slate-800">
            <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">
              {activeTab === "FAVORITES"
                ? "You have not saved any favorite templates yet."
                : "No templates match your search query."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((tpl) => {
              const isFav = favorites.includes(tpl.id);
              const spec = tpl.renderSpec;

              return (
                <div
                  key={tpl.id}
                  className="group rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all duration-200 overflow-hidden flex flex-col justify-between shadow-xl"
                >
                  {/* Visual Preview Header */}
                  <div className="relative h-40 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 flex flex-col items-center justify-center border-b border-slate-800/80">
                    <button
                      onClick={(e) => handleToggleFav(e, tpl.id)}
                      className="absolute top-3 right-3 p-2 rounded-lg bg-slate-900/80 border border-slate-700/60 hover:bg-slate-800 transition-colors text-slate-400 hover:text-rose-400"
                      title={isFav ? "Remove favorite" : "Add to favorites"}
                    >
                      <Heart className={`w-4 h-4 ${isFav ? "fill-rose-500 text-rose-500" : ""}`} />
                    </button>

                    <div
                      style={{
                        fontFamily: spec.fontFamily,
                        fontWeight: spec.fontWeight,
                        textTransform: spec.textTransform as any,
                      }}
                      className="text-center select-none"
                    >
                      <span
                        style={{
                          color: spec.textColor,
                          WebkitTextStroke: `${spec.strokeWidth ? spec.strokeWidth / 2 : 0}px ${spec.strokeColor || "#000"}`,
                          fontSize: "1.2rem",
                        }}
                      >
                        NEXT LEVEL{" "}
                      </span>
                      <span
                        style={{
                          color: spec.highlightColor,
                          WebkitTextStroke: `${spec.strokeWidth ? spec.strokeWidth / 2 : 0}px ${spec.strokeColor || "#000"}`,
                          fontSize: "1.2rem",
                        }}
                      >
                        CAPTIONS
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-4 flex gap-2">
                      <span className="text-[10px] font-mono uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded">
                        {spec.animation?.type || "pop"}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                        {spec.fontFamily}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 flex flex-col flex-1 justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors mb-1">
                        {tpl.name}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                        {tpl.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">
                        {tpl.category.replace("_", " ")}
                      </span>
                      <Link
                        href="/create"
                        className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shadow-blue-500/20"
                      >
                        Use Template <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

