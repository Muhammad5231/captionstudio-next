"use client";

import React, { useState, useEffect } from "react";
import {
  HardDrive,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileVideo,
  FileAudio,
  FolderOpen,
  Database,
  Sparkles,
} from "lucide-react";
import { getAdminStorage, cleanAdminStorage, AdminStorageData } from "@/lib/api";

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 MB";
  const mb = bytes / (1024 * 1024);
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

export default function AdminStoragePage() {
  const [storage, setStorage] = useState<AdminStorageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const loadStorage = async () => {
    try {
      setLoading(true);
      const data = await getAdminStorage();
      setStorage(data);
    } catch (err) {
      console.error("Failed to load storage details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStorage();
  }, []);

  const handleClean = async (target: "temp" | "audio" | "exports" | "all") => {
    const labels: Record<string, string> = {
      temp: "temporary cache files",
      audio: "extracted audio waveform files",
      exports: "rendered export files",
      all: "all temporary caches and audio extracts",
    };

    if (!confirm(`Are you sure you want to clean ${labels[target]}? This action cannot be undone.`)) {
      return;
    }

    setCleaning(target);
    setResultMessage(null);

    try {
      const res = await cleanAdminStorage(target);
      setResultMessage(
        `Cleanup successful! Freed ${formatBytes(res.freed_bytes)}. (${res.message})`
      );
      await loadStorage();
    } catch (err: any) {
      alert(err?.message || "Failed to perform storage cleanup");
    } finally {
      setCleaning(null);
    }
  };

  const total = storage?.total_bytes || 1;
  const uploadsPct = Math.round(((storage?.uploads_bytes || 0) / total) * 100);
  const exportsPct = Math.round(((storage?.exports_bytes || 0) / total) * 100);
  const audioPct = Math.round(((storage?.audio_bytes || 0) / total) * 100);
  const tempPct = Math.round(((storage?.temp_bytes || 0) / total) * 100);
  const dbPct = Math.round(((storage?.database_bytes || 0) / total) * 100);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Local Storage Analytics & Cleanup
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Inspect filesystem usage across media directories and reclaim disk space.
          </p>
        </div>

        <button
          onClick={loadStorage}
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-medium flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {resultMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{resultMessage}</span>
        </div>
      )}

      {/* Storage Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-blue-400 text-xs mb-2">
            <FileVideo className="w-4 h-4" />
            <span className="font-semibold">Uploads</span>
          </div>
          <div className="text-xl font-bold text-white">
            {formatBytes(storage?.uploads_bytes ?? 0)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">storage/uploads</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-emerald-400 text-xs mb-2">
            <FolderOpen className="w-4 h-4" />
            <span className="font-semibold">Exports</span>
          </div>
          <div className="text-xl font-bold text-white">
            {formatBytes(storage?.exports_bytes ?? 0)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">storage/exports</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-purple-400 text-xs mb-2">
            <FileAudio className="w-4 h-4" />
            <span className="font-semibold">Audio Waves</span>
          </div>
          <div className="text-xl font-bold text-white">
            {formatBytes(storage?.audio_bytes ?? 0)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">storage/audio</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-amber-400 text-xs mb-2">
            <Trash2 className="w-4 h-4" />
            <span className="font-semibold">Temp Cache</span>
          </div>
          <div className="text-xl font-bold text-white">
            {formatBytes(storage?.temp_bytes ?? 0)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">storage/temp</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-cyan-400 text-xs mb-2">
            <Database className="w-4 h-4" />
            <span className="font-semibold">SQLite DB</span>
          </div>
          <div className="text-xl font-bold text-white">
            {formatBytes(storage?.database_bytes ?? 0)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">captionstudio.db</div>
        </div>
      </div>

      {/* Storage Visual Usage Bar */}
      <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-purple-400" /> Disk Footprint Distribution
          </h2>
          <span className="text-xs font-mono font-bold text-white">
            Total: {formatBytes(storage?.total_bytes ?? 0)}
          </span>
        </div>

        <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
          <div style={{ width: `${uploadsPct}%` }} className="bg-blue-500" title={`Uploads: ${uploadsPct}%`} />
          <div style={{ width: `${exportsPct}%` }} className="bg-emerald-500" title={`Exports: ${exportsPct}%`} />
          <div style={{ width: `${audioPct}%` }} className="bg-purple-500" title={`Audio: ${audioPct}%`} />
          <div style={{ width: `${tempPct}%` }} className="bg-amber-500" title={`Temp: ${tempPct}%`} />
          <div style={{ width: `${dbPct}%` }} className="bg-cyan-500" title={`Database: ${dbPct}%`} />
        </div>

        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Uploads ({uploadsPct}%)</div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Exports ({exportsPct}%)</div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Audio Waves ({audioPct}%)</div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Temp Cache ({tempPct}%)</div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> Database ({dbPct}%)</div>
        </div>
      </div>

      {/* Safe Cleanup Actions */}
      <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-400" /> Safe Cleanup Operations
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Safely remove transient files without altering active project caption scripts.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white mb-1">Clean Temp Cache</h3>
              <p className="text-xs text-slate-400 mb-4">
                Purge incomplete render slices and transient video chunk files.
              </p>
            </div>
            <button
              onClick={() => handleClean("temp")}
              disabled={cleaning !== null}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {cleaning === "temp" ? "Cleaning..." : "Purge Temp Files"}
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white mb-1">Clean Audio Waves</h3>
              <p className="text-xs text-slate-400 mb-4">
                Remove extracted 16kHz audio waveforms. Whisper can regenerate them on demand.
              </p>
            </div>
            <button
              onClick={() => handleClean("audio")}
              disabled={cleaning !== null}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {cleaning === "audio" ? "Cleaning..." : "Purge Audio Waves"}
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white mb-1">Purge All Temp Data</h3>
              <p className="text-xs text-slate-400 mb-4">
                Clean temp cache and audio extracts in a single pass to maximize free storage.
              </p>
            </div>
            <button
              onClick={() => handleClean("all")}
              disabled={cleaning !== null}
              className="w-full py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {cleaning === "all" ? "Cleaning..." : "Clean All Temp Data"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

