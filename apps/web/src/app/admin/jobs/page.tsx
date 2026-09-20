"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Layers,
} from "lucide-react";
import { getAdminJobs, AdminJobData } from "@/lib/api";

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<AdminJobData[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await getAdminJobs();
      setJobs(data || []);
    } catch (err) {
      console.error("Failed to fetch admin jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
    // Auto refresh every 5 seconds for live queue monitoring
    const timer = setInterval(loadJobs, 5000);
    return () => clearInterval(timer);
  }, []);

  const filtered = jobs.filter((j) => {
    if (filterStatus === "ALL") return true;
    return j.status.toUpperCase() === filterStatus.toUpperCase();
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Background Worker & Job Queue
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time monitor for AI speech transcription tasks and FFmpeg render pipelines.
          </p>
        </div>

        <button
          onClick={loadJobs}
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-medium flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh Queue
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800 w-fit text-xs">
        {["ALL", "PENDING", "PROCESSING", "COMPLETED", "FAILED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterStatus === s
                ? "bg-purple-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {s} ({jobs.filter((j) => s === "ALL" || j.status.toUpperCase() === s).length})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Job ID</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Progress</th>
                <th className="px-5 py-3.5">Project ID</th>
                <th className="px-5 py-3.5">Created</th>
                <th className="px-5 py-3.5">Error Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading && jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    Loading job queue...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    No jobs match the selected filter.
                  </td>
                </tr>
              ) : (
                filtered.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4 font-mono text-slate-300 font-bold">
                      {j.id.slice(0, 8)}...
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-mono text-[10px] uppercase bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                        {j.type}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          j.status === "completed"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : j.status === "failed"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : j.status === "processing"
                            ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 animate-pulse"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {j.status}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="w-28 bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.round(j.progress * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                        {Math.round(j.progress * 100)}%
                      </span>
                    </td>

                    <td className="px-5 py-4 font-mono text-slate-400 text-[11px]">
                      {j.project_id ? j.project_id.slice(0, 8) + "..." : "—"}
                    </td>

                    <td className="px-5 py-4 text-slate-400 text-[11px]">
                      {new Date(j.created_at).toLocaleTimeString()}
                    </td>

                    <td className="px-5 py-4 text-slate-400 text-[11px] max-w-xs truncate">
                      {j.error ? (
                        <span className="text-rose-400" title={j.error}>
                          {j.error}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

