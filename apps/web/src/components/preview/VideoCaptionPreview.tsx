import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2, RotateCcw } from "lucide-react";
import { CaptionTrackData, CaptionSegmentData } from "@/lib/api";
import { formatTime } from "@/lib/utils";

interface VideoCaptionPreviewProps {
  videoUrl: string;
  captionTrack?: CaptionTrackData | null;
  onTimeUpdate?: (currentTime: number) => void;
  onSeekRequested?: (time: number) => void;
  externalSeekTime?: number | null;
}

export const VideoCaptionPreview: React.FC<VideoCaptionPreviewProps> = ({
  videoUrl,
  captionTrack,
  onTimeUpdate,
  externalSeekTime,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [activeSegment, setActiveSegment] = useState<CaptionSegmentData | null>(null);

  // Handle external seek requests (e.g. clicking a segment in the editor)
  useEffect(() => {
    if (externalSeekTime !== null && externalSeekTime !== undefined && videoRef.current) {
      videoRef.current.currentTime = externalSeekTime;
      setCurrentTime(externalSeekTime);
    }
  }, [externalSeekTime]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);
    if (onTimeUpdate) onTimeUpdate(time);

    // Find active caption segment
    if (captionTrack?.segments) {
      const match = captionTrack.segments.find(
        (seg) => time >= seg.start_time && time <= seg.end_time
      );
      setActiveSegment(match || null);
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration || 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  const activeWordId = activeSegment?.words?.find(
    (w) => currentTime >= w.start_time && currentTime <= w.end_time
  )?.id;

  return (
    <div
      ref={containerRef}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-black shadow-2xl"
    >
      {/* Video Viewport & Caption Overlay */}
      <div className="relative aspect-video w-full bg-zinc-950 flex items-center justify-center">
        <video
          ref={videoRef}
          src={videoUrl}
          playsInline
          className="h-full w-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onClick={togglePlay}
        />

        {/* Phase 1 Default Canonical Caption Overlay */}
        {/* Style: White text, black outline/shadow, bottom center, max 2 lines, safe margins */}
        {activeSegment && (
          <div className="pointer-events-none absolute bottom-12 left-0 right-0 px-8 flex justify-center text-center">
            <div
              className="max-w-xl text-center select-none font-sans font-extrabold text-2xl md:text-3xl leading-snug tracking-wide"
              style={{
                color: "#ffffff",
                WebkitTextStroke: "1.5px black",
                textShadow:
                  "0 0 4px #000, 0 0 10px #000, 2px 2px 3px rgba(0,0,0,0.9)",
              }}
            >
              {activeSegment.words && activeSegment.words.length > 0 ? (
                activeSegment.words.map((w) => {
                  const isCurrent = w.id === activeWordId;
                  return (
                    <span
                      key={w.id}
                      className={`inline-block mx-1 transition-all ${
                        isCurrent
                          ? "text-yellow-300 scale-105 drop-shadow-[0_2px_8px_rgba(234,179,8,0.8)]"
                          : "text-white"
                      }`}
                    >
                      {w.word}
                    </span>
                  );
                })
              ) : (
                <span>{activeSegment.text}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="flex flex-col gap-2 bg-zinc-900/90 p-3 border-t border-zinc-800/80 backdrop-blur-sm">
        {/* Progress Bar Scrubber */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-zinc-400 w-12 text-right">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.05}
            value={currentTime}
            onChange={handleSeek}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-zinc-700 accent-indigo-500 focus:outline-none"
          />
          <span className="text-xs font-mono text-zinc-400 w-12">
            {formatTime(duration)}
          </span>
        </div>

        {/* Buttons Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="rounded-lg p-2 text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 fill-current" />
              )}
            </button>
            <button
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = 0;
                  setCurrentTime(0);
                }
              }}
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
              title="Restart"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={toggleMute}
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            {captionTrack && (
              <span className="rounded-md bg-indigo-950/80 border border-indigo-800/60 px-2 py-0.5 text-[11px] font-medium text-indigo-300">
                {captionTrack.segments.length} Captions Loaded
              </span>
            )}
            <button
              onClick={toggleFullscreen}
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
              title="Fullscreen"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

