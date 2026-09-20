"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Download,
  FileVideo,
  FileText,
  Trash2,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  ExternalLink,
} from "lucide-react";
import { listAllExports, deleteExport } from "@/lib/api";
import { ExportRecord } from "@/types";

export default function DashboardExportsPage() {
  const [exportsList, setExportsList] = useState<ExportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"ALL" | "MP4" | "SUBTITLES">("ALL");

  const loadExports = async () => {
    try {
      setLoading(true);
      const data = await listAllExports();
      setExportsList(data || []);
    } catch (err) {
      console.error("Failed to fetch exports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExports();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this export file?")) return;
    try {
      await deleteExport(id);
      setExportsList((prev) => prev.filter((e) => e.id !== id));
    } catch (err: any) {
      alert(err?.message || "Failed to delete export");
    }
  };

  const filtered = exportsList.filter((e) => {
    if (filterType === "MP4") return e.export_type.includes("mp4") || e.export_type.includes("video");
    if (filterType === "SUBTITLES") return !e.export_type.includes("mp4") && !e.export_type.includes("video");
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Render Exports
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Download your finalized MP4 videos and subtitle files.
          </p>
        </div>

        <button
          onClick={loadExports}
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-medium flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-800 w-fit text-xs">
        <button
          onClick={() => setFilterType("ALL")}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
            filterType === "ALL" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          All Exports ({exportsList.length})
        </button>
        <button
          onClick={() => setFilterType("MP4")}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
            filterType === "MP4" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          Videos (MP4)
        </button>
        <button
          onClick={() => setFilterType("SUBTITLES")}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
            filterType === "SUBTITLES" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          Subtitles (SRT / VTT / ASS)
        </button>
      </div>

      {/* Content List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-slate-900/40 rounded-2xl border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center">
          <Download className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No export files found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
            Rendered videos and exported subtitle files from your projects will appear here.
          </p>
          <Link
            href="/dashboard/projects"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all"
          >
            Go to Projects
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const isVideo = item.export_type.includes("mp4") || item.export_type.includes("video");

            return (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`p-3 rounded-xl shrink-0 ${
                      isVideo
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                    }`}
                  >
                    {isVideo ? <FileVideo className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">
                      {item.filename || `Export ${item.id.slice(0, 8)}`}
                    </div>
                    <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                      <span className="font-mono text-[11px] uppercase bg-slate-800 px-1.5 py-0.5 rounded">
                        {item.export_type}
                      </span>
                      <span>&bull;</span>
                      <span>{item.resolution}</span>
                      <span>&bull;</span>
                      <span>{new Date(item.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase flex items-center gap-1 ${
                      item.status === "completed"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : item.status === "failed"
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    {item.status === "completed" && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {item.status === "failed" && <AlertCircle className="w-3.5 h-3.5" />}
                    {item.status}
                  </span>

                  {item.status === "completed" && (
                    <a
                      href={`http://localhost:8000/api/v1/exports/${item.id}/download`}
                      download
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm shadow-blue-500/20"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  )}

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete Export"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

