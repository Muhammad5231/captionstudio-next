"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  adminCreateStyle,
  adminValidateStyle,
  adminGetMe,
} from "@/lib/api";

const CATEGORIES = [
  "VIRAL_BOLD",
  "MINIMAL",
  "KINETIC",
  "HIGHLIGHT",
  "CINEMATIC",
  "CREATOR_SOCIAL",
];

const DEFAULT_PYTHON_TEMPLATE = `"""
Custom Caption Style Definition
CaptionStudio Python SDK
"""
from apps.api.app.styles.sdk import (
    CaptionStyle,
    Color,
    Typography,
    Animation,
    Position,
    VideoContext,
    SegmentContext,
    RenderSpec,
)


class CustomStyle(CaptionStyle):
    name = "Custom Dynamic Style"
    category = "VIRAL_BOLD"
    description = "Custom high-impact typography preset with dynamic scaling"

    def get_render_spec(self, video: VideoContext, segment: SegmentContext) -> RenderSpec:
        # Scale font relative to video resolution
        base_size = int(video.height * 0.055)
        
        return RenderSpec(
            typography=Typography(
                font_family="Montserrat",
                font_size=base_size,
                font_weight=900,
                text_transform="uppercase",
                letter_spacing=1.0,
            ),
            color=Color(
                text="#FFFFFF",
                highlight="#FFE600",
                stroke_color="#000000",
                stroke_width=3.0,
                shadow_color="rgba(0, 0, 0, 0.8)",
                shadow_blur=8.0,
                shadow_offset_y=3.0,
            ),
            animation=Animation(
                type="pop",
                duration=0.2,
                scale=1.15,
                easing="ease-out",
            ),
            position=Position(
                alignment="bottom_center",
                margin_bottom=int(video.height * 0.12),
                max_width=int(video.width * 0.85),
                max_words_per_line=4,
            ),
        )
`;

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

export default function AdminStyleNewPage() {
  const router = useRouter();

  const [styleId, setStyleId] = useState("");
  const [autoId, setAutoId] = useState(true);
  const [name, setName] = useState("Custom Dynamic Style");
  const [category, setCategory] = useState("VIRAL_BOLD");
  const [description, setDescription] = useState("Custom high-impact typography preset with dynamic scaling");
  const [code, setCode] = useState(DEFAULT_PYTHON_TEMPLATE);

  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationTime, setValidationTime] = useState<number | null>(null);
  const [renderSpec, setRenderSpec] = useState<any>(null);

  // Preview controls
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "16:9" | "1:1">("9:16");
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(1.4);
  const [activeTab, setActiveTab] = useState<"preview" | "ass">("preview");

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-generate ID from Name
  useEffect(() => {
    if (autoId) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setStyleId(slug || "new-style");
    }
  }, [name, autoId]);

  // Auth check
  useEffect(() => {
    async function checkAuth() {
      try {
        await adminGetMe();
      } catch (err: any) {
        router.push("/admin/login");
      }
    }
    checkAuth();
  }, [router]);

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

  // Initial validation
  useEffect(() => {
    runValidation(DEFAULT_PYTHON_TEMPLATE);
  }, [runValidation]);

  // Debounced auto-validation on code change
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      runValidation(newCode);
    }, 600);
  };

  // Tab key indent handler
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

  // Handle Save
  const handleCreate = async () => {
    if (!styleId || !name || !code) {
      setValidationError("Please provide an ID, name, and Python code.");
      return;
    }

    setSaving(true);
    setValidationError(null);

    try {
      const created = await adminCreateStyle({
        id: styleId,
        name,
        category,
        description,
        python_code: code,
      });
      router.push(`/admin/styles/${created.id}/edit`);
    } catch (err: any) {
      setValidationError(err.message || "Failed to create style");
      setSaving(false);
    }
  };

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
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">Create New Python Style</span>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
              DRAFT
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {validating && (
            <span className="text-xs text-indigo-400 flex items-center gap-1.5 font-medium">
              <div className="w-2.5 h-2.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              Validating Sandbox...
            </span>
          )}
          {validationTime !== null && !validating && !validationError && (
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
              ⚡ {validationTime}ms
            </span>
          )}

          <button
            onClick={() => runValidation(code)}
            disabled={validating}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition-colors"
          >
            Run Sandbox
          </button>

          <button
            onClick={handleCreate}
            disabled={saving || validating}
            className="text-xs px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-sm shadow-indigo-600/30 flex items-center gap-1.5 disabled:opacity-50 transition-all"
          >
            {saving ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Publish Style
              </>
            )}
          </button>
        </div>
      </header>

      {/* Metadata Bar */}
      <div className="border-b border-slate-800/80 bg-slate-900/40 px-4 py-2 flex flex-wrap items-center gap-4 text-xs flex-shrink-0">
        <div className="flex items-center gap-2">
          <label className="text-slate-400 font-medium">ID:</label>
          <input
            type="text"
            value={styleId}
            onChange={(e) => {
              setAutoId(false);
              setStyleId(e.target.value);
            }}
            placeholder="style-identifier"
            className="bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1 text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500 w-44"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-slate-400 font-medium">Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Display Name"
            className="bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 w-48"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-slate-400 font-medium">Category:</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <label className="text-slate-400 font-medium">Desc:</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Style description..."
            className="bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 flex-1"
          />
        </div>
      </div>

      {/* Validation Error Banner */}
      {validationError && (
        <div className="bg-rose-500/10 border-b border-rose-500/20 px-4 py-2 flex items-center gap-2 text-xs text-rose-300 flex-shrink-0">
          <svg className="w-4 h-4 flex-shrink-0 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="font-mono text-[11px] truncate flex-1">{validationError}</span>
        </div>
      )}

      {/* Dual Pane Studio */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Code Editor */}
        <div className="w-1/2 border-r border-slate-800 flex flex-col bg-slate-950">
          <div className="border-b border-slate-800/80 bg-slate-900/60 px-4 py-2 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-indigo-400 font-semibold uppercase tracking-wider">
                Python Sandbox Editor
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                SDK v4.0
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              Auto-validates on typing (2s timeout)
            </span>
          </div>

          <div className="flex-1 relative">
            <textarea
              value={code}
              onChange={handleCodeChange}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              className="w-full h-full p-4 bg-slate-950 text-slate-200 font-mono text-xs leading-relaxed resize-none focus:outline-none selection:bg-indigo-900/60"
            />
          </div>
        </div>

        {/* Right Pane: Live Visual Preview */}
        <div className="w-1/2 flex flex-col bg-slate-900/30">
          {/* Preview Toolbar */}
          <div className="border-b border-slate-800 bg-slate-900/60 px-4 py-2 flex items-center justify-between flex-shrink-0">
            {/* View Tabs */}
            <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg">
              <button
                onClick={() => setActiveTab("preview")}
                className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                  activeTab === "preview" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Visual Preview
              </button>
              <button
                onClick={() => setActiveTab("ass")}
                className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                  activeTab === "ass" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Render Spec
              </button>
            </div>

            {/* Aspect Ratio Switcher */}
            <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg">
              {(["9:16", "16:9", "1:1"] as const).map((ar) => (
                <button
                  key={ar}
                  onClick={() => setAspectRatio(ar)}
                  className={`text-[11px] px-2 py-1 rounded font-mono font-medium transition-colors ${
                    aspectRatio === ar ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {ar}
                </button>
              ))}
            </div>
          </div>

          {/* Canvas Preview Area */}
          {activeTab === "preview" ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
              {/* Simulated Video Container */}
              <div
                className="relative bg-slate-900 border border-slate-700/80 rounded-xl overflow-hidden shadow-2xl flex flex-col justify-end p-6 transition-all duration-300"
                style={{
                  width:
                    aspectRatio === "9:16"
                      ? "240px"
                      : aspectRatio === "16:9"
                      ? "480px"
                      : "340px",
                  height:
                    aspectRatio === "9:16"
                      ? "426px"
                      : aspectRatio === "16:9"
                      ? "270px"
                      : "340px",
                }}
              >
                {/* Background Grid / Video simulation */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-800/40 via-transparent to-slate-950/90 pointer-events-none" />

                {/* Aspect Badge */}
                <div className="absolute top-2.5 left-2.5 text-[10px] font-mono text-slate-400 bg-slate-950/70 px-2 py-0.5 rounded border border-slate-800">
                  {aspectRatio}
                </div>

                {/* Live Simulated Caption Output */}
                <div
                  className="relative z-10 text-center select-none"
                  style={{
                    fontFamily: renderSpec?.fontFamily || "Montserrat, sans-serif",
                    fontWeight: renderSpec?.fontWeight || 900,
                    textTransform: (renderSpec?.textTransform as any) || "uppercase",
                    letterSpacing: `${renderSpec?.letterSpacing || 1}px`,
                  }}
                >
                  <div
                    style={{
                      backgroundColor: renderSpec?.backgroundColor || "transparent",
                      padding: `${renderSpec?.backgroundPaddingY || 4}px ${renderSpec?.backgroundPaddingX || 12}px`,
                      borderRadius: `${renderSpec?.backgroundBorderRadius || 6}px`,
                      display: "inline-block",
                    }}
                  >
                    {SAMPLE_WORDS.slice(0, 4).map((w, idx) => {
                      const isActive = activeWordIdx === idx;
                      const activeColor = renderSpec?.highlightColor || "#FFE600";
                      const defaultColor = renderSpec?.textColor || "#FFFFFF";
                      const strokeW = renderSpec?.strokeWidth ? renderSpec.strokeWidth / 2 : 0;
                      const strokeC = renderSpec?.strokeColor || "#000000";

                      return (
                        <span
                          key={idx}
                          className="inline-block transition-transform duration-100 mx-1"
                          style={{
                            color: isActive ? activeColor : defaultColor,
                            fontSize: aspectRatio === "9:16" ? "1.2rem" : "1.1rem",
                            transform: isActive ? "scale(1.15)" : "scale(1.0)",
                            WebkitTextStroke: strokeW > 0 ? `${strokeW}px ${strokeC}` : undefined,
                            textShadow: `${renderSpec?.shadowOffsetX || 0}px ${
                              renderSpec?.shadowOffsetY || 3
                            }px ${renderSpec?.shadowBlur || 6}px ${
                              renderSpec?.shadowColor || "rgba(0,0,0,0.8)"
                            }`,
                          }}
                        >
                          {w.word}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Playback Simulation Controls */}
              <div className="mt-4 flex items-center gap-3 bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-xl backdrop-blur-sm z-20">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                >
                  {isPlaying ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  )}
                </button>

                <input
                  type="range"
                  min="0"
                  max="3.6"
                  step="0.05"
                  value={currentTime}
                  onChange={(e) => {
                    setIsPlaying(false);
                    setCurrentTime(parseFloat(e.target.value));
                  }}
                  className="w-36 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />

                <span className="text-[11px] font-mono text-slate-400 min-w-[40px]">
                  {currentTime.toFixed(2)}s
                </span>
              </div>
            </div>
          ) : (
            /* Render Spec Inspector */
            <div className="flex-1 p-4 overflow-auto font-mono text-xs text-slate-300 bg-slate-950/60">
              <pre className="whitespace-pre-wrap">{JSON.stringify(renderSpec, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
