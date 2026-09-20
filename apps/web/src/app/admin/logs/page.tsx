"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  RefreshCw,
  Search,
  Filter,
  Copy,
  Check,
  AlertTriangle,
  Info,
  Terminal,
} from "lucide-react";
import { getAdminLogs, AdminLogEntry } from "@/lib/api";

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AdminLogEntry[]>([]);
  const [levelFilter, setLevelFilter] = useState<string>("ALL");
  const [lineCount, setLineCount] = useState<number>(100);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await getAdminLogs(
        lineCount,
        levelFilter === "ALL" ? undefined : levelFilter
      );
      setLogs(data || []);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [levelFilter, lineCount]);

  const filteredLogs = logs.filter((l) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      l.message.toLowerCase().includes(q) ||
      l.level.toLowerCase().includes(q) ||
      (l.logger && l.logger.toLowerCase().includes(q))
    );
  });

  const handleCopy = () => {
    const text = filteredLogs
      .map((l) => `[${l.timestamp}] [${l.level}] ${l.message}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Server & Audit Logs
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time stdout, FastAPI request traces, and system error events.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleCopy}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy Logs"}</span>
          </button>
          <button
            onClick={loadLogs}
            className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800 text-xs">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Level selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Level:</span>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">All Levels</option>
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="ERROR">ERROR</option>
            </select>
          </div>

          {/* Line count selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Lines:</span>
            <select
              value={lineCount}
              onChange={(e) => setLineCount(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search log messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Terminal View */}
      <div className="p-4 rounded-3xl bg-slate-950 border border-slate-800 font-mono text-xs overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-purple-400" />
            <span>FastAPI Application Output &bull; captionstudio.log</span>
          </div>
          <span>{filteredLogs.length} events loaded</span>
        </div>

        <div className="max-h-[600px] overflow-y-auto space-y-1.5 pr-2 font-mono text-[11px] leading-relaxed">
          {loading && filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-600">Streaming logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-600">No log entries found.</div>
          ) : (
            filteredLogs.map((l, idx) => {
              const lvl = l.level.toUpperCase();
              const isError = lvl === "ERROR" || lvl === "CRITICAL";
              const isWarn = lvl === "WARNING" || lvl === "WARN";

              return (
                <div
                  key={idx}
                  className={`p-1.5 rounded flex items-start gap-2.5 hover:bg-slate-900/60 transition-colors ${
                    isError
                      ? "bg-rose-950/20 text-rose-300"
                      : isWarn
                      ? "bg-amber-950/20 text-amber-300"
                      : "text-slate-300"
                  }`}
                >
                  <span className="text-slate-600 shrink-0 select-none">
                    {l.timestamp || "—"}
                  </span>
                  <span
                    className={`font-bold shrink-0 px-1.5 rounded text-[10px] uppercase select-none ${
                      isError
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        : isWarn
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    }`}
                  >
                    {lvl}
                  </span>
                  <span className="break-all">{l.message}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

