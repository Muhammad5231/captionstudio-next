"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Film,
  Activity,
  HardDrive,
  Cpu,
  CheckCircle2,
  ArrowRight,
  Palette,
  FileVideo,
  RefreshCw,
  FolderSync,
} from "lucide-react";
import { getAdminOverview, AdminOverviewData } from "@/lib/api";

export default function AdminOverviewPage() {
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const res = await getAdminOverview();
      setData(res);
    } catch (err) {
      console.error("Failed to load admin overview:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
            System Administration
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Control Center & Studio Health
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Live telemetry from local SQLite database, storage directories, and background render pipelines.
          </p>
        </div>

        <button
          onClick={loadMetrics}
          className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-medium flex items-center gap-2 transition-colors self-start sm:self-auto shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh Metrics
        </button>
      </div>

      {/* Primary Real-Data KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Studio Projects</span>
            <Film className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {loading ? "..." : data?.total_projects ?? 0}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            Active local editing workspaces
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Total Exports</span>
            <FileVideo className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {loading ? "..." : data?.total_exports ?? 0}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            Burned MP4s & subtitle outputs
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Caption Styles</span>
            <Palette className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {loading ? "..." : data?.total_styles ?? 15}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            Sandboxed Python style modules
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Storage Footprint</span>
            <HardDrive className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {loading ? "..." : `${data?.storage_used_mb ?? 0} MB`}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 truncate">
            {data?.storage_breakdown?.uploads ?? 0} MB media &bull; {data?.storage_breakdown?.exports ?? 0} MB exports
          </div>
        </div>
      </div>

      {/* System Health Status Banner */}
      <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 space-y-4 shadow-xl backdrop-blur-sm">
        <h2 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" /> Core Engine Diagnostics
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800">
            <div className="text-[11px] text-zinc-400">Speech Recognition</div>
            <div className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              faster-whisper
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5">CTranslate2 Local Execution</div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800">
            <div className="text-[11px] text-zinc-400">Render Pipeline</div>
            <div className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              FFmpeg & libass
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5">Two-Phase Atomic Output</div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800">
            <div className="text-[11px] text-zinc-400">Database Backend</div>
            <div className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              SQLite 3 Local
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">WAL Mode & Foreign Keys Enabled</div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800">
            <div className="text-[11px] text-zinc-400">Style Execution</div>
            <div className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Isolated Subprocess
            </div>
            <div className="text-[10px] text-purple-400 mt-0.5">RenderSpec Contract v1</div>
          </div>
        </div>
      </div>

      {/* Quick Nav Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/admin/exports"
          className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-cyan-500/40 transition-all group flex items-center justify-between shadow-sm"
        >
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
              Exports & Deliveries
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">Render telemetry & inspector</p>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-cyan-300 transition-colors" />
        </Link>

        <Link
          href="/admin/styles"
          className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-purple-500/40 transition-all group flex items-center justify-between shadow-sm"
        >
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
              Style Studio
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">15 sandboxed Python styles</p>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-purple-300 transition-colors" />
        </Link>

        <Link
          href="/admin/storage"
          className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-amber-500/40 transition-all group flex items-center justify-between shadow-sm"
        >
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
              Storage Cleanup
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">Purge temp renders safely</p>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-amber-300 transition-colors" />
        </Link>

        <Link
          href="/admin/logs"
          className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-emerald-500/40 transition-all group flex items-center justify-between shadow-sm"
        >
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
              Audit & System Logs
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">Live error and event log</p>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-emerald-300 transition-colors" />
        </Link>
      </div>
    </div>
  );
}
