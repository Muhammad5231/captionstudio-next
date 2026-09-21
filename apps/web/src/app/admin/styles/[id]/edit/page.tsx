"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  adminGetStyle,
  adminValidateStyle,
  adminUpdateStyle,
  adminGetMe,
  StyleDetail,
} from "@/lib/api";

const CATEGORIES = [
  "VIRAL_BOLD",
  "MINIMAL",
  "KINETIC",
  "HIGHLIGHT",
  "CINEMATIC",
  "CREATOR_SOCIAL",
];

const SAMPLE_WORDS = [
  { word: "THIS", start: 0.0, end: 0.4 },
  { word: "IS", start: 0.4, end: 0.7 },
  { word: "HOW", start: 0.7, end: 1.1 },
  { word: "PREMIUM", start: 1.1, end: 1.7 },
  { word: "CAPTIONS", start: 1.7, end: 2.3 },
  { word: "LOOK", start: 2.3, end: 2.7 },
  { word: "IN", start: 2.7, end: 3.0 },
  { word: "MOTION", start: 3.0, end: 3.6 },
];

export default function AdminStyleEditPage() {
  const params = useParams();
  const router = useRouter();
  const styleId = params.id as string;

  const [style, setStyle] = useState<StyleDetail | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("VIRAL_BOLD");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationTime, setValidationTime] = useState<number | null>(null);
  const [renderSpec, setRenderSpec] = useState<any>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Preview controls
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "16:9" | "1:1">("9:16");
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(1.4);
  const [activeTab, setActiveTab] = useState<"preview" | "ass">("preview");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load style data
  useEffect(() => {
    async function load() {
      try {
        await adminGetMe();
        const data = await adminGetStyle(styleId);
        setStyle(data);
        setCode(data.python_code || "");
        setName(data.name || "");
        setCategory(data.category || "VIRAL_BOLD");
        setDescription(data.description || "");
        if (data.render_spec) {
          setRenderSpec(data.render_spec);
        }
      } catch (err: any) {
        if (err.message?.includes("Not authenticated") || err.message?.includes("401")) {
          router.push("/admin/login");
        } else {
          setValidationError(err.message || "Failed to load style");
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [styleId, router]);

  // Validation function
  const runValidation = useCallback(
    async (codeToValidate: string) => {
      setValidating(true);
      try {
        const res = await adminValidateStyle(codeToValidate);
        if (res.is_valid && res.render_spec) {
          setRenderSpec(res.render_spec);
          setValidationError(null);
          setValidationTime(res.execution_time_ms);
        } else {
          setValidationError(res.error || "Sandbox validation failed");
          setValidationTime(res.execution_time_ms);
        }
      } catch (err: any) {
        setValidationError(err.message || "Validation error");
      } finally {
        setValidating(false);
      }
    },
    []
  );

  // Debounced auto-validation on typing
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
    setSaveSuccess(false);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      runValidation(newCode);
    }, 600);
  };

  // Tab key handler for code textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const value = target.value;
      target.value = value.substring(0, start) + "    " + value.substring(end);
      target.selectionStart = target.selectionEnd = start + 4;
      setCode(target.value);
    }
  };

  // Playback timer for preview simulation
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 0.05;
        return next > 3.8 ? 0.0 : next;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Save changes
  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setValidationError(null);

    try {
      const updated = await adminUpdateStyle(styleId, {
        name,
        category,
        description,
        python_code: code,
      });
      setStyle(updated);
      setSaveSuccess(true);
      if (updated.render_spec) setRenderSpec(updated.render_spec);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setValidationError(err.message || "Failed to save style changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  // Active word calculation for preview
  const activeWordIdx = SAMPLE_WORDS.findIndex(
    (w) => currentTime >= w.start && currentTime <= w.end
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col h-screen overflow-hidden">
      {/* Editor Header Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 px-4 py-2.5 flex items-center justify-between flex-shrink-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/styles"
            className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Styles
          </Link>
          <div className="h-4 w-px bg-slate-800" />
          <h1 className="text-sm font-bold text-white flex items-center gap-2">
            <span>{name || styleId}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
              v{style?.current_version || 1}
            </span>
            {style?.is_builtin && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Built-in
              </span>
            )}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {validationTime !== null && !validationError && (
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Compiled in {validationTime}ms
            </span>
          )}

          {saveSuccess && (
            <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Published v{style?.current_version}!
            </span>
          )}

          <button
            onClick={() => runValidation(code)}
            disabled={validating}
            className="text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors flex items-center gap-1.5"
          >
            {validating ? "Running..." : "Test Sandbox"}
          </button>

          <button
            onClick={handleSave}
            disabled={saving || validating}
            className="text-xs px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-sm shadow-indigo-600/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {saving ? "Publishing..." : "Save & Publish"}
          </button>
        </div>
      </header>

      {/* Dual Pane Studio Body */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Pane: Metadata & Python Code Editor */}
        <div className="w-full md:w-1/2 lg:w-3/5 border-r border-slate-800 flex flex-col h-full bg-slate-950 overflow-hidden">
          {/* Metadata Compact Row */}
          <div className="p-3 border-b border-slate-800 bg-slate-900/40 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                Style Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Visual aesthetic summary..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Validation Error Banner */}
          {validationError && (
            <div className="p-3 bg-rose-500/10 border-b border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
              <svg className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <pre className="font-mono whitespace-pre-wrap text-[11px] overflow-x-auto flex-1">{validationError}</pre>
            </div>
          )}

          {/* Code Textarea with line numbers */}
          <div className="flex-1 relative overflow-hidden bg-slate-950 flex">
            <textarea
              ref={textareaRef}
              value={code}
              onChange={handleCodeChange}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              className="w-full h-full p-4 font-mono text-xs text-indigo-100 bg-transparent resize-none focus:outline-none leading-relaxed selection:bg-indigo-600/40"
              style={{ tabSize: 4 }}
            />
          </div>
        </div>

        {/* Right Pane: Live Preview & Inspection */}
        <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col h-full bg-slate-900/30 overflow-y-auto">
          {/* Preview Toolbar */}
          <div className="p-3 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between gap-2 flex-shrink-0">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              {(["9:16", "16:9", "1:1"] as const).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    aspectRatio === ratio
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1"
              >
                {isPlaying ? "Pause" : "Play"}
              </button>
            </div>
          </div>

          {/* Preview Canvas Container */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950/60 relative">
            {/* Viewport Frame according to Aspect Ratio */}
            <div
              className={`relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-end transition-all duration-300 ${
                aspectRatio === "9:16"
                  ? "w-64 h-[440px]"
                  : aspectRatio === "16:9"
                  ? "w-full max-w-sm h-52"
                  : "w-72 h-72"
              }`}
            >
              {/* Simulated video background */}
              <div className="absolute inset-0 bg-gradient-to-b from-slate-800/40 via-slate-900/80 to-black/90 pointer-events-none" />

              {/* Rendered Caption Container */}
              <div
                className="relative z-10 w-full p-4 flex flex-col items-center justify-center text-center transition-all duration-150"
                style={{
                  paddingBottom: `${100 - (renderSpec?.positionY || 80)}%`,
                }}
              >
                <div
                  className="inline-block transition-all duration-150"
                  style={{
                    backgroundColor: renderSpec?.backgroundColor || "transparent",
                    padding: `${renderSpec?.backgroundPaddingY || 4}px ${
                      renderSpec?.backgroundPaddingX || 8
                    }px`,
                    borderRadius: `${renderSpec?.backgroundBorderRadius || 6}px`,
                  }}
                >
                  <p
                    className="font-bold flex flex-wrap justify-center gap-1.5 transition-all duration-150"
                    style={{
                      fontFamily: renderSpec?.fontFamily || "Montserrat, sans-serif",
                      fontSize: `${Math.round((renderSpec?.fontSize || 42) * 0.35)}px`,
                      fontWeight: renderSpec?.fontWeight || 800,
                      textTransform: renderSpec?.textTransform || "none",
                      letterSpacing: `${renderSpec?.letterSpacing || 0}px`,
                      lineHeight: renderSpec?.lineHeight || 1.2,
                    }}
                  >
                    {SAMPLE_WORDS.map((w, idx) => {
                      const isActive = idx === activeWordIdx;
                      return (
                        <span
                          key={idx}
                          className="transition-all duration-100"
                          style={{
                            color: isActive
                              ? renderSpec?.highlightColor || "#FFE600"
                              : renderSpec?.textColor || "#FFFFFF",
                            transform:
                              isActive && renderSpec?.animation?.type === "word-pop"
                                ? `scale(${renderSpec?.animation?.scale || 1.15})`
                                : "scale(1.0)",
                            textShadow:
                              renderSpec?.strokeWidth && renderSpec.strokeWidth > 0
                                ? `0 0 ${renderSpec.strokeWidth}px ${
                                    renderSpec?.strokeColor || "#000000"
                                  }`
                                : undefined,
                          }}
                        >
                          {w.word}
                        </span>
                      );
                    })}
                  </p>
                </div>
              </div>

              {/* Time Scrubber */}
              <div className="absolute bottom-2 left-3 right-3 z-20 flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="3.8"
                  step="0.05"
                  value={currentTime}
                  onChange={(e) => {
                    setIsPlaying(false);
                    setCurrentTime(parseFloat(e.target.value));
                  }}
                  className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <span className="text-[10px] font-mono text-slate-400 w-10 text-right">
                  {currentTime.toFixed(1)}s
                </span>
              </div>
            </div>
          </div>

          {/* Render Spec Inspector Footer */}
          <div className="border-t border-slate-800 p-4 bg-slate-900/60">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Render Specification Output
            </h3>
            <pre className="text-[11px] font-mono text-indigo-300/90 bg-slate-950 p-3 rounded-xl border border-slate-800/80 overflow-x-auto max-h-40">
              {JSON.stringify(renderSpec, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
