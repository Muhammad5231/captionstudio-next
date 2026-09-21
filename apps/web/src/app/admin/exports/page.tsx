"use client";

import React, { useState, useEffect } from "react";
import {
  Download,
  FileVideo,
  FileText,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  Activity,
  BarChart3,
  Sliders,
  X,
  Eye,
} from "lucide-react";
import {
  getAdminExportAnalytics,
  listAdminExports,
  ExportAnalyticsData,
  AdminExportRecord,
  API_BASE,
} from "@/lib/api";

export default function AdminExportsPage() {
  const [analytics, setAnalytics] = useState<ExportAnalyticsData | null>(null);
  const [exportsList, setExportsList] = useState<AdminExportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [inspectExport, setInspectExport] = useState<AdminExportRecord | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsData, exportsData] = await Promise.all([
        getAdminExportAnalytics().catch(() => null),
        listAdminExports(statusFilter === "ALL" ? undefined : statusFilter).catch(() => []),
      ]);
      setAnalytics(analyticsData);
      setExportsList(exportsData || []);
    } catch (err) {
      console.error("Failed to load admin exports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatSeconds = (sec?: number) => {
    if (!sec || sec === 0) return "0s";
    if (sec < 60) return `${Math.round(sec)}s`;
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${m}m ${s}s`;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
            Rendering Operations
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1">
            Export Analytics & Deliveries
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Live database telemetry and distribution logs for burned-in video and subtitle exports.
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-medium flex items-center gap-2 transition-colors self-start sm:self-auto shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh Telemetry
        </button>
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Total Exports</span>
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <BarChart3 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">
              {analytics?.total_exports ?? exportsList.length}
            </span>
            <span className="text-xs text-emerald-400 font-semibold">
              {analytics?.success_rate_percent ?? 100}% success
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            {analytics?.completed_exports ?? 0} succeeded, {analytics?.failed_exports ?? 0} failed
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Rendered Video Time</span>
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">
              {formatSeconds(analytics?.total_render_duration_seconds)}
            </span>
            <span className="text-xs text-zinc-400">
              avg {analytics?.average_render_time_seconds ?? 0}s/job
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Source media total: {formatSeconds(analytics?.total_source_duration_seconds)}
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Exported Storage</span>
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Zap className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">
              {analytics?.total_exported_mb ? `${analytics.total_exported_mb} MB` : "0 MB"}
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Across burned MP4s & subtitle tracks
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Hardware & Formats</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-lg font-bold text-white truncate">
              {analytics?.encoders_breakdown?.[0]?.encoder || "libx264"}
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1 truncate">
            Top Style: {analytics?.styles_breakdown?.[0]?.name || "Clean Modern"}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        {["ALL", "COMPLETED", "PROCESSING", "FAILED"].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === tab
                ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-sm"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/80 text-zinc-400 uppercase tracking-wider text-[10px] border-b border-zinc-800">
              <tr>
                <th className="px-5 py-3.5">Export / File</th>
                <th className="px-5 py-3.5">Project</th>
                <th className="px-5 py-3.5">Style & Language</th>
                <th className="px-5 py-3.5">Resolution & FPS</th>
                <th className="px-5 py-3.5">Encoder / Preset</th>
                <th className="px-5 py-3.5">Size & Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-zinc-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
                    Fetching export records...
                  </td>
                </tr>
              ) : exportsList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-zinc-500">
                    No exports match the current filter.
                  </td>
                </tr>
              ) : (
                exportsList.map((e) => (
                  <tr key={e.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-zinc-800 text-zinc-300">
                          {e.format === "MP4" ? (
                            <FileVideo className="w-4 h-4 text-cyan-400" />
                          ) : (
                            <FileText className="w-4 h-4 text-purple-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-white truncate max-w-xs">
                            {e.filename || `Export-${e.id.slice(0, 8)}`}
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono">
                            {e.id.slice(0, 16)}...
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-zinc-300 font-medium max-w-[140px] truncate">
                      {e.project_name || "Untitled"}
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-zinc-200 font-medium">
                        {e.style_name || "Default"}
                      </div>
                      <div className="text-[10px] text-zinc-500 uppercase">
                        {e.caption_language || "en"}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-zinc-300 font-mono">
                      {e.output_width && e.output_height ? (
                        <div>
                          {e.output_width}x{e.output_height}
                          {e.output_fps && (
                            <span className="text-[10px] text-zinc-500 block">
                              @{e.output_fps} fps
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-zinc-300 font-mono text-[11px]">
                        {e.encoder || "libx264"}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {e.quality_preset || "fast"}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-semibold text-zinc-200">
                        {formatBytes(e.file_size)}
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                          e.status === "COMPLETED"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : e.status === "FAILED"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                        }`}
                      >
                        {e.status === "COMPLETED" && <CheckCircle2 className="w-2.5 h-2.5" />}
                        {e.status === "FAILED" && <AlertCircle className="w-2.5 h-2.5" />}
                        {e.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setInspectExport(e)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                          title="Inspect Metadata"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {e.status === "COMPLETED" && (
                          <a
                            href={`${API_BASE}/exports/${e.id}/download`}
                            download
                            className="p-1.5 rounded-lg text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
                            title="Download Export"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspector Modal */}
      {inspectExport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div>
                <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">
                  Export Metadata Inspector
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {inspectExport.filename || inspectExport.id}
                </h3>
              </div>
              <button
                onClick={() => setInspectExport(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Banner if Failed */}
            {inspectExport.status === "FAILED" && inspectExport.error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                <span className="font-bold block mb-1">Rendering Failure Reason:</span>
                <code className="font-mono text-[11px] whitespace-pre-wrap">
                  {inspectExport.error}
                </code>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
                <span className="text-zinc-500 block text-[10px] uppercase">Format</span>
                <span className="font-semibold text-white mt-1 block">{inspectExport.format}</span>
              </div>
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
                <span className="text-zinc-500 block text-[10px] uppercase">Status</span>
                <span className="font-semibold text-white mt-1 block">{inspectExport.status}</span>
              </div>
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
                <span className="text-zinc-500 block text-[10px] uppercase">Output Size</span>
                <span className="font-semibold text-white mt-1 block">
                  {formatBytes(inspectExport.file_size)}
                </span>
              </div>
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
                <span className="text-zinc-500 block text-[10px] uppercase">Encoder</span>
                <span className="font-semibold text-white mt-1 block font-mono">
                  {inspectExport.encoder || "libx264"}
                </span>
              </div>
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
                <span className="text-zinc-500 block text-[10px] uppercase">Preset</span>
                <span className="font-semibold text-white mt-1 block">
                  {inspectExport.quality_preset || "fast"}
                </span>
              </div>
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
                <span className="text-zinc-500 block text-[10px] uppercase">Style Applied</span>
                <span className="font-semibold text-white mt-1 block">
                  {inspectExport.style_name || "Default"}
                </span>
              </div>
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
                <span className="text-zinc-500 block text-[10px] uppercase">Source Resolution</span>
                <span className="font-semibold text-white mt-1 block font-mono">
                  {inspectExport.source_width
                    ? `${inspectExport.source_width}x${inspectExport.source_height}`
                    : "—"}
                </span>
              </div>
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
                <span className="text-zinc-500 block text-[10px] uppercase">Output Resolution</span>
                <span className="font-semibold text-white mt-1 block font-mono">
                  {inspectExport.output_width
                    ? `${inspectExport.output_width}x${inspectExport.output_height}`
                    : "—"}
                </span>
              </div>
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
                <span className="text-zinc-500 block text-[10px] uppercase">Output FPS</span>
                <span className="font-semibold text-white mt-1 block font-mono">
                  {inspectExport.output_fps ? `${inspectExport.output_fps} fps` : "—"}
                </span>
              </div>
            </div>

            {/* Timestamps */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 space-y-2 text-xs">
              <span className="text-zinc-400 font-semibold block text-[11px]">Execution Timeline</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-zinc-300">
                <div>
                  <span className="text-[10px] text-zinc-500 block">Created</span>
                  <span>{new Date(inspectExport.created_at).toLocaleTimeString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block">Started</span>
                  <span>
                    {inspectExport.started_at
                      ? new Date(inspectExport.started_at).toLocaleTimeString()
                      : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block">Completed</span>
                  <span>
                    {inspectExport.completed_at
                      ? new Date(inspectExport.completed_at).toLocaleTimeString()
                      : "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setInspectExport(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
              >
                Close
              </button>
              {inspectExport.status === "COMPLETED" && (
                <a
                  href={`${API_BASE}/exports/${inspectExport.id}/download`}
                  download
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-cyan-600/20"
                >
                  <Download className="w-3.5 h-3.5" /> Download Media
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
