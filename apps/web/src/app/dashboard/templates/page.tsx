"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Layers,
  Search,
  Heart,
  ArrowRight,
  Sparkles,
  PlusCircle,
  Copy,
} from "lucide-react";
import { listTemplates, toggleFavoriteTemplate, getFavoriteTemplates } from "@/lib/api";
import { StyleTemplate } from "@captionstudio/caption-schema";
import { useAuth } from "@/lib/auth";

export default function DashboardTemplatesPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<StyleTemplate[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"ALL" | "FAVORITES">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tplData, favData] = await Promise.allSettled([
        listTemplates(),
        getFavoriteTemplates(),
      ]);
      if (tplData.status === "fulfilled") setTemplates(tplData.value || []);
      if (favData.status === "fulfilled") setFavorites(favData.value || []);
    } catch (err) {
      console.error("Failed to load dashboard templates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleFav = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
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
      if (activeTab === "FAVORITES" && !favorites.includes(t.id)) return false;
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Caption Templates
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse and favorite typography presets for your videos.
          </p>
        </div>

        <Link
          href="/create"
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/20 shrink-0"
        >
          <PlusCircle className="w-4 h-4" /> Use in New Project
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === "ALL" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            All Templates ({templates.length})
          </button>
          <button
            onClick={() => setActiveTab("FAVORITES")}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              activeTab === "FAVORITES" ? "bg-rose-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${activeTab === "FAVORITES" ? "fill-white" : ""}`} />
            My Favorites ({favorites.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 bg-slate-900/40 rounded-2xl border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center">
          <Layers className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-white mb-1">
            {activeTab === "FAVORITES" ? "No favorite templates saved" : "No templates found"}
          </p>
          <p className="text-xs text-slate-400">
            {activeTab === "FAVORITES"
              ? "Click the heart icon on any template card to save it here for fast access."
              : "Try adjusting your search terms."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((tpl) => {
            const isFav = favorites.includes(tpl.id);
            const spec = tpl.renderSpec;

            return (
              <div
                key={tpl.id}
                className="group rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between overflow-hidden shadow-lg"
              >
                {/* Visual Preview */}
                <div className="relative h-36 bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center p-4 border-b border-slate-800">
                  <button
                    onClick={(e) => handleToggleFav(e, tpl.id)}
                    className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-slate-900/80 border border-slate-700 hover:bg-slate-800 transition-colors text-slate-400 hover:text-rose-400"
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
                        fontSize: "1.1rem",
                      }}
                    >
                      VIRAL{" "}
                    </span>
                    <span
                      style={{
                        color: spec.highlightColor,
                        WebkitTextStroke: `${spec.strokeWidth ? spec.strokeWidth / 2 : 0}px ${spec.strokeColor || "#000"}`,
                        fontSize: "1.1rem",
                      }}
                    >
                      HOOK
                    </span>
                  </div>

                  <span className="absolute bottom-2 left-3 text-[9px] font-mono uppercase bg-slate-950/80 text-blue-400 px-2 py-0.5 rounded border border-slate-800">
                    {spec.animation?.type || "pop"}
                  </span>
                </div>

                {/* Details */}
                <div className="p-4 flex flex-col flex-1 justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors mb-1">
                      {tpl.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                      {tpl.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {spec.fontFamily}
                    </span>
                    <Link
                      href="/create"
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      Apply <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

