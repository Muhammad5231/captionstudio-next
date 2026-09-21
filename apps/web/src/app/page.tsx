"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Cpu,
  Video,
  FileText,
  Lock,
  Layers,
  Palette,
  ShieldCheck,
  CheckCircle2,
  Play,
  Pause,
  Sliders,
  Maximize2,
  Volume2,
  HardDrive,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  const [activeStyleKey, setActiveStyleKey] = useState<string>("clean-editorial");
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0.8);
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "16:9" | "1:1">("9:16");

  // Sample words simulated in real time
  const sampleWords = [
    { word: "CREATE", start: 0.0, end: 0.4 },
    { word: "CAPTIONS", start: 0.4, end: 0.9 },
    { word: "THAT", start: 0.9, end: 1.2 },
    { word: "MOVE", start: 1.2, end: 1.6 },
    { word: "WITH", start: 1.6, end: 1.9 },
    { word: "YOUR", start: 1.9, end: 2.2 },
    { word: "STORY", start: 2.2, end: 2.8 },
  ];

  const showcaseStyles: Record<
    string,
    {
      name: string;
      category: string;
      fontFamily: string;
      fontWeight: string;
      textColor: string;
      highlightColor: string;
      bgColor?: string;
      strokeColor?: string;
      desc: string;
    }
  > = {
    "clean-editorial": {
      name: "Clean Editorial",
      category: "MINIMAL",
      fontFamily: "Montserrat, sans-serif",
      fontWeight: "700",
      textColor: "#FFFFFF",
      highlightColor: "#38BDF8",
      bgColor: "rgba(15, 23, 42, 0.85)",
      desc: "Understated elegant sans-serif on a subtle dark slate rounded background pill.",
    },
    "bold-impact": {
      name: "Bold Impact",
      category: "VIRAL_BOLD",
      fontFamily: "Impact, sans-serif",
      fontWeight: "900",
      textColor: "#FFFFFF",
      highlightColor: "#FFE600",
      strokeColor: "#000000",
      desc: "Heavy condensed typography with thick black stroke outline and vibrant yellow active highlights.",
    },
    "neon-streamer": {
      name: "Neon Streamer",
      category: "VIRAL_BOLD",
      fontFamily: "Montserrat, sans-serif",
      fontWeight: "900",
      textColor: "#00FFFF",
      highlightColor: "#FF007F",
      desc: "High-octane cyberpunk neon style with intense cyan glow and electric magenta accents.",
    },
    "midnight-cinematic": {
      name: "Midnight Cinematic",
      category: "CINEMATIC",
      fontFamily: "Georgia, serif",
      fontWeight: "600",
      textColor: "#FEF3C7",
      highlightColor: "#F59E0B",
      desc: "Prestige documentary subtitle styling with muted gold typography and cinematic letterboxing.",
    },
    "karaoke-highlight": {
      name: "Karaoke Highlight",
      category: "HIGHLIGHT",
      fontFamily: "Rubik, sans-serif",
      fontWeight: "800",
      textColor: "#F8FAFC",
      highlightColor: "#10B981",
      bgColor: "rgba(0, 0, 0, 0.75)",
      desc: "Word-by-word active focus tracker designed for maximum audience retention on Reels & Shorts.",
    },
  };

  // Playback timer simulation
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentTime((prev) => (prev >= 2.8 ? 0.0 : prev + 0.05));
    }, 50);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Scroll reveal observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll(".reveal-fade-up");
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const activeStyle = showcaseStyles[activeStyleKey] || showcaseStyles["clean-editorial"];
  const activeWordIdx = sampleWords.findIndex(
    (w) => currentTime >= w.start && currentTime <= w.end
  );

  return (
    <div className="flex flex-col items-center bg-zinc-950 text-zinc-100 min-h-screen">
      {/* 1. Hero Section */}
      <section className="relative w-full overflow-hidden px-4 pt-20 pb-24 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center">
        {/* Subtle Background Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none -z-10" />

        {/* Local-First Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/90 px-4 py-1 text-xs font-medium text-zinc-300 mb-8 shadow-sm backdrop-blur-md">
          <Cpu className="h-3.5 w-3.5 text-indigo-400" />
          <span>100% Local-First Engine &bull; faster-whisper &bull; Zero Cloud Egress</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl font-black tracking-tight sm:text-6xl lg:text-7xl text-center text-white max-w-4xl leading-[1.08]">
          Create Captions That <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-200">
            Move With Your Story.
          </span>
        </h1>

        {/* Supporting Copy */}
        <p className="mt-6 text-base sm:text-lg text-zinc-400 text-center max-w-2xl leading-relaxed">
          The professional desktop studio for frame-accurate, animated captions. Powered by local
          faster-whisper AI and hardware-accelerated FFmpeg rendering. No accounts. No cloud egress.
        </p>

        {/* Primary CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link href="/create">
            <Button size="lg" className="gap-2.5 px-6 py-3 shadow-lg shadow-indigo-600/25 text-sm font-semibold">
              <Sparkles className="h-4 w-4" />
              Create Your Video
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/styles">
            <Button variant="outline" size="lg" className="gap-2 text-sm font-semibold border-zinc-800 hover:bg-zinc-900">
              <Palette className="h-4 w-4 text-zinc-400" />
              Explore Styles
            </Button>
          </Link>
        </div>

        {/* Interactive Editor Preview Canvas */}
        <div className="mt-14 w-full max-w-4xl rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 sm:p-6 shadow-2xl backdrop-blur-md reveal-fade-up">
          {/* Top Mock Window Header */}
          <div className="flex flex-wrap items-center justify-between border-b border-zinc-800 pb-3 mb-4 gap-2 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-zinc-500 font-mono text-[11px] ml-2">CaptionStudio Editor Preview</span>
            </div>

            {/* Aspect Ratio Switcher */}
            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
              {(["9:16", "16:9", "1:1"] as const).map((ar) => (
                <button
                  key={ar}
                  onClick={() => setAspectRatio(ar)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    aspectRatio === ar ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {ar}
                </button>
              ))}
            </div>

            {/* Play/Pause control */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium transition-colors"
              >
                {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                <span>{isPlaying ? "Pause" : "Play"}</span>
              </button>
            </div>
          </div>

          {/* Canvas Display Stage */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 py-4">
            {/* Simulated Video Viewport */}
            <div
              className="relative bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl flex flex-col justify-end p-6 transition-all duration-300 select-none"
              style={{
                width: aspectRatio === "9:16" ? "240px" : aspectRatio === "16:9" ? "440px" : "320px",
                height: aspectRatio === "9:16" ? "400px" : aspectRatio === "16:9" ? "250px" : "320px",
              }}
            >
              {/* Background gradient simulating video */}
              <div className="absolute inset-0 bg-gradient-to-b from-zinc-800/30 via-zinc-900/40 to-black/90 pointer-events-none" />

              {/* Aspect badge */}
              <div className="absolute top-2.5 left-2.5 text-[10px] font-mono text-zinc-500 bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-800">
                {aspectRatio}
              </div>

              {/* Rendered Animated Words */}
              <div className="relative z-10 text-center">
                <div
                  style={{
                    backgroundColor: activeStyle.bgColor || "transparent",
                    padding: activeStyle.bgColor ? "6px 14px" : "0",
                    borderRadius: "8px",
                    display: "inline-block",
                  }}
                >
                  {sampleWords.slice(0, 4).map((w, idx) => {
                    const isActive = activeWordIdx === idx;
                    return (
                      <span
                        key={idx}
                        className="inline-block transition-transform duration-100 mx-1"
                        style={{
                          fontFamily: activeStyle.fontFamily,
                          fontWeight: activeStyle.fontWeight,
                          color: isActive ? activeStyle.highlightColor : activeStyle.textColor,
                          fontSize: aspectRatio === "9:16" ? "1.25rem" : "1.1rem",
                          transform: isActive ? "scale(1.16)" : "scale(1.0)",
                          WebkitTextStroke: activeStyle.strokeColor ? `1.5px ${activeStyle.strokeColor}` : undefined,
                          textShadow: "0 2px 6px rgba(0,0,0,0.8)",
                        }}
                      >
                        {w.word}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Style Selector Mini-Rail */}
            <div className="flex flex-col gap-2 w-full md:w-64">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Select Python Preset
              </span>
              {Object.keys(showcaseStyles).map((k) => {
                const s = showcaseStyles[k];
                const isSel = activeStyleKey === k;
                return (
                  <button
                    key={k}
                    onClick={() => setActiveStyleKey(k)}
                    className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                      isSel
                        ? "border-indigo-500 bg-indigo-950/30 text-white shadow-md shadow-indigo-600/10"
                        : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-white">{s.name}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-mono">
                        {s.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 line-clamp-1">{s.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Core Pillars / Why Local-First */}
      <section className="w-full border-t border-zinc-800/80 bg-zinc-950/60 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 reveal-fade-up">
            <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              Local Architecture
            </h2>
            <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Why Creators Choose CaptionStudio
            </p>
            <p className="mt-3 text-sm text-zinc-400">
              Complete on-device execution. Built for professional video creators, privacy-conscious teams, and content studios.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 relative reveal-fade-up">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-950/80 border border-indigo-800/50 text-indigo-400 mb-4">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">100% Privacy & Zero Egress</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Your video, audio, and transcripts never touch an external cloud server. Speech AI and video rendering run locally on your CPU or GPU.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 relative reveal-fade-up">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-950/80 border border-purple-800/50 text-purple-400 mb-4">
                <Sliders className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">15 Sandboxed Python Styles</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Powered by our Python Style SDK with AST-inspected subprocess isolation. Render word-pop, kinetic pulses, and karaoke highlights with strict parity.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 relative reveal-fade-up">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-950/80 border border-emerald-800/50 text-emerald-400 mb-4">
                <HardDrive className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Hardware-Accelerated Export</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Direct FFmpeg burn-in with NVENC, AMD AMF, and Apple VideoToolbox support. Preserves source resolution and synchronized audio without quality degradation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Three-Step Workflow */}
      <section className="w-full border-t border-zinc-800/80 py-20 px-4 sm:px-6 lg:px-8 bg-zinc-900/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14 reveal-fade-up">
            <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              Seamless Workflow
            </h2>
            <p className="mt-2 text-3xl font-extrabold text-white">Three Steps to Publication</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 reveal-fade-up">
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-black text-indigo-400">01</span>
                <Video className="h-5 w-5 text-zinc-500" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Import Media or Subtitles</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Drag and drop MP4, MOV, WEBM, or external SRT/VTT subtitle files into the studio with instant FFprobe metadata inspection.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 reveal-fade-up">
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-black text-indigo-400">02</span>
                <Sparkles className="h-5 w-5 text-zinc-500" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Transcribe &amp; Style</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Local faster-whisper generates word-accurate timestamps with natural Hinglish preservation. Select from 15 high-impact Python styles.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 reveal-fade-up">
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-black text-indigo-400">03</span>
                <Download className="h-5 w-5 text-zinc-500" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Preview &amp; Render</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Fine-tune timings on the multi-track timeline, inspect frame accuracy, and export native-resolution burned MP4s or clean subtitle files.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Bottom CTA */}
      <section className="w-full border-t border-zinc-800/80 bg-gradient-to-b from-zinc-950 to-indigo-950/20 py-20 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto reveal-fade-up">
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Ready to experience professional captioning?
          </h2>
          <p className="mt-4 text-sm text-zinc-400 max-w-xl mx-auto">
            Start generating beautiful, frame-accurate subtitles on your computer with complete privacy and zero subscription fees.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/create">
              <Button size="lg" className="gap-2.5 px-7 py-3 shadow-lg shadow-indigo-600/30 text-sm font-semibold">
                <Sparkles className="h-4 w-4" />
                Create Your Video
              </Button>
            </Link>
            <Link href="/styles">
              <Button variant="outline" size="lg" className="text-sm font-semibold border-zinc-800">
                Explore 15 Styles
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
