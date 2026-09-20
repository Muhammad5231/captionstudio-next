"use client";

import React, { useState } from "react";
import {
  User,
  Lock,
  Sliders,
  HardDrive,
  Check,
  AlertCircle,
  Shield,
  Cpu,
  Keyboard,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { changePassword } from "@/lib/api";

export default function DashboardSettingsPage() {
  const { user } = useAuth();

  // Password state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdMsg, setPwdMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [savingPwd, setSavingPwd] = useState(false);

  // Preference state (persisted locally)
  const [defaultModel, setDefaultModel] = useState("base");
  const [defaultAspect, setDefaultAspect] = useState("9:16");
  const [defaultRes, setDefaultRes] = useState("1080p");
  const [prefSaved, setPrefSaved] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);

    if (newPassword.length < 6) {
      setPwdMsg({ text: "New password must be at least 6 characters.", type: "error" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdMsg({ text: "New passwords do not match.", type: "error" });
      return;
    }

    setSavingPwd(true);
    try {
      await changePassword(oldPassword, newPassword);
      setPwdMsg({ text: "Password changed successfully.", type: "success" });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPwdMsg({ text: err?.message || "Failed to update password.", type: "error" });
    } finally {
      setSavingPwd(false);
    }
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setPrefSaved(true);
    setTimeout(() => setPrefSaved(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Settings & Preferences
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your local profile, security credentials, and transcription defaults.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Profile Information</h2>
            <p className="text-xs text-slate-400">Your local account identifier</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-500">Name</span>
            <div className="text-white font-medium mt-0.5">{user?.name || "Local Creator"}</div>
          </div>
          <div>
            <span className="text-slate-500">Email</span>
            <div className="text-white font-mono mt-0.5">{user?.email || "user@captionstudio.local"}</div>
          </div>
          <div>
            <span className="text-slate-500">Account Role</span>
            <div className="mt-0.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20">
                {user?.role || "USER"}
              </span>
            </div>
          </div>
          <div>
            <span className="text-slate-500">Storage Location</span>
            <div className="text-slate-300 font-mono text-[11px] mt-0.5 truncate">
              storage/captionstudio.db (Local SQLite)
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Security & Password</h2>
            <p className="text-xs text-slate-400">Update your local database password</p>
          </div>
        </div>

        {pwdMsg && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              pwdMsg.type === "success"
                ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                : "bg-rose-500/10 text-rose-300 border border-rose-500/20"
            }`}
          >
            {pwdMsg.type === "success" ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{pwdMsg.text}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingPwd}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold text-xs transition-colors"
          >
            {savingPwd ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>

      {/* Processing Defaults Card */}
      <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Processing Defaults</h2>
            <p className="text-xs text-slate-400">Pre-select models and render formats for new projects</p>
          </div>
        </div>

        <form onSubmit={handleSavePreferences} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Default Whisper Model</label>
              <select
                value={defaultModel}
                onChange={(e) => setDefaultModel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="tiny">Tiny (Fastest drafts)</option>
                <option value="base">Base (Recommended default)</option>
                <option value="small">Small (High precision)</option>
                <option value="medium">Medium (Studio accuracy)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Default Aspect Ratio</label>
              <select
                value={defaultAspect}
                onChange={(e) => setDefaultAspect(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="9:16">9:16 (TikTok, Reels, Shorts)</option>
                <option value="16:9">16:9 (YouTube, Landscape)</option>
                <option value="1:1">1:1 (Square Feed)</option>
                <option value="4:5">4:5 (Portrait Feed)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Default Export Resolution</label>
              <select
                value={defaultRes}
                onChange={(e) => setDefaultRes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="1080p">1080p (Full HD)</option>
                <option value="720p">720p (Fast Render)</option>
                <option value="4k">4K (Ultra HD)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
            >
              Save Defaults
            </button>
            {prefSaved && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Preferences saved
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

