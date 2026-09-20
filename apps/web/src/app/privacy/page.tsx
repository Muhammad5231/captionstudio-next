import Link from "next/link";
import { ShieldCheck, Lock, EyeOff, HardDrive, Database, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | CaptionStudio",
  description: "Learn why CaptionStudio is 100% private, local-first, and collects zero personal data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <ShieldCheck className="w-3.5 h-3.5" /> 100% On-Device Confidentiality
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-sm text-slate-400">
            Last Updated: September 2026 &bull; Production Local-First Standard
          </p>
        </div>

        <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" /> 1. The Local-First Guarantee
            </h2>
            <p>
              CaptionStudio is engineered strictly as a local-first software application. When you launch CaptionStudio on your workstation:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-xs">
              <li>No video or audio data is ever transmitted over the public Internet.</li>
              <li>Speech recognition (Whisper) models execute directly on your local CPU or GPU.</li>
              <li>All database records, project files, and rendered MP4 files remain on your local drive.</li>
              <li>We do not operate remote telemetry collectors, user behavior tracking, or crash analytics.</li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" /> 2. Local Account Credentials
            </h2>
            <p>
              Any accounts created within CaptionStudio (such as Creator or Admin accounts) are stored inside your local SQLite database file (<code className="text-blue-300 bg-slate-950 px-1.5 py-0.5 rounded font-mono text-xs">storage/captionstudio.db</code>). Passwords are cryptographically salted and hashed using PBKDF2-HMAC-SHA256 with 100,000 rounds. No remote cloud identity service is involved.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-purple-400" /> 3. Data Storage & File Cleanup
            </h2>
            <p>
              You maintain complete ownership and physical custody of your media. You can clean or purge temporary audio waveforms, cache files, or exported videos at any time through the Admin Storage panel or by deleting files inside the local storage directory.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-amber-400" /> 4. Third-Party Sharing & AI Training
            </h2>
            <p>
              Your content is never sold, shared, or utilized to train external foundational AI models. Because all processing is offline, zero third parties have access to your video projects.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

