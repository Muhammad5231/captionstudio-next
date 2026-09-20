"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Film,
  Download,
  Layers,
  Clock,
  Sparkles,
  ArrowRight,
  PlusCircle,
  FileVideo,
  HardDrive,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { listProjects, listAllExports, listTemplates } from "@/lib/api";
import { Project, ExportRecord } from "@/types";

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [exportsList, setExportsList] = useState<ExportRecord[]>([]);
  const [templateCount, setTemplateCount] = useState<number>(60);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [projRes, expRes, tplRes] = await Promise.allSettled([
          listProjects(),
          listAllExports(),
          listTemplates(),
        ]);

        if (projRes.status === "fulfilled") {
          setProjects(projRes.value || []);
        }
        if (expRes.status === "fulfilled") {
          setExportsList(expRes.value || []);
        }
        if (tplRes.status === "fulfilled") {
          setTemplateCount(tplRes.value?.length || 60);
        }
      } catch (err) {
        console.error("Failed to load dashboard metrics:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const recentProjects = projects.slice(0, 4);
  const recentExports = exportsList.slice(0, 4);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-900/30 via-slate-900 to-indigo-950/40 border border-blue-500/20">
        <div>
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
            Creator Studio
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
            Welcome back, {user ? user.name : "Creator"}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Your local AI captioning engine is active. Subtitle generation, kinetic typography, and 4K rendering ready.
          </p>
        </div>

        <Link
          href="/create"
          className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/25 shrink-0"
        >
          <PlusCircle className="w-4 h-4" /> Start New Video
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Total Projects</div>
            <div className="text-2xl font-bold text-white mt-0.5">
              {loading ? "..." : projects.length}
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Video Exports</div>
            <div className="text-2xl font-bold text-white mt-0.5">
              {loading ? "..." : exportsList.length}
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Caption Styles</div>
            <div className="text-2xl font-bold text-white mt-0.5">
              {loading ? "..." : templateCount}
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Local AI Engine</div>
            <div className="text-xs font-semibold text-emerald-400 mt-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
              Online (faster-whisper)
            </div>
          </div>
        </div>
      </div>

      {/* Recent Projects Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-blue-400" /> Recent Projects
          </h2>
          <Link
            href="/dashboard/projects"
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            View All Projects ({projects.length}) &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-44 bg-slate-900/50 rounded-2xl border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : recentProjects.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center">
            <Film className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-300 text-sm font-semibold mb-1">No video projects yet</p>
            <p className="text-slate-500 text-xs mb-4">
              Upload a video to create your first animated caption project.
            </p>
            <Link
              href="/create"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Create Project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentProjects.map((p) => (
              <Link
                key={p.id}
                href={`/editor/${p.id}`}
                className="group p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all hover:scale-[1.01] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                      {p.aspect_ratio || "9:16"}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(p.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors line-clamp-1">
                    {p.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                    {p.description || "Video caption project"}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-blue-400 font-semibold">
                  <span>Open in Editor</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Exports Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-emerald-400" /> Recent Exports
          </h2>
          <Link
            href="/dashboard/exports"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            All Exports ({exportsList.length}) &rarr;
          </Link>
        </div>

        {recentExports.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800/80 text-center">
            <p className="text-xs text-slate-500">No rendered exports generated yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentExports.map((exp) => (
              <div
                key={exp.id}
                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                    <FileVideo className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate">
                      {exp.filename || `Export ${exp.id.slice(0, 8)}`}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {exp.export_type.toUpperCase()} &bull; {exp.resolution} &bull; {new Date(exp.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      exp.status === "completed"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    {exp.status}
                  </span>
                  {exp.status === "completed" && (
                    <a
                      href={`http://localhost:8000/api/v1/exports/${exp.id}/download`}
                      download
                      className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs transition-colors"
                      title="Download file"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

