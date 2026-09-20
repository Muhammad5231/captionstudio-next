import Link from "next/link";
import { Check, ShieldCheck, Zap, HardDrive, Cpu, Sparkles, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Pricing & Plans | CaptionStudio",
  description: "Transparent, local-first pricing. No recurring cloud subscriptions or usage meters.",
};

export default function PricingPage() {
  const tiers = [
    {
      name: "Community Edition",
      price: "$0",
      period: "forever",
      description: "Complete local-first caption generation and editing engine for solo creators.",
      badge: "Open & Free",
      features: [
        "100% Offline faster-whisper AI engine",
        "Unlimited video transcriptions & duration",
        "Full 60+ viral caption styles library",
        "Multi-track subtitle and word timeline editor",
        "Local SQLite database with zero telemetry",
        "Export to MP4 (1080p / 4K) with zero watermarks",
        "SRT, VTT, and ASS subtitle export",
      ],
      ctaText: "Start Creating",
      ctaLink: "/create",
      highlighted: false,
    },
    {
      name: "Creator Studio Pro",
      price: "$49",
      period: "one-time perpetual",
      description: "Dedicated professional features for commercial video editors and agencies.",
      badge: "Most Popular",
      features: [
        "Everything in Community Edition",
        "Unlimited custom TTF/OTF font uploads",
        "Custom brand style templates & favorite sync",
        "NVIDIA NVENC & AMD AMF hardware acceleration",
        "Project duplication & one-click archive restore",
        "Priority background rendering queue",
        "Commercial usage rights & license verification",
      ],
      ctaText: "Get Pro License",
      ctaLink: "/create",
      highlighted: true,
    },
    {
      name: "Studio Enterprise",
      price: "Custom",
      period: "per seat",
      description: "For production houses, broadcast networks, and air-gapped security teams.",
      badge: "Air-Gapped Ready",
      features: [
        "Everything in Creator Studio Pro",
        "Multi-user local network administration",
        "Role-based access control & audit trail logs",
        "Zero-egress corporate compliance signoff",
        "Custom whisper model fine-tuning support",
        "Dedicated implementation & onboarding engineer",
        "Custom FFmpeg build integration",
      ],
      ctaText: "Contact Sales",
      ctaLink: "/contact",
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
          <Zap className="w-3.5 h-3.5" /> No Monthly Cloud Tax
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-6">
          Simple, Fair, Local-First Pricing
        </h1>
        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
          Stop paying \$20–\$40 every month for cloud transcription minutes. CaptionStudio runs on your computer's own silicon with unlimited usage.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
        {tiers.map((t, idx) => (
          <div
            key={idx}
            className={`relative flex flex-col justify-between rounded-3xl p-8 transition-all duration-300 ${
              t.highlighted
                ? "bg-gradient-to-b from-blue-900/40 via-slate-900 to-slate-900 border-2 border-blue-500 shadow-2xl shadow-blue-500/20 md:-translate-y-2"
                : "bg-slate-900/70 border border-slate-800 hover:border-slate-700"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                    t.highlighted
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      : "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}
                >
                  {t.badge}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">{t.name}</h2>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                {t.description}
              </p>

              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-4xl sm:text-5xl font-extrabold text-white">
                  {t.price}
                </span>
                <span className="text-xs text-slate-400 font-medium">/{t.period}</span>
              </div>

              <div className="space-y-3.5 mb-8">
                {t.features.map((feat, fIdx) => (
                  <div key={fIdx} className="flex items-start gap-3">
                    <Check
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        t.highlighted ? "text-blue-400" : "text-emerald-400"
                      }`}
                    />
                    <span className="text-xs text-slate-300 leading-snug">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href={t.ctaLink}
              className={`w-full py-3.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all ${
                t.highlighted
                  ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              }`}
            >
              {t.ctaText} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ))}
      </div>

      {/* Why Local First Comparison */}
      <div className="max-w-4xl mx-auto p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center">
        <h3 className="text-xl font-bold text-white mb-4">
          Why local-first beats cloud subscription services
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 mb-6 max-w-2xl mx-auto">
          Cloud captioning platforms meter your video minutes, throttle exports during peak hours, and store your unreleased content on remote cloud servers. CaptionStudio eliminates all of that.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-xs font-semibold text-emerald-400 mb-1">Zero Minute Caps</div>
            <div className="text-xs text-slate-400">Process 10 minutes or 100 hours of video without paying an extra dime.</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-xs font-semibold text-blue-400 mb-1">100% Confidential</div>
            <div className="text-xs text-slate-400">Perfect for NDA footage, client interviews, and unreleased company demos.</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-xs font-semibold text-purple-400 mb-1">Hardware Optimized</div>
            <div className="text-xs text-slate-400">Harnesses your local GPU and multi-core CPU directly without network latency.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

