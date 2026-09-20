"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Film,
  Activity,
  HardDrive,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Shield,
  Layers,
  RefreshCw,
} from "lucide-react";
import { getAdminOverview, AdminOverviewData } from "@/lib/api";

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 MB";
  const mb = bytes / (1024 * 1024);
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
            System Administration
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Control Center & Health Overview
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time statistics across local database, storage footprint, and background jobs.
          </p>
        </div>

        <button
          onClick={loadMetrics}
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-medium flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh Metrics
        </button>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Local Users</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {loading ? "..." : data?.users.total ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
            <span className="text-emerald-400">{data?.users.creators ?? 0} Creators</span>
            <span>&bull;</span>
            <span className="text-purple-400">{data?.users.admins ?? 0} Admins</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Projects</span>
            <Film className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {loading ? "..." : data?.projects.total ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
            <span className="text-emerald-400">{data?.projects.active ?? 0} Active</span>
            <span>&bull;</span>
            <span className="text-slate-500">{data?.projects.deleted ?? 0} Trash</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Storage Used</span>
            <HardDrive className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {loading ? "..." : formatBytes(data?.storage.total_bytes ?? 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 truncate">
            {data?.exports.total ?? 0} Exports &bull; {formatBytes(data?.storage.uploads_bytes ?? 0)} Media
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Background Worker</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {loading ? "..." : (data?.jobs.processing ?? 0) + (data?.jobs.pending ?? 0)} Active
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
            <span className="text-emerald-400">{data?.jobs.completed ?? 0} Success</span>
            <span>&bull;</span>
            <span className="text-rose-400">{data?.jobs.failed ?? 0} Failed</span>
          </div>
        </div>
      </div>

      {/* System Health Status Banner */}
      <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Cpu className="w-4 h-4 text-purple-400" /> Core Engine Diagnostics
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="text-[11px] text-slate-400">Speech Engine</div>
            <div className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              faster-whisper
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5">CTranslate2 Backend Ready</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="text-[11px] text-slate-400">Render Pipeline</div>
            <div className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              FFmpeg & libass
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5">HW Acceleration Supported</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="text-[11px] text-slate-400">Database Engine</div>
            <div className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              SQLite 3 Local
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
              {formatBytes(data?.storage.database_bytes ?? 0)}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="text-[11px] text-slate-400">Host Environment</div>
            <div className="text-sm font-bold text-white mt-1 truncate">
              {data?.system.platform || "Windows"}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Python {data?.system.python_version?.split(" ")[0]} &bull; {data?.system.cpu_count} Threads
            </div>
          </div>
        </div>
      </div>

      {/* Quick Nav Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/admin/users"
          className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 transition-all group flex items-center justify-between"
        >
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
              Manage Users & Roles
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Update permissions or deactivate accounts</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-300 transition-colors" />
        </Link>

        <Link
          href="/admin/storage"
          className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 transition-all group flex items-center justify-between"
        >
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
              Storage Cleanup
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Purge temp waveforms and old renders</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-300 transition-colors" />
        </Link>

        <Link
          href="/admin/logs"
          className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 transition-all group flex items-center justify-between"
        >
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
              Audit & Server Logs
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Inspect system requests and error trails</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-300 transition-colors" />
        </Link>
      </div>
    </div>
  );
}

