"use client";

import React, { useState } from "react";
import { Type, Upload, Check, AlertCircle, Sparkles, RefreshCw, Eye } from "lucide-react";

const BUNDLED_FONTS = [
  { name: "Montserrat", style: "Sans-Serif", weight: "800 Black", status: "Bundled" },
  { name: "The Bold Font", style: "Display", weight: "700 Bold", status: "Bundled" },
  { name: "Impact", style: "Display Grotesque", weight: "900 Heavy", status: "Bundled" },
  { name: "Bebas Neue", style: "Condensed Display", weight: "700 Bold", status: "Bundled" },
  { name: "Komika Axis", style: "Comic / Cartoon", weight: "800 Bold", status: "Bundled" },
  { name: "Anton", style: "Sans-Serif Headline", weight: "700 Bold", status: "Bundled" },
  { name: "Poppins", style: "Geometric Sans", weight: "800 ExtraBold", status: "Bundled" },
  { name: "Inter", style: "Modern UI Sans", weight: "700 Bold", status: "Bundled" },
  { name: "Roboto", style: "Neo-Grotesque", weight: "900 Black", status: "Bundled" },
];

export default function DashboardFontsPage() {
  const [fonts, setFonts] = useState(BUNDLED_FONTS);
  const [customFonts, setCustomFonts] = useState<Array<{ name: string; file: string; date: string }>>([]);
  const [previewText, setPreviewText] = useState("THE VIRAL VIDEO TITLE");
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".ttf") && !file.name.endsWith(".otf")) {
      setUploadMessage({
        text: "Please select a valid TrueType (.ttf) or OpenType (.otf) font file.",
        type: "error",
      });
      return;
    }

    setUploading(true);
    setUploadMessage(null);

    // Simulate safe local font ingestion into fontconfig cache
    setTimeout(() => {
      const fontName = file.name.replace(/\.[^/.]+$/, "");
      setCustomFonts((prev) => [
        ...prev,
        {
          name: fontName,
          file: file.name,
          date: new Date().toLocaleDateString(),
        },
      ]);
      setUploading(false);
      setUploadMessage({
        text: `Font "${fontName}" uploaded and registered into local fontconfig cache.`,
        type: "success",
      });
    }, 600);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Font Library & Typography
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage bundled system fonts and register custom TTF/OTF typefaces for FFmpeg burn-in.
          </p>
        </div>

        {/* Upload Button Label */}
        <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/20 shrink-0">
          <Upload className="w-4 h-4" />
          <span>Upload Font (.ttf / .otf)</span>
          <input
            type="file"
            accept=".ttf,.otf"
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {/* Upload Notification */}
      {uploadMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
            uploadMessage.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
              : "bg-rose-500/10 border border-rose-500/20 text-rose-300"
          }`}
        >
          {uploadMessage.type === "success" ? (
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{uploadMessage.text}</span>
        </div>
      )}

      {/* Interactive Typography Preview Playground */}
      <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Live Preview Playground
            </span>
          </div>
          <input
            type="text"
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
            placeholder="Type sample text..."
            className="w-full sm:w-72 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800/80 text-center overflow-x-auto">
          <div className="text-2xl sm:text-3xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400 select-none">
            {previewText || "SAMPLE CAPTION TEXT"}
          </div>
        </div>
      </div>

      {/* Custom Fonts Section if any */}
      {customFonts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" /> Custom Uploaded Fonts ({customFonts.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {customFonts.map((f, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-slate-900/80 border border-amber-500/30 flex items-center justify-between"
              >
                <div>
                  <h3 className="text-sm font-bold text-white">{f.name}</h3>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">{f.file}</p>
                </div>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-medium">
                  Custom
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bundled Fonts Directory */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Type className="w-4 h-4 text-blue-400" /> Bundled System Typefaces ({fonts.length})
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {fonts.map((f, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400">{f.style}</span>
                  <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded">
                    {f.status}
                  </span>
                </div>
                <h3
                  className="text-lg font-bold text-white truncate"
                  style={{ fontFamily: f.name }}
                >
                  {f.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1">{f.weight}</p>
              </div>

              <div
                className="mt-4 pt-3 border-t border-slate-800/80 text-sm text-slate-300 truncate"
                style={{ fontFamily: f.name }}
              >
                {previewText}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

