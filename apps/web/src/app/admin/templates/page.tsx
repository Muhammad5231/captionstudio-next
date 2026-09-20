"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  Search,
  Sparkles,
  RefreshCw,
  Eye,
  Type,
  Palette,
} from "lucide-react";
import { listTemplates } from "@/lib/api";
import { StyleTemplate } from "@captionstudio/caption-schema";

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<StyleTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await listTemplates();
      setTemplates(data || []);
    } catch (err) {
      console.error("Failed to load templates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const filtered = templates.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.renderSpec.fontFamily.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Style Templates & Typography Registry
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Audit system presets, typography rules, and animation specs.
          </p>
        </div>

        <button
          onClick={loadTemplates}
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-medium flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
        <div className="text-xs text-slate-400">
          Installed Presets: <span className="text-white font-bold">{templates.length}</span>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search template or font..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Templates Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Template Name</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Font Family</th>
                <th className="px-5 py-3.5">Animation</th>
                <th className="px-5 py-3.5">Text / Highlight</th>
                <th className="px-5 py-3.5">Display Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                    Loading templates...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                    No templates found.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                  const spec = t.renderSpec;

                  return (
                    <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-white">{t.name}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">{t.description}</div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-[10px] font-mono uppercase bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                          {t.category}
                        </span>
                      </td>

                      <td className="px-5 py-4 font-mono text-slate-300">
                        {spec.fontFamily} ({spec.fontWeight})
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          {spec.animation?.type || "none"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                            style={{ backgroundColor: spec.textColor }}
                            title={`Text: ${spec.textColor}`}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                            style={{ backgroundColor: spec.highlightColor }}
                            title={`Highlight: ${spec.highlightColor}`}
                          />
                          <span className="text-[11px] font-mono text-slate-400">
                            {spec.textColor} / {spec.highlightColor}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 font-mono text-slate-400 uppercase text-[11px]">
                        {spec.displayMode}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

