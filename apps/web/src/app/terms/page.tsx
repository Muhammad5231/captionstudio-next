import Link from "next/link";
import { FileText, CheckCircle2, Shield, Scale } from "lucide-react";

export const metadata = {
  title: "Terms of Service | CaptionStudio",
  description: "Terms of service and software licensing for CaptionStudio.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Scale className="w-3.5 h-3.5" /> Software License & Terms
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-4">
            Terms of Service
          </h1>
          <p className="text-sm text-slate-400">
            Last Updated: September 2026 &bull; Local Software License Agreement
          </p>
        </div>

        <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" /> 1. Software License
            </h2>
            <p>
              CaptionStudio is provided as a local application for personal, professional, and commercial video production. By executing or accessing this software, you are granted a non-exclusive license to generate, edit, and export video subtitles and media content.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" /> 2. Content Ownership & Rights
            </h2>
            <p>
              You maintain full, exclusive ownership of all media, audio recordings, video footage, and generated caption files produced using CaptionStudio. CaptionStudio claims no intellectual property rights, royalties, or ownership over your creative output.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-400" /> 3. Open Source Components
            </h2>
            <p>
              This application incorporates open source software, including faster-whisper, FFmpeg, Next.js, and FastAPI. Each component is subject to its respective open-source license (such as MIT, Apache 2.0, or LGPL).
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-400" /> 4. Disclaimer of Warranty
            </h2>
            <p>
              The software is provided "as is", without warranty of any kind, express or implied, including but not limited to warranties of merchantability or fitness for a particular video encoding purpose.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

