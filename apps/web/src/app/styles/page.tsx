"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  Search,
  Filter,
  ArrowRight,
  Sliders,
  Eye,
  Check,
  Flame,
  Palette,
  Film,
  Type,
  Video,
} from "lucide-react";
import { listTemplates } from "@/lib/api";
import { StyleTemplate } from "@captionstudio/caption-schema";

const CATEGORIES = [
  { key: "ALL", label: "All Styles" },
  { key: "VIRAL_BOLD", label: "Viral / Bold" },
  { key: "KINETIC", label: "Kinetic & Pop" },
  { key: "HIGHLIGHT", label: "Karaoke Highlight" },
  { key: "MINIMAL", label: "Minimalist" },
  { key: "CINEMATIC", label: "Cinematic" },
  { key: "CREATOR_SOCIAL", label: "Creator & Social" },
];

export default function StylesPage() {
  const [templates, setTemplates] = useState<StyleTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<StyleTemplate | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await listTemplates();
        setTemplates(data || []);
        if (data && data.length > 0) {
          setSelectedTemplate(data[0]);
        }
      } catch (err) {
        console.error("Failed to fetch templates:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      const matchesCategory = selectedCategory === "ALL" || t.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.tags?.some((tag) => tag.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [templates, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5" /> 15 Built-in Python Styles
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
          Caption Style Library
        </h1>
        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
          Explore our handcrafted library of 15 premium Python styles running securely in sandboxed isolation, calibrated for TikTok, Reels, Shorts, and long-form cinema.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="max-w-7xl mx-auto mb-10 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                  selectedCategory === cat.key
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search style or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 bg-slate-900/50 rounded-2xl border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-slate-800">
            <Palette className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No styles matched your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((t) => {
              const spec = t.renderSpec;
              const isSelected = selectedTemplate?.id === t.id;

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTemplate(t)}
                  className={`group cursor-pointer flex flex-col rounded-2xl bg-slate-900/70 border transition-all duration-200 overflow-hidden hover:scale-[1.01] ${
                    isSelected
                      ? "border-blue-500 shadow-lg shadow-blue-500/20"
                      : "border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {/* Style Preview Stage */}
                  <div className="relative h-44 bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center p-4 overflow-hidden border-b border-slate-800/80">
                    <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:12px_12px]" />

                    {/* Rendered Text Mockup */}
                    <div
                      className="relative z-10 text-center select-none"
                      style={{
                        fontFamily: spec.fontFamily || "inherit",
                        fontWeight: spec.fontWeight || 800,
                        textTransform: (spec.textTransform as any) || "uppercase",
                        letterSpacing: `${spec.letterSpacing || 0}px`,
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: spec.backgroundColor || "transparent",
                          padding: `${spec.backgroundPaddingY || 4}px ${spec.backgroundPaddingX || 12}px`,
                          borderRadius: `${spec.backgroundBorderRadius || 6}px`,
                          display: "inline-block",
                        }}
                      >
                        <span
                          style={{
                            color: spec.textColor || "#FFFFFF",
                            WebkitTextStroke: `${spec.strokeWidth ? spec.strokeWidth / 2 : 0}px ${spec.strokeColor || "#000"}`,
                            textShadow: `${spec.shadowOffsetX || 0}px ${spec.shadowOffsetY || 2}px ${spec.shadowBlur || 4}px ${spec.shadowColor || "rgba(0,0,0,0.8)"}`,
                            fontSize: "1.25rem",
                          }}
                        >
                          VIRAL{" "}
                        </span>
                        <span
                          style={{
                            color: spec.highlightColor || "#FFE600",
                            WebkitTextStroke: `${spec.strokeWidth ? spec.strokeWidth / 2 : 0}px ${spec.strokeColor || "#000"}`,
                            textShadow: `${spec.shadowOffsetX || 0}px ${spec.shadowOffsetY || 2}px ${spec.shadowBlur || 4}px ${spec.shadowColor || "rgba(0,0,0,0.8)"}`,
                            fontSize: "1.25rem",
                          }}
                        >
                          CAPTION
                        </span>
                      </div>
                    </div>

                    <span className="absolute bottom-2 right-2 text-[10px] font-mono uppercase bg-slate-950/80 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                      {spec.animation?.type || "pop"}
                    </span>
                  </div>

                  {/* Details Card */}
                  <div className="p-4 flex flex-col flex-1 justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">
                          {t.name}
                        </h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                          {t.category.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                        {t.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/20"
                          style={{ backgroundColor: spec.textColor }}
                          title={`Text: ${spec.textColor}`}
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/20"
                          style={{ backgroundColor: spec.highlightColor }}
                          title={`Highlight: ${spec.highlightColor}`}
                        />
                        <span className="text-[11px] text-slate-500 font-mono">
                          {spec.fontFamily}
                        </span>
                      </div>

                      <Link
                        href="/create"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300"
                      >
                        Apply <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Style Inspector Modal / Bar */}
      {selectedTemplate && (
        <div className="fixed bottom-6 right-6 z-40 max-w-md w-full p-4 rounded-2xl bg-slate-900/95 border border-blue-500/40 shadow-2xl backdrop-blur-md hidden lg:block">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <h4 className="text-sm font-bold text-white">{selectedTemplate.name}</h4>
            </div>
            <Link
              href="/create"
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
            >
              Use Style <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="text-xs text-slate-400 grid grid-cols-2 gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <div>Font: <span className="text-slate-200 font-mono">{selectedTemplate.renderSpec.fontFamily}</span></div>
            <div>Animation: <span className="text-slate-200 font-mono">{selectedTemplate.renderSpec.animation?.type || "none"}</span></div>
            <div>Highlight: <span className="text-slate-200 font-mono">{selectedTemplate.renderSpec.highlightColor}</span></div>
            <div>Stroke: <span className="text-slate-200 font-mono">{selectedTemplate.renderSpec.strokeWidth}px</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

