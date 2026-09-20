import Link from "next/link";
import { ShieldCheck, Cpu, HardDrive, Sparkles, Terminal, Code2, Users, Heart } from "lucide-react";

export const metadata = {
  title: "About | CaptionStudio",
  description: "Learn about the mission, engineering philosophy, and architecture behind CaptionStudio.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-3xl mx-auto text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-4">
          <Terminal className="w-3.5 h-3.5" /> Built for Creators & Engineers
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-6">
          The Story Behind <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">CaptionStudio</span>
        </h1>
        <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
          We built CaptionStudio because modern video creators shouldn't have to surrender their privacy, upload gigabytes of raw video over slow connections, or pay high recurring monthly fees just to generate animated captions.
        </p>
      </div>

      {/* Main Philosophy Blocks */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
        <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="p-3 w-fit rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white mb-3">Absolute Data Privacy</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Every audio file, transcription chunk, video frame, and subtitle styling parameter is processed exclusively on your local workstation. Zero telemetry, zero cloud egress, and zero external analytics. You retain 100% control of your intellectual property.
          </p>
        </div>

        <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="p-3 w-fit rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mb-4">
            <Cpu className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white mb-3">True Silicon Utilization</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            By running faster-whisper and FFmpeg natively, CaptionStudio taps into your machine's multi-core CPU and dedicated GPU encoders (NVIDIA NVENC, AMD AMF, Apple VideoToolbox). Fast transcription and crisp 4K exports without queue wait times.
          </p>
        </div>

        <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="p-3 w-fit rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white mb-3">Studio-Grade Typography</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Social media moves fast. Subtitles need to be legible, punchy, and aesthetically aligned with creator brands. We engineered 60+ pre-calibrated style templates with kinetic pop animations, karaoke highlights, custom TTF font loading, and subtitle safe-zone overlays.
          </p>
        </div>

        <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="p-3 w-fit rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-4">
            <HardDrive className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white mb-3">Local-First Persistence</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Everything is structured around an ACID-compliant local SQLite database and standardized filesystem directories. Projects can be backed up with a simple folder copy, duplicated instantly, or soft-deleted and restored with zero risk of vendor lock-in.
          </p>
        </div>
      </div>

      {/* Technology Stack Grid */}
      <div className="max-w-4xl mx-auto p-8 rounded-3xl bg-slate-900/40 border border-slate-800 text-center">
        <h3 className="text-lg font-bold text-white mb-6">Engineered with Modern Open Technologies</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300">
            Next.js 15 & React 19
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300">
            Python 3.12+ & FastAPI
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300">
            faster-whisper & CTranslate2
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300">
            FFmpeg & libass
          </div>
        </div>
      </div>
    </div>
  );
}

