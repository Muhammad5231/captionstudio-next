"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Film,
  Search,
  PlusCircle,
  Copy,
  Trash2,
  RotateCcw,
  Edit2,
  ExternalLink,
  Filter,
  Check,
  X,
  Clock,
  Layers,
  Archive,
} from "lucide-react";
import {
  listProjects,
  deleteProject,
  duplicateProject,
  restoreProject,
  updateProject,
  ProjectData,
} from "@/lib/api";

export default function DashboardProjectsPage() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"updated" | "created" | "name">("updated");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await listProjects(showArchived);
      setProjects(data || []);
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [showArchived]);

  const handleDuplicate = async (id: string, name: string) => {
    try {
      await duplicateProject(id, `${name} (Copy)`);
      await loadProjects();
    } catch (err: any) {
      alert(err?.message || "Failed to duplicate project");
    }
  };

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

  const handleRename = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await updateProject(id, { name: editName.trim() });
      setEditingId(null);
      await loadProjects();
    } catch (err: any) {
      alert(err?.message || "Failed to rename project");
    }
  };

  const filtered = useMemo(() => {
    let list = [...projects];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "created") {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
      return new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime();
    });

    return list;
  }, [projects, searchQuery, sortBy]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            My Projects
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage, duplicate, and edit your local caption workspaces.
          </p>
        </div>

        <Link
          href="/create"
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/20 shrink-0"
        >
          <PlusCircle className="w-4 h-4" /> New Project
        </Link>
      </div>

      {/* Control Bar: Search, Filters, Archive Toggle */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Active vs Trash Toggle */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setShowArchived(false)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                !showArchived ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Active ({projects.filter((p) => !(p as any).deleted_at).length})
            </button>
            <button
              onClick={() => setShowArchived(true)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                showArchived ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              Trash
            </button>
          </div>

          {/* Sort selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="updated">Sort by Last Updated</option>
            <option value="created">Sort by Created Date</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-slate-900/40 rounded-2xl border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center">
          <Film className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">
            {showArchived ? "Trash is empty" : "No projects found"}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
            {showArchived
              ? "Deleted projects will appear here and can be restored."
              : searchQuery
              ? "No projects match your search query."
              : "You haven't created any caption projects yet. Get started now!"}
          </p>
          {!showArchived && (
            <Link
              href="/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Start New Project
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p) => {
            const isEditing = editingId === p.id;
            const segmentsCount = p.caption_tracks?.[0]?.segments?.length || 0;
            const isDeleted = Boolean((p as any).deleted_at);

            return (
              <div
                key={p.id}
                className="group p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg"
              >
                <div>
                  {/* Top Bar with Aspect Ratio and Actions */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded">
                      {p.aspect_ratio || "9:16"}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(p.updated_at || p.created_at || Date.now()).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Title / Rename */}
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 mb-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-2 py-1 bg-slate-950 border border-blue-500 rounded text-xs text-white"
                        autoFocus
                      />
                      <button
                        onClick={() => handleRename(p.id)}
                        className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded"
                        title="Save"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1 text-slate-400 hover:bg-slate-800 rounded"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors line-clamp-1">
                        {p.name}
                      </h3>
                      {!isDeleted && (
                        <button
                          onClick={() => {
                            setEditingId(p.id);
                            setEditName(p.name);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white transition-opacity"
                          title="Rename"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                    {p.description || "Video caption project"}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      {segmentsCount} {segmentsCount === 1 ? "Segment" : "Segments"}
                    </span>
                    <span>&bull;</span>
                    <span>
                      {p.caption_tracks?.length || 1} Track
                    </span>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  {isDeleted ? (
                    <button
                      onClick={() => handleRestore(p.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Restore Project
                    </button>
                  ) : (
                    <Link
                      href={`/editor/${p.id}`}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shadow-blue-500/20"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open Editor
                    </Link>
                  )}

                  <div className="flex items-center gap-1">
                    {!isDeleted && (
                      <button
                        onClick={() => handleDuplicate(p.id, p.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Duplicate Project"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {!isDeleted && (
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Move to Trash"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
