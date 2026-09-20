import Link from "react";
import {
  Sparkles,
  ArrowRight,
  Cpu,
  Video,
  FileText,
  Lock,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="mx-auto max-w-3xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-800/40 bg-indigo-950/40 px-3.5 py-1 text-xs font-medium text-indigo-300 mb-6">
          <Cpu className="h-3.5 w-3.5" />
          <span>Local-First AI Speech-to-Text &bull; Zero Cloud Required</span>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-white">
          Professional captions. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            Rendered locally.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-zinc-300 leading-relaxed">
          Upload your video or subtitle file. Generate accurate captions locally
          with faster-whisper. Edit the generated text in real time with
          synchronized preview.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a href="/create">
            <Button size="lg" className="gap-2 shadow-lg shadow-indigo-600/20">
              <Sparkles className="h-4 w-4" />
              Create Captions
              <ArrowRight className="h-4 w-4" />
            </Button>
          </a>
          <a href="#how-it-works">
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </a>
        </div>
      </div>

      {/* Feature Highlights */}
      <div
        id="how-it-works"
        className="mt-24 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-3"
      >
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 backdrop-blur-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-950/80 border border-indigo-800/60 text-indigo-400 mb-4">
            <Video className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-100">
            1. Upload Media
          </h3>
          <p className="mt-2 text-xs text-zinc-400 leading-normal">
            Drag & drop MP4, MOV, WebM videos, or import existing SRT, VTT, and
            ASS subtitle files directly.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 backdrop-blur-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-950/80 border border-purple-800/60 text-purple-400 mb-4">
            <Zap className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-100">
            2. Local AI Generation
          </h3>
          <p className="mt-2 text-xs text-zinc-400 leading-normal">
            Our local faster-whisper engine transcribes English, Hindi, Gujarati,
            and Hinglish speech with word-level timestamps.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 backdrop-blur-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 mb-4">
            <Lock className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-100">
            3. Synchronized Preview
          </h3>
          <p className="mt-2 text-xs text-zinc-400 leading-normal">
            Inspect, edit, and seek across caption segments with our frame-accurate
            video overlay preview. Zero cloud leakage.
          </p>
        </div>
      </div>
    </div>
  );
}

