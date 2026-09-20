"use client";

import React, { useState } from "react";
import { Mail, MessageSquare, Terminal, Github, CheckCircle2, Send, HelpCircle } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "Feedback & Feature Suggestion",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Local simulation / acknowledgement
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-4">
          <MessageSquare className="w-3.5 h-3.5" /> Support & Community
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
          Get in Touch
        </h1>
        <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto">
          Need help with your local installation, want to report a Whisper edge case, or suggest a new caption style?
        </p>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Contact Info Cards */}
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="p-3 w-fit rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-3">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm mb-1">Direct Developer Support</h3>
            <p className="text-xs text-slate-400 mb-3">
              Email our core maintainer team for licensing questions or private deployment help.
            </p>
            <a
              href="mailto:support@captionstudio.local"
              className="text-xs font-mono text-blue-400 hover:underline"
            >
              support@captionstudio.local
            </a>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="p-3 w-fit rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mb-3">
              <Github className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm mb-1">Issue Tracker & Discussions</h3>
            <p className="text-xs text-slate-400 mb-3">
              Submit bug reports, FFmpeg codec issues, or join discussions on our repository.
            </p>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-purple-400 hover:underline"
            >
              github.com/captionstudio/captionstudio &rarr;
            </a>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="p-3 w-fit rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-3">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm mb-1">Self-Service Documentation</h3>
            <p className="text-xs text-slate-400 mb-3">
              Read comprehensive architecture, troubleshooting, and setup manuals.
            </p>
            <a href="/help" className="text-xs font-semibold text-emerald-400 hover:underline">
              Explore Help Center &rarr;
            </a>
          </div>
        </div>

        {/* Form */}
        <div className="md:col-span-2 p-8 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-xl">
          {submitted ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Message Recorded</h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-sm mb-6">
                Thank you for your feedback! Your message has been saved to the local support mailbox.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ name: "", email: "", subject: "Feedback", message: "" });
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                Send Another Note
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-xl font-bold text-white mb-4">Send a Message</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Jane Doe"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Your Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="creator@domain.com"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Subject
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option>Feedback & Feature Suggestion</option>
                  <option>Bug Report / Codec Issue</option>
                  <option>Whisper Model Question</option>
                  <option>Enterprise Deployment Inquiry</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Message
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Describe your question or recommendation..."
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Send Feedback
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

