"use client";

import React from "react";
import { Settings, Shield, HardDrive, Cpu, Sliders, CheckCircle2 } from "lucide-react";

export default function AdminSettingsPage() {
  const configs = [
    { key: "DATABASE_URL", val: "sqlite:///./storage/captionstudio.db", desc: "Local SQLite database path" },
    { key: "STORAGE_PATH", val: "./storage", desc: "Root media and assets storage folder" },
    { key: "WHISPER_CACHE_DIR", val: "./storage/models", desc: "Cached faster-whisper CTranslate2 weights" },
    { key: "MAX_UPLOAD_SIZE_MB", val: "500 MB", desc: "Maximum upload size for video ingestion" },
    { key: "SESSION_EXPIRE_DAYS", val: "30 Days", desc: "PBKDF2 local session token duration" },
    { key: "FFMPEG_HWACCEL", val: "AUTO (CUDA / AMF / CPU fallback)", desc: "Hardware acceleration detection" },
    { key: "PASSWORD_HASH_ROUNDS", val: "100,000 (PBKDF2-HMAC-SHA256)", desc: "Cryptographic work factor" },
    { key: "CORS_ORIGINS", val: "http://localhost:3000, http://127.0.0.1:3000", desc: "Allowed web origin addresses" },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          System Configuration & Runtime Flags
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Inspect environment variables and active local pipeline settings.
        </p>
      </div>

      <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Active Parameters</h2>
            <p className="text-xs text-slate-400">Values loaded from .env and FastAPI settings</p>
          </div>
        </div>

        <div className="divide-y divide-slate-800/80">
          {configs.map((c, i) => (
            <div key={i} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <span className="font-mono font-bold text-purple-300">{c.key}</span>
                <p className="text-slate-500 text-[11px] mt-0.5">{c.desc}</p>
              </div>
              <div className="font-mono text-slate-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] self-start sm:self-auto">
                {c.val}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

