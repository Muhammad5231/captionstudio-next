"use client";

import React, { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Download,
  Palette,
  Type,
  Move,
  Sparkles,
  Layers,
  Save,
  Check,
  Smartphone,
  Tv,
  Square,
  Shield,
  Clock,
  Trash2,
  Split,
  GitMerge,
  Plus,
} from "lucide-react";
import { CaptionRenderSpec, CaptionDisplayMode, CaptionAnimationType } from "@captionstudio/caption-schema";
import {
  getProject,
  updateCaptionTrack,
  updateTrackStyle,
  splitCaptionSegment,
  mergeCaptionSegments,
  getAssetStreamUrl,
  ProjectData,
  CaptionTrackData,
} from "@/lib/api";
import { formatTime } from "@/lib/utils";
import { useEditorHistory } from "@/hooks/useEditorHistory";
import { CaptionPreviewRenderer } from "@/components/editor/CaptionPreviewRenderer";
import { TimelineTrack } from "@/components/editor/TimelineTrack";
import { StylesGallery } from "@/components/editor/StylesGallery";
import { ExportModal } from "@/components/editor/ExportModal";

const DEFAULT_SPEC: CaptionRenderSpec = {
  version: 1,
  fontFamily: "Montserrat",
  fontSize: 42,
  fontWeight: "800",
  fontStyle: "normal",
  textTransform: "uppercase",
  letterSpacing: 0,
  lineHeight: 1.2,
  textColor: "#FFFFFF",
  highlightColor: "#FFE600",
  secondaryColor: "#00FF88",
  strokeColor: "#000000",
  strokeWidth: 6,
  shadowColor: "rgba(0, 0, 0, 0.8)",
  shadowBlur: 8,
  shadowOffsetX: 2,
  shadowOffsetY: 4,
  backgroundColor: "transparent",
  backgroundPaddingX: 16,
  backgroundPaddingY: 8,
  backgroundBorderRadius: 8,
  positionY: 78,
  positionX: 50,
  alignment: "center",
  maxWordsPerLine: 4,
  maxLines: 2,
  safeAreaMargin: 5,
  animation: {
    type: "word-pop",
    durationMs: 120,
    scale: 1.18,
  },
  displayMode: "segment",
};

export default function EditorPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);

  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1" | "4:5">("16:9");
  const [showSafeArea, setShowSafeArea] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"styles" | "typography" | "colors" | "position" | "animation">("styles");
  const [bottomMode, setBottomMode] = useState<"timeline" | "segments">("timeline");

  // Video State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // History & Track
  const { currentTrack, setCurrentTrack, undo, redo, canUndo, canRedo, resetHistory } = useEditorHistory(null);
  const [renderSpec, setRenderSpec] = useState<CaptionRenderSpec>(DEFAULT_SPEC);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  // Load project & captions
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await getProject(projectId);
        setProject(data);

        // Find primary video asset
        const videoAsset = data.assets.find((a) => a.type === "VIDEO");
        if (videoAsset) {
          setVideoUrl(getAssetStreamUrl(videoAsset.id));
        }

        // Setup default caption track
        const track = data.caption_tracks.find((t) => t.is_default) || data.caption_tracks[0];
        if (track) {
          resetHistory(track);
          if (track.style) {
            setRenderSpec(track.style);
          }
        }
      } catch (err) {
        console.error("Failed to load project:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [projectId, resetHistory]);

  // Video Controls
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  // Style change handler
  const handleStyleChange = (updatedSpec: CaptionRenderSpec) => {
    setRenderSpec(updatedSpec);
    if (currentTrack) {
      const updatedTrack = { ...currentTrack, style: updatedSpec };
      setCurrentTrack(updatedTrack, false);
      // Auto-save style to backend
      setSaveStatus("saving");
      updateTrackStyle(projectId, currentTrack.id, updatedSpec)
        .then(() => setSaveStatus("saved"))
        .catch(() => setSaveStatus("idle"));
    }
  };

  // Timeline operations
  const handleSplitAtPlayhead = async () => {
    if (!currentTrack) return;
    const targetSeg = currentTrack.segments.find(
      (s) => currentTime >= s.start_time && currentTime <= s.end_time
    );
    if (!targetSeg) return;

    try {
      setSaveStatus("saving");
      const updated = await splitCaptionSegment(projectId, currentTrack.id, targetSeg.id, undefined, currentTime);
      setCurrentTrack(updated, true);
      setSaveStatus("saved");
    } catch (err) {
      console.error("Split failed:", err);
      setSaveStatus("idle");
    }
  };

  const handleMergeSegments = async (segId1: string, segId2: string) => {
    if (!currentTrack) return;
    try {
      setSaveStatus("saving");
      const updated = await mergeCaptionSegments(projectId, currentTrack.id, segId1, segId2);
      setCurrentTrack(updated, true);
      setSaveStatus("saved");
    } catch (err) {
      console.error("Merge failed:", err);
      setSaveStatus("idle");
    }
  };

  const handleSegmentTextChange = (segId: string, newText: string) => {
    if (!currentTrack) return;
    const nextSegs = currentTrack.segments.map((s) => (s.id === segId ? { ...s, text: newText } : s));
    const nextTrack = { ...currentTrack, segments: nextSegs };
    setCurrentTrack(nextTrack, false);
  };

  const handleSaveCaptions = async () => {
    if (!currentTrack) return;
    setSaveStatus("saving");
    try {
      await updateCaptionTrack(projectId, currentTrack.id, {
        segments: currentTrack.segments,
        style: renderSpec,
      });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      console.error("Save failed:", err);
      setSaveStatus("idle");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-zinc-400">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent mx-auto mb-3" />
          <p className="text-sm font-medium">Loading Professional Editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-black text-zinc-200">
      {/* 1. Header Toolbar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4">
        {/* Left: Back & Project Info */}
        <div className="flex items-center gap-3">
          <Link
            href="/projects"
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Projects</span>
          </Link>
          <span className="h-4 w-px bg-zinc-800" />
          <h1 className="font-semibold text-sm text-white truncate max-w-xs">
            {project?.name || "Caption Editor"}
          </h1>
          <span className="rounded bg-indigo-950/80 border border-indigo-800/60 px-2 py-0.5 text-[10px] font-mono text-indigo-300">
            {currentTrack?.segments.length || 0} segments
          </span>
        </div>

        {/* Center: Undo/Redo & Aspect Ratio & Safe Areas */}
        <div className="flex items-center gap-2">
          {/* Undo / Redo */}
          <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900/60 p-0.5">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:opacity-30 transition-colors"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:opacity-30 transition-colors"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="h-4 w-4" />
            </button>
          </div>

          <span className="h-4 w-px bg-zinc-800" />

          {/* Aspect Ratio Switcher */}
          <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900/60 p-0.5 text-xs">
            {(["16:9", "9:16", "1:1", "4:5"] as const).map((ratio) => (
              <button
                key={ratio}
                onClick={() => setAspectRatio(ratio)}
                className={`rounded px-2 py-1 text-[11px] font-mono font-medium transition-colors ${
                  aspectRatio === ratio
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>

          {/* Safe Area Guide Toggle */}
          <button
            onClick={() => setShowSafeArea(!showSafeArea)}
            className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors ${
              showSafeArea
                ? "border-cyan-500 bg-cyan-950/40 text-cyan-300"
                : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200"
            }`}
            title="Toggle Safe Area Overlay for TikTok / Reels"
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Safe Zone</span>
          </button>
        </div>

        {/* Right: Auto-Save Status & Export Modal Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
            {saveStatus === "saving" && <span className="text-amber-400 animate-pulse">Saving...</span>}
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1 text-emerald-400">
                <Check className="h-3 w-3" /> Saved
              </span>
            )}
          </div>
          <button
            onClick={handleSaveCaptions}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save</span>
          </button>
          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/30"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export</span>
          </button>
        </div>
      </header>

      {/* 2. Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side: Inspector & Style Tabs */}
        <div className="flex w-96 flex-col border-r border-zinc-800 bg-zinc-950">
          {/* Tab Selector */}
          <div className="flex border-b border-zinc-800 bg-zinc-900/40 px-2 pt-2">
            {[
              { id: "styles", label: "Styles (60+)", icon: Palette },
              { id: "typography", label: "Type", icon: Type },
              { id: "colors", label: "Colors", icon: Sparkles },
              { id: "position", label: "Layout", icon: Move },
              { id: "animation", label: "Anim", icon: Layers },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2 text-xs font-medium transition-colors ${
                    activeTab === tab.id
                      ? "border-indigo-500 text-indigo-400"
                      : "border-transparent text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Contents */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* TAB: STYLES */}
            {activeTab === "styles" && (
              <StylesGallery
                currentSpec={renderSpec}
                onSelectStyle={(newSpec) => handleStyleChange(newSpec)}
              />
            )}

            {/* TAB: TYPOGRAPHY */}
            {activeTab === "typography" && (
              <div className="flex flex-col gap-4 text-xs">
                {/* Font Family */}
                <div>
                  <label className="font-medium text-zinc-400">Font Family</label>
                  <select
                    value={renderSpec.fontFamily}
                    onChange={(e) => handleStyleChange({ ...renderSpec, fontFamily: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2 px-3 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    {[
                      "Montserrat",
                      "Impact",
                      "Inter",
                      "Arial",
                      "Segoe UI",
                      "Trebuchet MS",
                      "Georgia",
                      "Times New Roman",
                      "Tahoma",
                      "Verdana",
                    ].map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Font Size */}
                <div>
                  <div className="flex justify-between items-center">
                    <label className="font-medium text-zinc-400">Font Size</label>
                    <span className="font-mono text-indigo-400">{renderSpec.fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={100}
                    value={renderSpec.fontSize}
                    onChange={(e) => handleStyleChange({ ...renderSpec, fontSize: parseInt(e.target.value) })}
                    className="mt-1.5 w-full accent-indigo-500"
                  />
                </div>

                {/* Font Weight */}
                <div>
                  <label className="font-medium text-zinc-400">Font Weight</label>
                  <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                    {["400", "600", "800", "900"].map((w) => (
                      <button
                        key={w}
                        onClick={() => handleStyleChange({ ...renderSpec, fontWeight: w })}
                        className={`rounded-lg py-1.5 font-mono text-[11px] font-semibold border ${
                          renderSpec.fontWeight === w
                            ? "border-indigo-500 bg-indigo-950/40 text-indigo-300"
                            : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                        }`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text Transform */}
                <div>
                  <label className="font-medium text-zinc-400">Text Casing</label>
                  <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                    {[
                      { id: "uppercase", label: "UPPER" },
                      { id: "none", label: "Regular" },
                      { id: "lowercase", label: "lower" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => handleStyleChange({ ...renderSpec, textTransform: opt.id as any })}
                        className={`rounded-lg py-1.5 text-[11px] font-medium border ${
                          renderSpec.textTransform === opt.id
                            ? "border-indigo-500 bg-indigo-950/40 text-indigo-300"
                            : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Letter Spacing */}
                <div>
                  <div className="flex justify-between items-center">
                    <label className="font-medium text-zinc-400">Letter Spacing</label>
                    <span className="font-mono text-indigo-400">{renderSpec.letterSpacing}px</span>
                  </div>
                  <input
                    type="range"
                    min={-2}
                    max={10}
                    step={1}
                    value={renderSpec.letterSpacing}
                    onChange={(e) => handleStyleChange({ ...renderSpec, letterSpacing: parseFloat(e.target.value) })}
                    className="mt-1.5 w-full accent-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* TAB: COLORS */}
            {activeTab === "colors" && (
              <div className="flex flex-col gap-4 text-xs">
                {/* Text Color */}
                <div>
                  <label className="font-medium text-zinc-400">Text Color</label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      type="color"
                      value={renderSpec.textColor}
                      onChange={(e) => handleStyleChange({ ...renderSpec, textColor: e.target.value })}
                      className="h-8 w-12 cursor-pointer rounded border border-zinc-700 bg-zinc-900 p-0.5"
                    />
                    <input
                      type="text"
                      value={renderSpec.textColor}
                      onChange={(e) => handleStyleChange({ ...renderSpec, textColor: e.target.value })}
                      className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 py-1.5 px-3 font-mono text-white text-xs"
                    />
                  </div>
                </div>

                {/* Highlight / Active Word Color */}
                <div>
                  <label className="font-medium text-zinc-400">Active Word Highlight Color</label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      type="color"
                      value={renderSpec.highlightColor}
                      onChange={(e) => handleStyleChange({ ...renderSpec, highlightColor: e.target.value })}
                      className="h-8 w-12 cursor-pointer rounded border border-zinc-700 bg-zinc-900 p-0.5"
                    />
                    <input
                      type="text"
                      value={renderSpec.highlightColor}
                      onChange={(e) => handleStyleChange({ ...renderSpec, highlightColor: e.target.value })}
                      className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 py-1.5 px-3 font-mono text-white text-xs"
                    />
                  </div>
                </div>

                {/* Stroke / Outline */}
                <div>
                  <div className="flex justify-between items-center">
                    <label className="font-medium text-zinc-400">Outline Stroke Width</label>
                    <span className="font-mono text-indigo-400">{renderSpec.strokeWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={16}
                    step={1}
                    value={renderSpec.strokeWidth}
                    onChange={(e) => handleStyleChange({ ...renderSpec, strokeWidth: parseFloat(e.target.value) })}
                    className="mt-1.5 w-full accent-indigo-500"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="color"
                      value={renderSpec.strokeColor.startsWith("#") ? renderSpec.strokeColor : "#000000"}
                      onChange={(e) => handleStyleChange({ ...renderSpec, strokeColor: e.target.value })}
                      className="h-8 w-12 cursor-pointer rounded border border-zinc-700 bg-zinc-900 p-0.5"
                    />
                    <input
                      type="text"
                      value={renderSpec.strokeColor}
                      onChange={(e) => handleStyleChange({ ...renderSpec, strokeColor: e.target.value })}
                      className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 py-1.5 px-3 font-mono text-white text-xs"
                    />
                  </div>
                </div>

                {/* Shadow Blur */}
                <div>
                  <div className="flex justify-between items-center">
                    <label className="font-medium text-zinc-400">Shadow Blur</label>
                    <span className="font-mono text-indigo-400">{renderSpec.shadowBlur}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={25}
                    value={renderSpec.shadowBlur}
                    onChange={(e) => handleStyleChange({ ...renderSpec, shadowBlur: parseFloat(e.target.value) })}
                    className="mt-1.5 w-full accent-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* TAB: POSITION & LAYOUT */}
            {activeTab === "position" && (
              <div className="flex flex-col gap-4 text-xs">
                {/* Vertical Position */}
                <div>
                  <div className="flex justify-between items-center">
                    <label className="font-medium text-zinc-400">Vertical Position (Y%)</label>
                    <span className="font-mono text-indigo-400">{renderSpec.positionY}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={95}
                    value={renderSpec.positionY}
                    onChange={(e) => handleStyleChange({ ...renderSpec, positionY: parseFloat(e.target.value) })}
                    className="mt-1.5 w-full accent-indigo-500"
                  />
                </div>

                {/* Alignment */}
                <div>
                  <label className="font-medium text-zinc-400">Alignment</label>
                  <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                    {["left", "center", "right"].map((align) => (
                      <button
                        key={align}
                        onClick={() => handleStyleChange({ ...renderSpec, alignment: align as any })}
                        className={`rounded-lg py-1.5 capitalize text-[11px] font-medium border ${
                          renderSpec.alignment === align
                            ? "border-indigo-500 bg-indigo-950/40 text-indigo-300"
                            : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                        }`}
                      >
                        {align}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Display Mode */}
                <div>
                  <label className="font-medium text-zinc-400">Display Mode</label>
                  <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                    {[
                      { id: "segment", label: "Full Line" },
                      { id: "chunk", label: "2-3 Words" },
                      { id: "word", label: "1 Word" },
                    ].map((dm) => (
                      <button
                        key={dm.id}
                        onClick={() => handleStyleChange({ ...renderSpec, displayMode: dm.id as CaptionDisplayMode })}
                        className={`rounded-lg py-1.5 text-[11px] font-medium border ${
                          renderSpec.displayMode === dm.id
                            ? "border-indigo-500 bg-indigo-950/40 text-indigo-300"
                            : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                        }`}
                      >
                        {dm.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ANIMATION */}
            {activeTab === "animation" && (
              <div className="flex flex-col gap-4 text-xs">
                <div>
                  <label className="font-medium text-zinc-400">Animation Type</label>
                  <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                    {[
                      { id: "word-pop", label: "Word Pop" },
                      { id: "bounce", label: "Bounce" },
                      { id: "karaoke", label: "Karaoke" },
                      { id: "zoom", label: "Zoom Flash" },
                      { id: "elastic", label: "Elastic" },
                      { id: "slide", label: "Slide Up" },
                      { id: "fade", label: "Soft Fade" },
                      { id: "none", label: "None / Static" },
                    ].map((anim) => (
                      <button
                        key={anim.id}
                        onClick={() =>
                          handleStyleChange({
                            ...renderSpec,
                            animation: { ...renderSpec.animation, type: anim.id as CaptionAnimationType },
                          })
                        }
                        className={`rounded-lg py-2 px-2 text-left text-[11px] font-medium border ${
                          renderSpec.animation.type === anim.id
                            ? "border-indigo-500 bg-indigo-950/40 text-indigo-300"
                            : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                        }`}
                      >
                        {anim.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center">
                    <label className="font-medium text-zinc-400">Pop Scale Multiplier</label>
                    <span className="font-mono text-indigo-400">{renderSpec.animation.scale}x</span>
                  </div>
                  <input
                    type="range"
                    min={1.05}
                    max={1.4}
                    step={0.05}
                    value={renderSpec.animation.scale}
                    onChange={(e) =>
                      handleStyleChange({
                        ...renderSpec,
                        animation: { ...renderSpec.animation, scale: parseFloat(e.target.value) },
                      })
                    }
                    className="mt-1.5 w-full accent-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center / Right: Canvas Preview & Dual Bottom Panel */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Canvas Viewport */}
          <div className="flex flex-1 items-center justify-center p-6 bg-zinc-950/80 overflow-hidden">
            <CaptionPreviewRenderer
              videoUrl={videoUrl}
              captionTrack={currentTrack}
              renderSpec={renderSpec}
              aspectRatio={aspectRatio}
              currentTime={currentTime}
              showSafeArea={showSafeArea}
              onTimeUpdate={(t) => setCurrentTime(t)}
              onDurationChange={(d) => setDuration(d)}
              videoRef={videoRef}
            />
          </div>

          {/* Bottom Editor Section */}
          <div className="flex flex-col border-t border-zinc-800 bg-zinc-950 p-3 max-h-80">
            {/* View Mode Toggle Header */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800/80">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setBottomMode("timeline")}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                    bottomMode === "timeline"
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Visual Timeline
                </button>
                <button
                  onClick={() => setBottomMode("segments")}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                    bottomMode === "segments"
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Text & Word List ({currentTrack?.segments.length || 0})
                </button>
              </div>

              {/* Speed Controller */}
              <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-400">
                <span>Speed:</span>
                {[0.5, 1, 1.5, 2].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => changeSpeed(spd)}
                    className={`rounded px-1.5 py-0.5 ${
                      playbackSpeed === spd
                        ? "bg-zinc-800 text-indigo-400 font-bold"
                        : "hover:text-white"
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom View Modes */}
            {bottomMode === "timeline" ? (
              <TimelineTrack
                duration={duration}
                currentTime={currentTime}
                captionTrack={currentTrack}
                onSeek={handleSeek}
                onSplitAtCurrentTime={handleSplitAtPlayhead}
                isPlaying={isPlaying}
                onTogglePlay={togglePlay}
              />
            ) : (
              /* Segment List Editor */
              <div className="flex flex-col gap-2 overflow-y-auto max-h-56 pr-2">
                {currentTrack?.segments.map((seg, idx) => {
                  const isActive = currentTime >= seg.start_time && currentTime <= seg.end_time;
                  const nextSeg = currentTrack.segments[idx + 1];

                  return (
                    <div
                      key={seg.id}
                      className={`flex items-center justify-between gap-3 rounded-xl border p-2.5 transition-all ${
                        isActive
                          ? "border-amber-500/80 bg-amber-950/20"
                          : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700"
                      }`}
                    >
                      {/* Timestamp & Index */}
                      <button
                        onClick={() => handleSeek(seg.start_time)}
                        className="flex flex-col text-left font-mono text-[11px] text-zinc-400 hover:text-indigo-400"
                      >
                        <span className="font-semibold text-zinc-300">#{idx + 1}</span>
                        <span>
                          {formatTime(seg.start_time)} - {formatTime(seg.end_time)}
                        </span>
                      </button>

                      {/* Text Input */}
                      <input
                        type="text"
                        value={seg.text}
                        onChange={(e) => handleSegmentTextChange(seg.id, e.target.value)}
                        className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 py-1.5 px-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                      />

                      {/* Operations */}
                      <div className="flex items-center gap-1">
                        {nextSeg && (
                          <button
                            onClick={() => handleMergeSegments(seg.id, nextSeg.id)}
                            className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-indigo-300 transition-colors"
                            title="Merge with next segment"
                          >
                            <GitMerge className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            if (!currentTrack) return;
                            const next = currentTrack.segments.filter((s) => s.id !== seg.id);
                            setCurrentTrack({ ...currentTrack, segments: next }, true);
                          }}
                          className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-red-400 transition-colors"
                          title="Delete segment"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        projectId={projectId}
        renderSpec={renderSpec}
      />
    </div>
  );
}

