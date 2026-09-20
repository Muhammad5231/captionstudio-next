"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Cpu,
  Video,
  FileText,
  Lock,
  Zap,
  Layers,
  Palette,
  CheckCircle2,
  Sliders,
  Download,
  Languages,
  ChevronDown,
  Shield,
  Play,
  Pause,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState<string>("VIRAL_BOLD");
  const [demoPlaying, setDemoPlaying] = useState<boolean>(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const styleShowcase: Record<
    string,
    { name: string; tag: string; bg: string; textStyle: string; highlightStyle: string; desc: string }
  > = {
    VIRAL_BOLD: {
      name: "Hormozi Punch",
      tag: "Viral / Bold",
      bg: "bg-zinc-950",
      textStyle: "text-white font-black uppercase text-xl sm:text-2xl drop-shadow-md",
      highlightStyle: "text-yellow-400 bg-black/60 px-2 py-0.5 rounded border border-yellow-400/40 scale-110 inline-block",
      desc: "Punchy uppercase styling with high-contrast active word highlighting designed for maximum TikTok/Reels retention.",
    },
    MINIMAL: {
      name: "Modern Clean",
      tag: "Minimal",
      bg: "bg-zinc-900/60",
      textStyle: "text-zinc-200 font-medium text-lg sm:text-xl tracking-tight",
      highlightStyle: "text-white underline decoration-indigo-400 decoration-2 font-semibold",
      desc: "Elegant, unobtrusive subtitle typography perfect for podcasts, tutorials, and long-form YouTube videos.",
    },
    KINETIC: {
      name: "Dynamic Word-Pop",
      tag: "Kinetic",
      bg: "bg-zinc-950",
      textStyle: "text-white font-extrabold uppercase text-xl sm:text-2xl tracking-wider",
      highlightStyle: "text-pink-500 scale-125 transition-transform inline-block",
      desc: "High-energy word pop animation emphasizing every syllable with dynamic rhythm and scale pulses.",
    },
    HIGHLIGHT: {
      name: "Neon Highlighter",
      tag: "Highlight",
      bg: "bg-zinc-950",
      textStyle: "text-white font-bold text-xl sm:text-2xl",
      highlightStyle: "text-black bg-emerald-400 font-black px-2 py-0.5 rounded shadow-lg shadow-emerald-500/30",
      desc: "Vibrant fluorescent marker highlight creating immediate visual focal points for educational content.",
    },
    CINEMATIC: {
      name: "Criterion Gold",
      tag: "Cinematic",
      bg: "bg-black",
      textStyle: "text-amber-100/90 font-serif italic text-lg sm:text-xl tracking-wide",
      highlightStyle: "text-amber-400 font-semibold not-italic",
      desc: "Sophisticated serif typography reminiscent of prestige cinema and festival documentary subtitles.",
    },
    CREATOR_SOCIAL: {
      name: "Reels Gradient",
      tag: "Creator",
      bg: "bg-zinc-950",
      textStyle: "text-white font-extrabold text-xl sm:text-2xl",
      highlightStyle: "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-black",
      desc: "Vibrant social gradients tailored for Shorts and Instagram Reels to captivate mobile audiences.",
    },
  };

  const faqs = [
    {
      q: "Does CaptionStudio send my video or audio to any cloud service?",
      a: "No. CaptionStudio is 100% local-first. Speech transcription runs entirely on your local CPU or GPU using faster-whisper, and video burn-in rendering is processed locally with FFmpeg. Your media never leaves your computer.",
    },
    {
      q: "Which languages are supported for automatic transcription?",
      a: "Faster-whisper supports 99+ languages with specialized zero-configuration support for English, Hindi, Gujarati, and Hinglish (mixed spoken code-switching). You can also import external subtitles in SRT, VTT, or ASS format.",
    },
    {
      q: "What is Render Parity?",
      a: "Render Parity means what you see in the browser editor is exactly what FFmpeg renders in your final exported MP4. We achieve this by compiling a single unified CaptionRenderSpec into precision ASS subtitles and styling tags.",
    },
    {
      q: "Can I use CaptionStudio without a video file?",
      a: "Yes! In 'Subtitle Only' mode, you can upload an SRT, VTT, or ASS file. CaptionStudio generates a green-screen or transparent chroma video for you to overlay inside Premiere Pro, DaVinci Resolve, or Final Cut.",
    },
    {
      q: "What export formats are available?",
      a: "You can export hardcoded burned-in MP4 videos (with custom CRF and encoding presets) or download clean subtitle tracks in SRT, VTT, ASS, or raw JSON formats.",
    },
  ];

  return (
    <div className="flex flex-col items-center">
      {/* 1. Hero Section */}
      <section className="relative w-full overflow-hidden px-4 pt-16 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Local-First Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-800/50 bg-indigo-950/40 px-3.5 py-1 text-xs font-medium text-indigo-300 mb-6 backdrop-blur-sm shadow-sm">
            <Cpu className="h-3.5 w-3.5 text-indigo-400" />
            <span>100% Local-First Engine &bull; faster-whisper &bull; Zero Cloud Egress</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl font-black tracking-tight sm:text-6xl text-white">
            Create professional captions. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
              Rendered on your machine.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-zinc-300 leading-relaxed max-w-2xl mx-auto">
            Generate accurate word-timed captions locally with AI. Customize typography,
            animations, and 60+ viral styles. Export high-bitrate video with strict visual parity.
          </p>

          {/* Primary CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/create">
              <Button size="lg" className="gap-2 shadow-lg shadow-indigo-600/25 text-sm">
                <Sparkles className="h-4 w-4" />
                Start Creating Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/styles">
              <Button variant="outline" size="lg" className="gap-2 text-sm">
                <Palette className="h-4 w-4 text-zinc-400" />
                Explore 60+ Styles
              </Button>
            </Link>
          </div>

          {/* Live Preview Interactive Card */}
          <div className="mt-12 mx-auto max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4 text-xs text-zinc-400">
              <span className="flex items-center gap-2 font-mono">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                LIVE PREVIEW: {styleShowcase[activeCategory].name}
              </span>
              <button
                onClick={() => setDemoPlaying(!demoPlaying)}
                className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800 hover:text-white"
              >
                {demoPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                {demoPlaying ? "Pause" : "Play"}
              </button>
            </div>

            <div
              className={`h-40 rounded-xl flex items-center justify-center p-6 border border-zinc-800/80 transition-all ${styleShowcase[activeCategory].bg}`}
            >
              <p className={styleShowcase[activeCategory].textStyle}>
                CREATE{" "}
                <span className={demoPlaying ? styleShowcase[activeCategory].highlightStyle : ""}>
                  CAPTIVATING
                </span>{" "}
                CONTENT LOCALLY
              </p>
            </div>

            <p className="mt-3 text-xs text-zinc-400 text-left">
              {styleShowcase[activeCategory].desc}
            </p>
          </div>
        </div>
      </section>

      {/* 2. How It Works (3 Steps) */}
      <section className="w-full border-t border-zinc-800/80 bg-zinc-950/60 py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              Local Workflow
            </h2>
            <p className="mt-2 text-3xl font-extrabold text-white">How CaptionStudio Works</p>
            <p className="mt-3 text-sm text-zinc-400">
              Three seamless steps from raw video to publication-ready reels.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-6 relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-950 border border-indigo-800/60 text-indigo-400 font-bold text-lg mb-4">
                1
              </div>
              <h3 className="text-base font-bold text-white mb-2">Import Video or Subtitles</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Drag and drop your MP4, MOV, or WEBM file. You can also upload external SRT or VTT
                files or generate a green-screen chroma overlay directly.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-6 relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-950 border border-purple-800/60 text-purple-400 font-bold text-lg mb-4">
                2
              </div>
              <h3 className="text-base font-bold text-white mb-2">Local AI Transcription</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                faster-whisper extracts word-level timestamps on your CPU or GPU. Supports 99+
                languages, including English, Hindi, Gujarati, and Hinglish.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-6 relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-950 border border-pink-800/60 text-pink-400 font-bold text-lg mb-4">
                3
              </div>
              <h3 className="text-base font-bold text-white mb-2">Style &amp; FFmpeg Render</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Choose from 60+ templates, adjust animations, fonts, and safe zones. Render directly
                with hardware-accelerated FFmpeg burn-in at 100% visual parity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Style Showcase Matrix */}
      <section className="w-full border-t border-zinc-800/80 py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                Preset Library
              </h2>
              <p className="mt-2 text-3xl font-extrabold text-white">60+ Production-Ready Styles</p>
              <p className="mt-2 text-sm text-zinc-400">
                Data-driven style templates engineered across six creator categories.
              </p>
            </div>
            <Link href="/styles">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                View All Styles <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            {Object.keys(styleShowcase).map((catKey) => {
              const info = styleShowcase[catKey];
              const active = activeCategory === catKey;
              return (
                <button
                  key={catKey}
                  onClick={() => setActiveCategory(catKey)}
                  className={`rounded-lg px-4 py-2 text-xs font-medium transition-all ${
                    active
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                      : "bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
                  }`}
                >
                  {info.tag}
                </button>
              );
            })}
          </div>

          {/* Active Style Feature Card */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="w-full md:w-1/2 space-y-4">
              <div className="inline-block rounded-md bg-indigo-950/80 border border-indigo-800/60 px-2.5 py-1 text-xs font-semibold text-indigo-300">
                {styleShowcase[activeCategory].tag}
              </div>
              <h3 className="text-2xl font-black text-white">
                {styleShowcase[activeCategory].name}
              </h3>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {styleShowcase[activeCategory].desc}
              </p>
              <div className="pt-2">
                <Link href={`/create?style=${styleShowcase[activeCategory].name.toLowerCase().replace(/\s+/g, "-")}`}>
                  <Button className="gap-2 text-xs">
                    <Sparkles className="h-3.5 w-3.5" />
                    Use This Style in Project
                  </Button>
                </Link>
              </div>
            </div>

            <div
              className={`w-full md:w-1/2 h-48 rounded-xl flex items-center justify-center p-6 border border-zinc-800 ${styleShowcase[activeCategory].bg}`}
            >
              <p className={styleShowcase[activeCategory].textStyle}>
                THE FUTURE OF{" "}
                <span className={styleShowcase[activeCategory].highlightStyle}>VIDEO</span> CREATION
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Core Features Grid */}
      <section className="w-full border-t border-zinc-800/80 bg-zinc-950/60 py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              Technical Capabilities
            </h2>
            <p className="mt-2 text-3xl font-extrabold text-white">Engineered for Creators</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
              <Languages className="h-6 w-6 text-indigo-400 mb-3" />
              <h3 className="text-sm font-bold text-white mb-1.5">Hinglish &amp; Multi-Language</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Full support for Hindi, Gujarati, English, and conversational Hinglish with phonetic
                accuracy and word timestamp alignment.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
              <Sliders className="h-6 w-6 text-purple-400 mb-3" />
              <h3 className="text-sm font-bold text-white mb-1.5">Full Timeline Editor</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Split segments at playhead, merge adjacent blocks, edit text inline, and adjust
                timing without destructive file re-encoding.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
              <Download className="h-6 w-6 text-emerald-400 mb-3" />
              <h3 className="text-sm font-bold text-white mb-1.5">FFmpeg Burn-In Rendering</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                High-bitrate H.264/AAC output with real-time stderr progress tracking, custom CRF
                controls, and zero visual drift.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
              <Shield className="h-6 w-6 text-blue-400 mb-3" />
              <h3 className="text-sm font-bold text-white mb-1.5">Zero Data Leakage</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                All SQLite database files, audio extractions, and model weights remain strictly on
                your local storage drive.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
              <Layers className="h-6 w-6 text-amber-400 mb-3" />
              <h3 className="text-sm font-bold text-white mb-1.5">Safe Zone Guides</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Built-in 9:16 vertical overlays ensure captions never get obscured by TikTok, Reels,
                or Shorts UI buttons.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
              <Zap className="h-6 w-6 text-pink-400 mb-3" />
              <h3 className="text-sm font-bold text-white mb-1.5">Custom Font Discovery</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Automatic Windows font registry detection plus custom TTF/OTF installation with
                libass font mapping.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FAQ Section */}
      <section className="w-full border-t border-zinc-800/80 py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              Got Questions?
            </h2>
            <p className="mt-2 text-3xl font-extrabold text-white">Frequently Asked Questions</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between text-left text-sm font-semibold text-zinc-100"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-zinc-400 transition-transform ${
                        isOpen ? "rotate-180 text-indigo-400" : ""
                      }`}
                    />
                  </button>
                  {isOpen && <p className="mt-3 text-xs text-zinc-400 leading-relaxed">{faq.a}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Final Call to Action */}
      <section className="w-full border-t border-zinc-800/80 bg-gradient-to-b from-zinc-950 to-indigo-950/20 py-20 px-4 sm:px-6 lg:px-8 text-center">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Ready to elevate your captions?
          </h2>
          <p className="mt-4 text-sm text-zinc-300 max-w-xl mx-auto">
            Experience the speed, privacy, and precision of a true local-first caption generation
            pipeline on your computer.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/create">
              <Button size="lg" className="gap-2 shadow-lg shadow-indigo-600/30 text-sm">
                <Sparkles className="h-4 w-4" />
                Launch Caption Studio Free
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="lg" className="text-sm">
                Open Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
