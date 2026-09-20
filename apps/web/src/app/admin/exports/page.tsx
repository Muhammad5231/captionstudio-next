"use client";

import React, { useState, useEffect } from "react";
import {
  Download,
  FileVideo,
  FileText,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HardDrive,
} from "lucide-react";
import { listAllExports, deleteExport } from "@/lib/api";
import { ExportRecord } from "@/types";

export default function AdminExportsPage() {
  const [exportsList, setExportsList] = useState<ExportRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadExports = async () => {
    try {
      setLoading(true);
      const data = await listAllExports();
      setExportsList(data || []);
    } catch (err) {
      console.error("Failed to load exports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExports();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this export from disk?")) return;
    try {
      await deleteExport(id);
      setExportsList((prev) => prev.filter((e) => e.id !== id));
    } catch (err: any) {
      alert(err?.message || "Failed to delete export");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            System Exports & Media Deliveries
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Global catalog of rendered videos and exported subtitle files.
          </p>
        </div>

        <button
          onClick={loadExports}
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-medium flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Filename</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Resolution</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Created</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                    Loading exports...
                  </td>
                </tr>
              ) : exportsList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                    No system exports found.
                  </td>
                </tr>
              ) : (
                exportsList.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-white truncate max-w-xs">
                        {e.filename || `Export ${e.id.slice(0, 8)}`}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        Project: {e.project_id ? e.project_id.slice(0, 8) + "..." : "Unknown"}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-mono text-[10px] uppercase bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                        {e.export_type}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-slate-300 font-mono">
                      {e.resolution}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          e.status === "completed"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {e.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-slate-400 text-[11px]">
                      {new Date(e.created_at).toLocaleString()}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {e.status === "completed" && (
                          <a
                            href={`http://localhost:8000/api/v1/exports/${e.id}/download`}
                            download
                            className="p-1.5 rounded-lg bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 border border-blue-500/20 transition-colors"
                            title="Download"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDelete(e.id)}
                          className="p-1.5 rounded-lg bg-rose-600/10 text-rose-400 hover:bg-rose-600/20 border border-rose-500/20 transition-colors"
                          title="Delete Export"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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

