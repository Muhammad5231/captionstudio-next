"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Film,
  Search,
  ExternalLink,
  Trash2,
  RotateCcw,
  Layers,
  RefreshCw,
} from "lucide-react";
import { listProjects, deleteProject, restoreProject, ProjectData } from "@/lib/api";

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await listProjects(true); // Include soft-deleted
      setProjects(data || []);
    } catch (err) {
      console.error("Failed to fetch admin projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await deleteProject(id);
      await loadProjects();
    } catch (err: any) {
      alert(err?.message || "Failed to delete project");
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreProject(id);
      await loadProjects();
    } catch (err: any) {
      alert(err?.message || "Failed to restore project");
    }
  };

  const filtered = projects.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      (p as any).user_id?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            System Projects Catalog
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Global view of all video projects stored in the local SQLite database.
          </p>
        </div>

        <button
          onClick={loadProjects}
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-medium flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
        <div className="text-xs text-slate-400">
          Total Projects: <span className="text-white font-bold">{projects.length}</span>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search project title or owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Project Name</th>
                <th className="px-5 py-3.5">Owner ID</th>
                <th className="px-5 py-3.5">Aspect Ratio</th>
                <th className="px-5 py-3.5">Segments</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Updated</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    Loading projects...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    No projects found.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const isDeleted = Boolean((p as any).deleted_at);
                  const segmentsCount = p.caption_tracks?.[0]?.segments?.length || 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-white">{p.name}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">{p.description || "—"}</div>
                      </td>

                      <td className="px-5 py-4 font-mono text-slate-400 text-[11px]">
                        {(p as any).user_id ? (p as any).user_id.slice(0, 8) + "..." : "System"}
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-mono text-[10px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                          {p.aspect_ratio || "9:16"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-300">
                        {segmentsCount}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            isDeleted
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}
                        >
                          {isDeleted ? "Trash" : "Active"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-400 text-[11px]">
                        {new Date(p.updated_at || p.created_at || Date.now()).toLocaleDateString()}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/editor/${p.id}`}
                            className="p-1.5 rounded-lg bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 border border-blue-500/20 transition-colors"
                            title="Inspect in Editor"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          {isDeleted ? (
                            <button
                              onClick={() => handleRestore(p.id)}
                              className="p-1.5 rounded-lg bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20 border border-emerald-500/20 transition-colors"
                              title="Restore Project"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="p-1.5 rounded-lg bg-rose-600/10 text-rose-400 hover:bg-rose-600/20 border border-rose-500/20 transition-colors"
                              title="Delete Project"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
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
