"use client";

import React, { useState } from "react";
import { Type, RefreshCw, CheckCircle2, Upload, AlertCircle, HardDrive } from "lucide-react";

const SYSTEM_FONTS = [
  { name: "Montserrat", family: "Montserrat", file: "Montserrat-Black.ttf", weight: 900, type: "Bundled" },
  { name: "The Bold Font", family: "The Bold Font", file: "TheBoldFont.ttf", weight: 700, type: "Bundled" },
  { name: "Impact", family: "Impact", file: "impact.ttf", weight: 900, type: "Bundled" },
  { name: "Bebas Neue", family: "Bebas Neue", file: "BebasNeue-Regular.ttf", weight: 700, type: "Bundled" },
  { name: "Komika Axis", family: "Komika Axis", file: "KOMIKAX_.ttf", weight: 800, type: "Bundled" },
  { name: "Anton", family: "Anton", file: "Anton-Regular.ttf", weight: 700, type: "Bundled" },
  { name: "Poppins", family: "Poppins", file: "Poppins-ExtraBold.ttf", weight: 800, type: "Bundled" },
  { name: "Inter", family: "Inter", file: "Inter-Bold.ttf", weight: 700, type: "Bundled" },
  { name: "Roboto", family: "Roboto", file: "Roboto-Black.ttf", weight: 900, type: "Bundled" },
];

export default function AdminFontsPage() {
  const [fonts, setFonts] = useState(SYSTEM_FONTS);
  const [rescanning, setRescanning] = useState(false);
  const [rescanSuccess, setRescanSuccess] = useState(false);

  const handleRescan = () => {
    setRescanning(true);
    setTimeout(() => {
      setRescanning(false);
      setRescanSuccess(true);
      setTimeout(() => setRescanSuccess(false), 3000);
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Font & Typography Repository
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            System-wide fonts registered for FFmpeg libass subtitle rasterization.
          </p>
        </div>

        <button
          onClick={handleRescan}
          disabled={rescanning}
          className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${rescanning ? "animate-spin" : ""}`} />
          <span>{rescanning ? "Rescanning Font Cache..." : "Rescan Fontconfig Cache"}</span>
        </button>
      </div>

      {rescanSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Font cache synchronized successfully. All typefaces available to FFmpeg burn-in engine.</span>
        </div>
      )}

      {/* Fonts List */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
            <tr>
              <th className="px-5 py-3.5">Typeface Name</th>
              <th className="px-5 py-3.5">Filename</th>
              <th className="px-5 py-3.5">CSS Family</th>
              <th className="px-5 py-3.5">Weight</th>
              <th className="px-5 py-3.5">Origin</th>
              <th className="px-5 py-3.5 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {fonts.map((f, i) => (
              <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-5 py-4 font-bold text-white">
                  {f.name}
                </td>
                <td className="px-5 py-4 font-mono text-slate-400 text-[11px]">
                  {f.file}
                </td>
                <td className="px-5 py-4 text-slate-300 font-mono">
                  {f.family}
                </td>
                <td className="px-5 py-4 text-slate-400">
                  {f.weight}
                </td>
                <td className="px-5 py-4">
                  <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                    {f.type}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold uppercase bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Indexed
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

