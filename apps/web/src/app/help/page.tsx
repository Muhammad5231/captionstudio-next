import Link from "next/link";
import {
  HelpCircle,
  BookOpen,
  Keyboard,
  Cpu,
  FileQuestion,
  AlertTriangle,
  CheckCircle2,
  Terminal,
  ArrowRight,
} from "lucide-react";

export const metadata = {
  title: "Help & Knowledge Base | CaptionStudio",
  description: "Guides, troubleshooting, keyboard shortcuts, and FAQs for CaptionStudio.",
};

export default function HelpPage() {
  const guides = [
    {
      title: "Quick Start: Creating Your First Captions",
      steps: [
        "Go to New Project (/create) and drag & drop any MP4, MOV, WebM, or MKV video.",
        "Select your speech recognition model (Tiny for fast drafts, Base/Small for high accuracy).",
        "Choose spoken language or leave as 'Auto Detect' and click Start Transcription.",
        "Once loaded into the Editor, pick any of the 60+ styles from the Styles Gallery.",
        "Refine text, split or merge segments on the timeline, and adjust position safe zones.",
        "Click Export, select your resolution and burn-in options, and generate your finalized video.",
      ],
    },
    {
      title: "Hardware & GPU Acceleration Tips",
      steps: [
        "NVIDIA GPUs: Ensure CUDA 12.x drivers are installed for up to 10x faster Whisper inference.",
        "Apple Silicon: CTranslate2 automatically utilizes the Neural Engine and ARM NEON cores.",
        "CPU Only: The 'base' or 'small' model provides optimal real-time transcription on modern 6-core CPUs.",
        "FFmpeg Burn-in: Uses hardware NVENC / AMF encoders automatically when available.",
      ],
    },
  ];

  const shortcuts = [
    { key: "Space", desc: "Play / Pause video playback" },
    { key: "K", desc: "Toggle playback (standard NLE pause)" },
    { key: "J / L", desc: "Step backward / forward 1 second" },
    { key: "Left / Right", desc: "Nudge playhead by 1 frame (0.04s)" },
    { key: "S", desc: "Split active segment at current playhead" },
    { key: "M", desc: "Merge active segment with adjacent segment" },
    { key: "Ctrl + S", desc: "Save project draft to database" },
    { key: "F", desc: "Toggle full-screen preview" },
  ];

  const faqs = [
    {
      q: "Where are my video files and projects stored?",
      a: "All projects, uploads, audio wav extractions, and exported MP4s are stored directly on your computer inside the local `storage/` directory. No media files ever touch remote servers.",
    },
    {
      q: "Can I use custom fonts for my brand?",
      a: "Yes! Navigate to Dashboard > Fonts to upload any .ttf or .otf font file. The font is registered locally into FFmpeg's fontconfig cache and made immediately selectable in the editor.",
    },
    {
      q: "What if Whisper transcribes a word incorrectly?",
      a: "Click directly on the segment or word in the Caption Editor timeline to edit the text or adjust the start/end timestamps. Low-confidence words are visually flagged with an amber badge.",
    },
    {
      q: "Can I export subtitles without burning them into the video?",
      a: "Absolutely. In the Export dialog, select 'Subtitles Only' to download clean, timestamped .SRT, .VTT, or .ASS files compatible with YouTube, Vimeo, and Adobe Premiere.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
          <BookOpen className="w-3.5 h-3.5" /> Documentation & Guides
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
          Help & Knowledge Base
        </h1>
        <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto">
          Everything you need to master local AI transcription, caption styling, and FFmpeg rendering.
        </p>
      </div>

      <div className="max-w-5xl mx-auto space-y-16">
        {/* Step-by-Step Guides */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {guides.map((g, idx) => (
            <div key={idx} className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-400" /> {g.title}
              </h2>
              <ol className="space-y-3">
                {g.steps.map((step, sIdx) => (
                  <li key={sIdx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5">
                      {sIdx + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        {/* Keyboard Shortcuts */}
        <div className="p-8 rounded-3xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <Keyboard className="w-6 h-6 text-purple-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Editor Keyboard Shortcuts</h2>
              <p className="text-xs text-slate-400">Accelerate your workflow with precision hotkeys.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {shortcuts.map((sc, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
                <span className="font-mono text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-1 rounded w-fit mb-2">
                  {sc.key}
                </span>
                <span className="text-xs text-slate-300">{sc.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Accordion / Grid */}
        <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-3 mb-8">
            <HelpCircle className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Frequently Asked Questions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((f, idx) => (
              <div key={idx} className="p-5 rounded-xl bg-slate-950/50 border border-slate-800/80">
                <h3 className="font-semibold text-white text-sm mb-2">{f.q}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

