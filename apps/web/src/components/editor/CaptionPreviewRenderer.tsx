"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import { CaptionTrackData, CaptionSegmentData, CaptionWordData } from "@/lib/api";
import { CaptionRenderSpec } from "@captionstudio/caption-schema";

interface CaptionPreviewRendererProps {
  videoUrl: string;
  captionTrack?: CaptionTrackData | null;
  renderSpec: CaptionRenderSpec;
  aspectRatio: "16:9" | "9:16" | "1:1" | "4:5" | "4:3";
  currentTime: number;
  showSafeArea?: boolean;
  onTimeUpdate?: (time: number) => void;
  onDurationChange?: (duration: number) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export const CaptionPreviewRenderer: React.FC<CaptionPreviewRendererProps> = ({
  videoUrl,
  captionTrack,
  renderSpec,
  aspectRatio,
  currentTime,
  showSafeArea = false,
  onTimeUpdate,
  onDurationChange,
  videoRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState<number>(540);

  // Resize observer to calculate relative font scaling
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Proportional scale factor relative to standard 1080p base height
  const scale = useMemo(() => {
    return Math.max(0.3, Math.min(2.0, containerHeight / 720));
  }, [containerHeight]);

  // Find currently active segment
  const activeSegment = useMemo(() => {
    if (!captionTrack?.segments) return null;
    return captionTrack.segments.find(
      (seg) => currentTime >= seg.start_time && currentTime <= seg.end_time
    ) || null;
  }, [captionTrack, currentTime]);

  // Find currently active word
  const activeWordId = useMemo(() => {
    if (!activeSegment?.words) return null;
    const match = activeSegment.words.find(
      (w) => currentTime >= w.start_time && currentTime <= w.end_time
    );
    return match?.id || null;
  }, [activeSegment, currentTime]);

  // Handle words display mode
  const displayedWords = useMemo(() => {
    if (!activeSegment) return [];
    const words = activeSegment.words || [];
    if (words.length === 0) return [];

    if (renderSpec.displayMode === "word") {
      const active = words.find((w) => w.id === activeWordId) || words[0];
      return active ? [active] : [];
    }

    if (renderSpec.displayMode === "chunk") {
      const activeIdx = words.findIndex((w) => w.id === activeWordId);
      const startIdx = Math.max(0, activeIdx - 1);
      return words.slice(startIdx, startIdx + 3);
    }

    return words;
  }, [activeSegment, activeWordId, renderSpec.displayMode]);

  // Aspect ratio classes
  const aspectClass = {
    "16:9": "aspect-video max-w-4xl",
    "9:16": "aspect-[9/16] max-h-[620px]",
    "1:1": "aspect-square max-w-lg",
    "4:5": "aspect-[4/5] max-h-[620px]",
    "4:3": "aspect-[4/3] max-w-xl",
  }[aspectRatio];

  const scaledFontSize = Math.round(renderSpec.fontSize * scale);
  const scaledStrokeWidth = Math.round(renderSpec.strokeWidth * scale * 10) / 10;
  const scaledShadowBlur = Math.round(renderSpec.shadowBlur * scale);

  const getAnimationClass = (isCurrent: boolean) => {
    if (!isCurrent) return "";
    switch (renderSpec.animation.type) {
      case "word-pop":
        return "anim-word-pop";
      case "bounce":
        return "anim-bounce";
      case "zoom":
        return "anim-zoom";
      case "elastic":
        return "anim-elastic";
      case "slide":
        return "anim-slide";
      default:
        return "";
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative mx-auto flex items-center justify-center overflow-hidden rounded-2xl border border-zinc-800 bg-black shadow-2xl ${aspectClass}`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoUrl}
        playsInline
        className="h-full w-full object-contain select-none"
        onTimeUpdate={(e) => {
          if (onTimeUpdate) onTimeUpdate(e.currentTarget.currentTime);
        }}
        onLoadedMetadata={(e) => {
          if (onDurationChange) onDurationChange(e.currentTarget.duration);
        }}
      />

      {/* Safe Area Guides (Optional TikTok/Reels Overlay) */}
      {showSafeArea && (
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between border-2 border-dashed border-cyan-400/40 p-4">
          <div className="flex justify-between items-center text-[10px] font-mono text-cyan-400/70">
            <span>TOP SAFE ZONE</span>
            <span>STATUS BAR SAFE</span>
          </div>
          <div className="flex justify-between items-end text-[10px] font-mono text-cyan-400/70">
            <span>SOUND / CAPTION SAFE</span>
            <div className="h-28 w-14 border border-dashed border-cyan-400/30 rounded flex items-center justify-center text-[9px] text-center">
              RIGHT ACTIONS
            </div>
          </div>
        </div>
      )}

      {/* Synchronized Caption Overlay */}
      {activeSegment && (
        <div
          className="pointer-events-none absolute z-10 w-full px-6 flex justify-center text-center select-none"
          style={{
            top: `${renderSpec.positionY}%`,
            left: `${renderSpec.positionX}%`,
            transform: "translate(-50%, -50%)",
            textAlign: renderSpec.alignment,
          }}
        >
          <div
            className="inline-block transition-all max-w-[90%]"
            style={{
              backgroundColor: renderSpec.backgroundColor !== "transparent" ? renderSpec.backgroundColor : undefined,
              padding: renderSpec.backgroundColor !== "transparent"
                ? `${renderSpec.backgroundPaddingY * scale}px ${renderSpec.backgroundPaddingX * scale}px`
                : undefined,
              borderRadius: renderSpec.backgroundColor !== "transparent"
                ? `${renderSpec.backgroundBorderRadius * scale}px`
                : undefined,
              fontFamily: renderSpec.fontFamily,
              fontSize: `${scaledFontSize}px`,
              fontWeight: renderSpec.fontWeight,
              fontStyle: renderSpec.fontStyle,
              textTransform: renderSpec.textTransform,
              letterSpacing: `${renderSpec.letterSpacing * scale}px`,
              lineHeight: renderSpec.lineHeight,
              WebkitTextStroke: scaledStrokeWidth > 0 ? `${scaledStrokeWidth}px ${renderSpec.strokeColor}` : undefined,
              textShadow: scaledShadowBlur > 0
                ? `${renderSpec.shadowOffsetX * scale}px ${renderSpec.shadowOffsetY * scale}px ${scaledShadowBlur}px ${renderSpec.shadowColor}`
                : undefined,
            }}
          >
            {displayedWords.length > 0 ? (
              displayedWords.map((w: CaptionWordData) => {
                const isCurrent = w.id === activeWordId;
                const animClass = getAnimationClass(isCurrent);

                return (
                  <span
                    key={w.id}
                    className={`inline-block mx-1 transition-colors duration-75 ${animClass}`}
                    style={{
                      color: isCurrent ? renderSpec.highlightColor : renderSpec.textColor,
                    }}
                  >
                    {w.word}
                  </span>
                );
              })
            ) : (
              <span style={{ color: renderSpec.textColor }}>
                {activeSegment.text}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

