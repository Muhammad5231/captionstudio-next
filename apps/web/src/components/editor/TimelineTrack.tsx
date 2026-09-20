"use client";

import React, { useRef, useState } from "react";
import { Scissors, ZoomIn, ZoomOut, Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { CaptionTrackData, CaptionSegmentData } from "@/lib/api";
import { formatTime } from "@/lib/utils";

interface TimelineTrackProps {
  duration: number;
  currentTime: number;
  captionTrack?: CaptionTrackData | null;
  onSeek: (time: number) => void;
  onSplitAtCurrentTime: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export const TimelineTrack: React.FC<TimelineTrackProps> = ({
  duration,
  currentTime,
  captionTrack,
  onSeek,
  onSplitAtCurrentTime,
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

  const playheadPercent = (currentTime / totalDuration) * 100;

  // Generate tick marks
  const tickCount = Math.max(5, Math.min(30, Math.round(10 * zoomLevel)));
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => {
    const sec = (i / tickCount) * totalDuration;
    return {
      percent: (i / tickCount) * 100,
      label: formatTime(sec),
    };
  });

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-950 p-3 select-none">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        {/* Playback Transport */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSeek(Math.max(0, currentTime - 1))}
            className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            title="Step Back 1s"
          >
            <SkipBack className="h-4 w-4" />
          </button>
          <button
            onClick={onTogglePlay}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current" />}
            <span>{isPlaying ? "Pause" : "Play"}</span>
          </button>
          <button
            onClick={() => onSeek(Math.min(totalDuration, currentTime + 1))}
            className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            title="Step Forward 1s"
          >
            <SkipForward className="h-4 w-4" />
          </button>

          <div className="ml-4 font-mono text-xs text-zinc-300">
            <span className="text-indigo-400">{formatTime(currentTime)}</span>
            <span className="text-zinc-600"> / </span>
            <span>{formatTime(totalDuration)}</span>
          </div>
        </div>

        {/* Tools: Split & Zoom */}
        <div className="flex items-center gap-3">
          <button
            onClick={onSplitAtCurrentTime}
            className="flex items-center gap-1 rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors"
            title="Split Segment at Playhead"
          >
            <Scissors className="h-3.5 w-3.5 text-amber-400" />
            <span>Split at Playhead</span>
          </button>

          <div className="flex items-center gap-1 border-l border-zinc-800 pl-3">
            <button
              onClick={() => setZoomLevel((z) => Math.max(1, z - 0.5))}
              className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="font-mono text-[11px] text-zinc-400">{zoomLevel}x</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(3, z + 0.5))}
              className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Visual Timeline Track Canvas */}
      <div className="overflow-x-auto py-2">
        <div
          ref={containerRef}
          onClick={handleTimelineClick}
          className="relative h-20 w-full min-w-[600px] cursor-pointer rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden"
          style={{ width: `${zoomLevel * 100}%` }}
        >
          {/* Time Ruler Ticks */}
          <div className="absolute top-0 left-0 right-0 h-5 border-b border-zinc-800 bg-zinc-950/60 flex items-center">
            {ticks.map((t, idx) => (
              <div
                key={idx}
                className="absolute top-0 flex flex-col items-center"
                style={{ left: `${t.percent}%` }}
              >
                <div className="h-1.5 w-px bg-zinc-700" />
                <span className="text-[9px] font-mono text-zinc-400 scale-90">{t.label}</span>
              </div>
            ))}
          </div>

          {/* Caption Segment Blocks Track */}
          <div className="absolute top-6 bottom-0 left-0 right-0 p-1">
            {captionTrack?.segments.map((seg) => {
              const leftPct = (seg.start_time / totalDuration) * 100;
              const widthPct = Math.max(0.5, ((seg.end_time - seg.start_time) / totalDuration) * 100);
              const isActive = currentTime >= seg.start_time && currentTime <= seg.end_time;

              return (
                <div
                  key={seg.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSeek(seg.start_time);
                  }}
                  className={`absolute top-1 bottom-1 overflow-hidden rounded px-2 py-0.5 text-[11px] font-medium transition-all shadow-sm flex items-center ${
                    isActive
                      ? "border border-amber-400 bg-amber-500/20 text-amber-200 z-10 ring-1 ring-amber-400/50"
                      : "border border-indigo-600/40 bg-indigo-950/50 text-indigo-200 hover:bg-indigo-900/60"
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

          {/* Red Playhead Line */}
          <div
            className="pointer-events-none absolute top-0 bottom-0 z-30 w-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
            style={{ left: `${playheadPercent}%` }}
          >
            <div className="absolute -top-1 -left-1.5 h-3 w-3 rotate-45 rounded-sm bg-red-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

