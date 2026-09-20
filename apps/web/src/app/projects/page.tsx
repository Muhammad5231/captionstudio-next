"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FolderKanban,
  Video,
  FileText,
  Trash2,
  ExternalLink,
  Plus,
  Clock,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { listProjects, deleteProject, ProjectData } from "@/lib/api";
import { formatTime } from "@/lib/utils";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const data = await listProjects();
      setProjects(data);
    } catch (e) {
      console.error("Failed to fetch projects:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project and its assets?")) {
      return;
    }
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      alert("Failed to delete project");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Local Projects
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            All caption workspaces stored securely on your local machine.
          </p>
        </div>
        <Link href="/create">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> New Project
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" className="text-indigo-500" />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-6 w-6 text-indigo-400" />}
          title="No projects found"
          description="You haven't generated any local captions yet. Click below to start your first project."
          actionLabel="Create Captions"
          onAction={() => {
            window.location.href = "/create";
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => {
            const hasVideo = proj.assets.some((a) => a.type === "VIDEO");
            const totalSegments =
              proj.caption_tracks?.[0]?.segments?.length ?? 0;

            return (
              <div
                key={proj.id}
                className="group flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 backdrop-blur-sm transition-all hover:border-zinc-700 hover:bg-zinc-900/80"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-950/80 border border-indigo-800/60 text-indigo-400">
                        {hasVideo ? (
                          <Video className="h-4 w-4" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                      </div>
                      <Badge
                        variant={
                          proj.status === "READY"
                            ? "success"
                            : proj.status === "FAILED"
                            ? "error"
                            : "default"
                        }
                      >
                        {proj.status}
                      </Badge>
                    </div>

                    <button
                      onClick={() => handleDelete(proj.id)}
                      className="rounded-lg p-1.5 text-zinc-500 hover:bg-rose-950/60 hover:text-rose-400 transition-colors"
                      title="Delete project"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <h3 className="text-base font-semibold text-zinc-100 truncate">
                    {proj.name}
                  </h3>

                  <div className="mt-4 space-y-1 text-xs text-zinc-400">
                    <div className="flex items-center gap-2">
                      <Layers className="h-3.5 w-3.5 text-zinc-500" />
                      <span>{proj.source_type}</span>
                    </div>
                    {proj.duration && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-zinc-500" />
                        <span>Duration: {formatTime(proj.duration)}</span>
                      </div>
                    )}
                    {totalSegments > 0 && (
                      <div className="text-[11px] text-indigo-300">
                        {totalSegments} caption segments generated
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 border-t border-zinc-800/80 pt-3 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {proj.created_at
                      ? new Date(proj.created_at).toLocaleDateString()
                      : "Recently"}
                  </span>
                  <Link
                    href={`/create`}
                    className="flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300"
                  >
                    Open <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

