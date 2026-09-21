import Link from "next/link";
import {
  Mic2,
  Sparkles,
  SlidersHorizontal,
  Film,
  Lock,
  Zap,
  Layers,
  Cpu,
  Type,
  ShieldCheck,
  HardDrive,
  FileVideo,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export const metadata = {
  title: "Features | CaptionStudio",
  description: "Explore the complete feature suite of CaptionStudio — local-first AI caption generation, 15 Python styles, and hardware-accelerated video rendering.",
};

export default function FeaturesPage() {
  const featureCategories = [
    {
      badge: "AI Transcription",
      title: "Fast, Private, Word-Level AI Speech Engine",
      description: "Powered by faster-whisper running directly on your local hardware. No API tokens, no monthly cloud bills, and zero data leakage.",
      features: [
        "Local faster-whisper with tiny, base, small, medium, and large-v3 models",
        "Sub-millisecond word-level timing offsets for accurate karaoke alignment",
        "Automatic punctuation, capitalisation, and speech silence splitting",
        "Support for 99+ spoken languages with auto-language detection",
        "Configurable beam search, temperature fallback, and hallucination filters",
        "100% offline execution — zero audio or transcripts leave your machine",
      ],
      icon: Mic2,
      color: "from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30",
    },
    {
      badge: "Styling & Animations",
      title: "15 Sandboxed Python Caption Styles & Kinetic Typography",
      description: "Transform raw subtitles into thumb-stopping social video hooks with one click. Pre-calibrated for viral short-form and professional long-form content.",
      features: [
        "15 built-in sandboxed Python presets across TikTok, Reels, Documentary, Gaming, Neon, and Cinema",
        "Dynamic word-by-word karaoke highlights with customizable lead colors",
        "Pop, bounce, slide-in, typewriter, fade, and zoom text animation curves",
        "Full font control: upload custom .ttf/.otf or use bundled system fonts",
        "Multi-layered drop shadows, glowing halos, border outlines, and background boxes",
        "Admin Python style studio with live preview and safe AST-inspected execution",
      ],
      icon: Sparkles,
      color: "from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30",
    },
    {
      badge: "Editing Workspace",
      title: "Professional Timeline & Multi-Track Caption Editor",
      description: "A studio-grade editor tailored specifically for subtitle synchronization, line breaks, word corrections, and visual staging.",
      features: [
        "Real-time video preview synchronized with interactive waveform timeline",
        "Word-level confidence scoring with visual highlight of low-confidence tokens",
        "Interactive time scrubber with playhead jumping, nudging, and keyboard shortcuts",
        "Click-to-split and merge segments for perfect reading rhythm and cadence",
        "Safe-zone overlays for TikTok, Instagram Reels, and YouTube Shorts UI elements",
        "Undo/redo history stack and auto-saving project state",
      ],
      icon: SlidersHorizontal,
      color: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30",
    },
    {
      badge: "Render Engine",
      title: "Hardware-Accelerated FFmpeg Video Burn-In",
      description: "Export studio-grade MP4s with burnt-in captions at native resolution, or export clean subtitle tracks for YouTube and Premiere Pro.",
      features: [
        "GPU-accelerated rendering utilizing NVIDIA NVENC, AMD AMF, and Apple VideoToolbox",
        "Lossless subtitle burn-in with precise font glyph rasterization via libass",
        "Direct export to SRT, VTT, ASS, and Canonical JSON subtitle files",
        "Custom resolution, aspect ratio (9:16, 16:9, 1:1, 4:5), and bitrate profiles",
        "Background job worker with progress tracking and cancel/retry support",
        "Zero watermarks, zero subscription paywalls, and unlimited export length",
      ],
      icon: Film,
      color: "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30",
    },
    {
      badge: "Workspace & Management",
      title: "Creator Dashboard & Enterprise Admin Suite",
      description: "Organize your creative workflow with multi-user isolation, storage analytics, audit logging, and custom font management.",
      features: [
        "Creator Dashboard: unified view of recent projects, render jobs, and export history",
        "Project duplication, search, soft-deletion, and one-click recovery",
        "Custom font repository with real-time glyph preview and metadata inspection",
        "Admin Panel: system diagnostics, hardware memory usage, and storage cleaner",
        "Role-based access control (User, Admin, Super Admin) with local session tokens",
        "Local audit trails tracking user creation, project mutations, and export events",
      ],
      icon: Layers,
      color: "from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30",
    },
    {
      badge: "Security & Privacy",
      title: "Zero-Cloud Architecture & Total Sovereignty",
      description: "Engineered from the ground up for strict confidentiality, NDAs, pre-release media, and enterprise privacy compliance.",
      features: [
        "Zero telemetries, no third-party analytics trackers, and no external API reliance",
        "PBKDF2-HMAC-SHA256 password hashing with individual salt generation",
        "Multi-user data isolation: users cannot access or view another creator's files",
        "Directory traversal prevention and strict filename sanitization for uploads",
        "Self-contained SQLite database with auto-migrating relational schema",
        "Works entirely offline in air-gapped or restricted network environments",
      ],
      icon: ShieldCheck,
      color: "from-rose-500/20 to-red-500/20 text-rose-400 border-rose-500/30",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto text-center mb-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
          <Zap className="w-3.5 h-3.5" /> Capabilities Overview
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-6">
          Everything You Need for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">Viral Video Captions</span>
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
          CaptionStudio combines state-of-the-art speech intelligence with an intuitive multi-track timeline and high-throughput FFmpeg rendering.
        </p>
      </div>

      {/* Grid of Feature Categories */}
      <div className="max-w-7xl mx-auto space-y-16">
        {featureCategories.map((cat, idx) => {
          const Icon = cat.icon;
          return (
            <div
              key={idx}
              className="p-8 sm:p-10 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all duration-300 backdrop-blur-sm shadow-xl"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-800/80">
                <div className="flex items-center gap-4">
                  <div className={`p-3.5 rounded-xl border bg-gradient-to-br ${cat.color}`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-xs font-bold tracking-wider uppercase text-blue-400">
                      {cat.badge}
                    </span>
                    <h2 className="text-2xl font-bold text-white mt-1">{cat.title}</h2>
                  </div>
                </div>
                <p className="text-sm text-slate-400 max-w-md md:text-right">
                  {cat.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cat.features.map((feat, fIdx) => (
                  <div
                    key={fIdx}
                    className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-800/40 border border-slate-800/60"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <span className="text-sm text-slate-300 leading-snug">{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Call to Action Bar */}
      <div className="max-w-5xl mx-auto mt-24 text-center p-10 rounded-2xl bg-gradient-to-br from-blue-900/30 via-slate-900 to-purple-900/30 border border-blue-500/20">
        <h2 className="text-3xl font-bold text-white mb-4">
          Ready to experience frictionless local captioning?
        </h2>
        <p className="text-slate-400 mb-8 max-w-xl mx-auto">
          Start generating professional animated subtitles on your own machine in seconds. No cloud setup or credit card required.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/create"
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2"
          >
            Create New Project <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/styles"
            className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition-all"
          >
            Browse 15 Styles
          </Link>
        </div>
      </div>
    </div>
  );
}

