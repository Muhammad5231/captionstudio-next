"use client";

import React, { useRef, useState } from "react";
import {
  Scissors,
  ZoomIn,
  ZoomOut,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Film,
  Music,
  FileText,
  Copy,
  Trash2,
  GitMerge,
} from "lucide-react";
import { CaptionTrackData, CaptionSegmentData } from "@/lib/api";
import { formatTime } from "@/lib/utils";

interface TimelineTrackProps {
  duration: number;
  currentTime: number;
  captionTrack?: CaptionTrackData | null;
  selectedSegmentId?: string | null;
  onSelectSegment?: (segment: CaptionSegmentData) => void;
  onSeek: (time: number) => void;
  onSplitAtCurrentTime?: () => void;
  onMergeSelected?: () => void;
  onDuplicateSelected?: () => void;
  onDeleteSelected?: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export const TimelineTrack: React.FC<TimelineTrackProps> = ({
  duration,
  currentTime,
  captionTrack,
  selectedSegmentId,
  onSelectSegment,
  onSeek,
  onSplitAtCurrentTime,
  onMergeSelected,
  onDuplicateSelected,
  onDeleteSelected,
  isPlaying,
  onTogglePlay,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1x to 4x

  const totalDuration = Math.max(duration || 1, 1);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(percent * totalDuration);
  };

  const playheadPercent = Math.min(100, Math.max(0, (currentTime / totalDuration) * 100));

  // Generate tick marks for time ruler
  const tickCount = Math.max(6, Math.min(40, Math.round(10 * zoomLevel)));
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => {
    const sec = (i / tickCount) * totalDuration;
    return {
      percent: (i / tickCount) * 100,
      label: formatTime(sec),
    };
  });

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-950 p-3 select-none">
      {/* Top Transport and Tool Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-800 pb-2 gap-2">
        {/* Playback Transport */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSeek(Math.max(0, currentTime - 1))}
            className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            title="Seek Backward 1s (Shift+←)"
          >
            <SkipBack className="h-4 w-4" />
          </button>
          <button
            onClick={onTogglePlay}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-500 shadow-sm transition-colors"
            title="Play / Pause (Space)"
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current" />}
            <span>{isPlaying ? "Pause" : "Play"}</span>
          </button>
          <button
            onClick={() => onSeek(Math.min(totalDuration, currentTime + 1))}
            className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            title="Seek Forward 1s (Shift+→)"
          >
            <SkipForward className="h-4 w-4" />
          </button>

          <div className="ml-3 font-mono text-xs text-zinc-300">
            <span className="text-indigo-400 font-medium">{formatTime(currentTime)}</span>
            <span className="text-zinc-600"> / </span>
            <span>{formatTime(totalDuration)}</span>
          </div>
        </div>

        {/* Timeline Editing Tools: Split, Merge, Duplicate, Delete, Zoom */}
        <div className="flex items-center gap-2">
          {onSplitAtCurrentTime && (
            <button
              onClick={onSplitAtCurrentTime}
              className="flex items-center gap-1 rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-[11px] font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
              title="Split Segment at Playhead"
            >
              <Scissors className="h-3 w-3 text-amber-400" />
              <span className="hidden sm:inline">Split</span>
            </button>
          )}

          {onMergeSelected && (
            <button
              onClick={onMergeSelected}
              className="flex items-center gap-1 rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-[11px] font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
              title="Merge with Next Segment"
            >
              <GitMerge className="h-3 w-3 text-cyan-400" />
              <span className="hidden sm:inline">Merge</span>
            </button>
          )}

          {onDuplicateSelected && (
            <button
              onClick={onDuplicateSelected}
              className="flex items-center gap-1 rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-[11px] font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
              title="Duplicate Selected Segment"
            >
              <Copy className="h-3 w-3 text-purple-400" />
              <span className="hidden sm:inline">Duplicate</span>
            </button>
          )}

          {onDeleteSelected && (
            <button
              onClick={onDeleteSelected}
              className="flex items-center gap-1 rounded border border-rose-900/40 bg-rose-950/20 px-2 py-1 text-[11px] font-medium text-rose-300 hover:bg-rose-900/40 transition-colors"
              title="Delete Selected (Delete key)"
            >
              <Trash2 className="h-3 w-3 text-rose-400" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          )}

          {/* Zoom controls */}
          <div className="flex items-center gap-1 border-l border-zinc-800 pl-2">
            <button
              onClick={() => setZoomLevel((z) => Math.max(1, z - 0.5))}
              className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="font-mono text-[10px] text-zinc-400 min-w-[20px] text-center">{zoomLevel}x</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(4, z + 0.5))}
              className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Multi-Track Timeline Canvas with Track Headers */}
      <div className="flex border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/60">
        {/* Track Headers Column */}
        <div className="w-20 shrink-0 border-r border-zinc-800 bg-zinc-950/80 flex flex-col text-[10px] font-mono text-zinc-400">
          <div className="h-5 border-b border-zinc-800 px-2 flex items-center text-zinc-500">
            RULER
          </div>
          <div className="h-7 border-b border-zinc-800/80 px-2 flex items-center gap-1 text-sky-400">
            <Film className="h-3 w-3" /> VIDEO
          </div>
          <div className="h-7 border-b border-zinc-800/80 px-2 flex items-center gap-1 text-emerald-400">
            <Music className="h-3 w-3" /> AUDIO
          </div>
          <div className="h-10 px-2 flex items-center gap-1 text-indigo-400">
            <FileText className="h-3 w-3" /> CAPTIONS
          </div>
        </div>

        {/* Scrollable Tracks Canvas */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div
            ref={containerRef}
            onClick={handleTimelineClick}
            className="relative cursor-pointer select-none"
            style={{ width: `${zoomLevel * 100}%`, minWidth: "600px" }}
          >
            {/* 1. Time Ruler Ticks */}
            <div className="relative h-5 border-b border-zinc-800 bg-zinc-950/90 flex items-center">
              {ticks.map((t, idx) => (
                <div
                  key={idx}
                  className="absolute top-0 flex flex-col items-center pointer-events-none"
                  style={{ left: `${t.percent}%` }}
                >
                  <div className="h-1.5 w-px bg-zinc-700" />
                  <span className="text-[9px] font-mono text-zinc-500 scale-90">{t.label}</span>
                </div>
              ))}
            </div>

            {/* 2. Video Track (Solid Blue/Indigo Media Span) */}
            <div className="relative h-7 border-b border-zinc-800/80 bg-zinc-900/80 px-1 flex items-center">
              <div className="w-full h-5 rounded bg-sky-950/40 border border-sky-800/50 flex items-center px-2 text-[9px] font-mono text-sky-300">
                <span>Video Stream ({formatTime(totalDuration)})</span>
              </div>
            </div>

            {/* 3. Audio Track (Simulated Waveform Rhythm Bars) */}
            <div className="relative h-7 border-b border-zinc-800/80 bg-zinc-900/60 px-1 flex items-center overflow-hidden">
              <div className="w-full h-5 rounded bg-emerald-950/30 border border-emerald-800/40 flex items-center justify-around px-1">
                {Array.from({ length: 64 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-0.5 rounded-full bg-emerald-500/60"
                    style={{ height: `${Math.sin(i * 0.4) * 40 + 50}%` }}
                  />
                ))}
              </div>
            </div>

            {/* 4. Captions Track (Interactive Segments) */}
            <div className="relative h-10 bg-zinc-950/50 p-1">
              {captionTrack?.segments.map((seg) => {
                const leftPct = (seg.start_time / totalDuration) * 100;
                const widthPct = Math.max(0.6, ((seg.end_time - seg.start_time) / totalDuration) * 100);
                const isSelected = selectedSegmentId === seg.id;
                const isCurrent = currentTime >= seg.start_time && currentTime <= seg.end_time;

                return (
                  <div
                    key={seg.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSegment?.(seg);
                      onSeek(seg.start_time);
                    }}
                    className={`absolute top-1 bottom-1 overflow-hidden rounded px-2 py-0.5 text-[11px] font-medium transition-all shadow-sm flex items-center cursor-pointer ${
                      isSelected
                        ? "border border-indigo-400 bg-indigo-600/30 text-white z-20 ring-1 ring-indigo-400"
                        : isCurrent
                        ? "border border-amber-400/80 bg-amber-500/20 text-amber-200 z-10"
                        : "border border-zinc-700/80 bg-zinc-900 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800"
                    }`}
                    style={{
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                    }}
                    title={`[${formatTime(seg.start_time)} - ${formatTime(seg.end_time)}] ${seg.text}`}
                  >
                    <span className="truncate">{seg.text}</span>
                  </div>
                );
              })}
            </div>

            {/* Red Playhead Line Across All Tracks */}
            <div
              className="pointer-events-none absolute top-0 bottom-0 z-30 w-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]"
              style={{ left: `${playheadPercent}%` }}
            >
              <div className="absolute -top-1 -left-1.5 h-3 w-3 rotate-45 rounded-sm bg-red-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
