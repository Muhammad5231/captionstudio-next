"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Search, Sparkles, Check } from "lucide-react";
import { StyleTemplate, CaptionRenderSpec, StyleCategory } from "@captionstudio/caption-schema";
import { listTemplates } from "@/lib/api";

interface StylesGalleryProps {
  currentSpec: CaptionRenderSpec;
  onSelectStyle: (spec: CaptionRenderSpec) => void;
}

const CATEGORIES: Array<{ key: string; label: string }> = [
  { key: "ALL", label: "All (15)" },
  { key: "VIRAL_BOLD", label: "Viral / Bold" },
  { key: "MINIMAL", label: "Minimal" },
  { key: "KINETIC", label: "Kinetic" },
  { key: "HIGHLIGHT", label: "Highlight" },
  { key: "CINEMATIC", label: "Cinematic" },
  { key: "CREATOR_SOCIAL", label: "Creator / Social" },
];

export const StylesGallery: React.FC<StylesGalleryProps> = ({
  currentSpec,
  onSelectStyle,
}) => {
  const [templates, setTemplates] = useState<StyleTemplate[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await listTemplates();
        setTemplates(data);
      } catch (err) {
        console.error("Failed to load templates:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchesCat = activeCategory === "ALL" || t.category === activeCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.tags?.some((tag) => tag.toLowerCase().includes(query));
      return matchesCat && matchesSearch;
    });
  }, [templates, activeCategory, searchQuery]);

  return (
    <div className="flex flex-col gap-3 h-full overflow-hidden">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search 15 styles by name, effect, or creator..."
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 py-2 pl-9 pr-3 text-xs text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none transition-colors"
        />
      </div>

      {/* Category Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
              activeCategory === cat.key
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid of Styles */}
      <div className="grid grid-cols-1 gap-2.5 overflow-y-auto pr-1 flex-1">
        {loading ? (
          <div className="py-12 text-center text-xs text-zinc-500">Loading styles...</div>
        ) : filteredTemplates.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-500">No matching styles found</div>
        ) : (
          filteredTemplates.map((template) => {
            const spec = template.renderSpec;
            const isSelected =
              currentSpec.fontFamily === spec.fontFamily &&
              currentSpec.highlightColor === spec.highlightColor &&
              currentSpec.textColor === spec.textColor;

            return (
              <div
                key={template.id}
                onClick={() => onSelectStyle(spec)}
                className={`group relative cursor-pointer rounded-xl border p-3 transition-all ${
                  isSelected
                    ? "border-indigo-500 bg-indigo-950/20 shadow-md ring-1 ring-indigo-500"
                    : "border-zinc-800/80 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900"
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-zinc-200 group-hover:text-white">
                      {template.name}
                    </span>
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] font-mono text-zinc-400">
                      {template.category.replace("_", " ")}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="flex items-center gap-1 rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-medium text-indigo-400">
                      <Check className="h-3 w-3" /> Active
                    </span>
                  )}
                </div>

                {/* Live Preview Card Thumbnail */}
                <div
                  className="rounded-lg p-3 text-center border flex items-center justify-center min-h-[48px] select-none"
                  style={{
                    backgroundColor: template.thumbnailCss?.background || "#000000",
                    borderColor: template.thumbnailCss?.borderColor || "#27272a",
                  }}
                >
                  <span
                    className="font-extrabold uppercase tracking-wide text-sm drop-shadow"
                    style={{
                      fontFamily: spec.fontFamily,
                      color: spec.textColor,
                      WebkitTextStroke: spec.strokeWidth > 0 ? `1px ${spec.strokeColor}` : undefined,
                    }}
                  >
                    CAPTION{" "}
                    <span style={{ color: spec.highlightColor }}>
                      STUDIO
                    </span>
                  </span>
                </div>

                {/* Description & Tags */}
                <p className="mt-2 text-[11px] text-zinc-400 line-clamp-1">
                  {template.description}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

