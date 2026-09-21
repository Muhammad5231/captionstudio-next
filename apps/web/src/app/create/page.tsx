"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Video,
  FileText,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  UploadCloud,
  Film,
  Cpu,
  Info,
  Clock,
  RotateCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import {
  createProject,
  uploadAsset,
  startTranscription,
  importSubtitles,
  getProject,
  ProjectData,
} from "@/lib/api";

type InputMode = "VIDEO" | "SUBTITLE" | "VIDEO_WITH_SUBTITLE";

interface ClientMediaInfo {
  filename: string;
  sizeFormatted: string;
  duration?: number;
  width?: number;
  height?: number;
}

export default function CreateStudioPage() {
  const router = useRouter();
  const [mode, setMode] = useState<InputMode>("VIDEO");
  const [projectName, setProjectName] = useState("My New Project");
  const [language, setLanguage] = useState("auto");
  const [chromaColor, setChromaColor] = useState("#00FF00");

  // Selected files
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [subtitleFile, setSubtitleFile] = useState<File | null>(null);
  const [videoInfo, setVideoInfo] = useState<ClientMediaInfo | null>(null);

  // Workflow states
  const [isProcessing, setIsProcessing] = useState(false);
  const [jobStage, setJobStage] = useState("");
  const [jobProgress, setJobProgress] = useState(0);
  const [jobMessage, setJobMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Inspect video metadata on the client when selected
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    setError(null);

    // Default project name from file basename
    const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    if (baseName && projectName === "My New Project") {
      setProjectName(baseName);
    }

    // Inspect video via HTML5 video element for fast local duration & resolution preview
    const tempUrl = URL.createObjectURL(file);
    const videoEl = document.createElement("video");
    videoEl.preload = "metadata";
    videoEl.src = tempUrl;
    videoEl.onloadedmetadata = () => {
      setVideoInfo({
        filename: file.name,
        sizeFormatted: formatFileSize(file.size),
        duration: videoEl.duration,
        width: videoEl.videoWidth,
        height: videoEl.videoHeight,
      });
      URL.revokeObjectURL(tempUrl);
    };
    videoEl.onerror = () => {
      setVideoInfo({
        filename: file.name,
        sizeFormatted: formatFileSize(file.size),
      });
      URL.revokeObjectURL(tempUrl);
    };
  };

  const handleSubtitleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubtitleFile(file);
    setError(null);
    if (!videoFile && projectName === "My New Project") {
      const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setProjectName(baseName);
    }
  };

  // SSE event subscriber for live progress tracking
  const subscribeToJobEvents = (jobId: string, projId: string) => {
    const eventSource = new EventSource(`/api/v1/jobs/${jobId}/events`);

    eventSource.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        setJobStage(data.stage || "Processing");
        setJobProgress(data.progress || 0);
        setJobMessage(data.message || "");

        if (data.status === "COMPLETED") {
          eventSource.close();
          setJobProgress(100);
          setJobMessage("Project ready! Opening editor...");
          setTimeout(() => {
            router.push(`/editor/${projId}`);
          }, 600);
        } else if (data.status === "FAILED") {
          eventSource.close();
          setIsProcessing(false);
          setError(data.error || data.message || "Media processing failed. Please check file format.");
        }
      } catch (err) {
        console.error("SSE parsing error:", err);
      }
    };

    eventSource.onerror = () => {
      console.warn("SSE connection closed or reconnected.");
    };
  };

  const handleStartGeneration = async () => {
    setError(null);

    if (mode === "VIDEO" && !videoFile) {
      setError("Please select a video file (.mp4, .mov, .webm, .mkv).");
      return;
    }
    if (mode === "SUBTITLE" && !subtitleFile) {
      setError("Please select a subtitle file (.srt, .vtt, .ass, .txt).");
      return;
    }
    if (mode === "VIDEO_WITH_SUBTITLE" && (!videoFile || !subtitleFile)) {
      setError("Please select both a video file and a subtitle file.");
      return;
    }

    setIsProcessing(true);
    setJobStage("INITIALIZING");
    setJobProgress(5);
    setJobMessage("Creating project record...");

    try {
      const proj = await createProject(projectName || "Untitled Project", mode);
      setCreatedProjectId(proj.id);

      if (mode === "VIDEO" && videoFile) {
        setJobStage("UPLOADING");
        setJobProgress(15);
        setJobMessage(`Uploading ${videoFile.name}...`);
        const uploaded = await uploadAsset(proj.id, videoFile, "VIDEO");

        setJobStage("QUEUED");
        setJobProgress(30);
        setJobMessage("Queueing faster-whisper speech recognition...");

        const job = await startTranscription(proj.id, uploaded.asset.id, language || "auto");
        subscribeToJobEvents(job.id, proj.id);

      } else if (mode === "SUBTITLE" && subtitleFile) {
        setJobStage("UPLOADING");
        setJobProgress(25);
        setJobMessage(`Uploading ${subtitleFile.name}...`);
        const uploaded = await uploadAsset(proj.id, subtitleFile, "SUBTITLE");

        const job = await importSubtitles(proj.id, uploaded.asset.id, undefined, chromaColor);
        subscribeToJobEvents(job.id, proj.id);

      } else if (mode === "VIDEO_WITH_SUBTITLE" && videoFile && subtitleFile) {
        setJobStage("UPLOADING");
        setJobProgress(20);
        setJobMessage(`Uploading media and subtitles...`);
        const videoRes = await uploadAsset(proj.id, videoFile, "VIDEO");
        const subRes = await uploadAsset(proj.id, subtitleFile, "SUBTITLE");

        const job = await importSubtitles(proj.id, subRes.asset.id, videoRes.asset.id);
        subscribeToJobEvents(job.id, proj.id);
      }
    } catch (err: any) {
      setIsProcessing(false);
      setError(err.message || "Failed to start caption generation.");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header Breadcrumb */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              Project Initialization
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              Create New Caption Project
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Extract word-level AI captions from video or import external subtitle tracks locally.
            </p>
          </div>

          <Link href="/">
            <Button variant="ghost" size="sm" className="text-xs text-zinc-400 hover:text-white">
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 bg-zinc-900/70 p-1.5 rounded-xl border border-zinc-800/80 mb-6">
          <button
            onClick={() => {
              setMode("VIDEO");
              setError(null);
            }}
            disabled={isProcessing}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              mode === "VIDEO"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Video className="h-4 w-4" />
            <span>Upload Video</span>
          </button>

          <button
            onClick={() => {
              setMode("SUBTITLE");
              setError(null);
            }}
            disabled={isProcessing}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              mode === "SUBTITLE"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Subtitle Only</span>
          </button>

          <button
            onClick={() => {
              setMode("VIDEO_WITH_SUBTITLE");
              setError(null);
            }}
            disabled={isProcessing}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              mode === "VIDEO_WITH_SUBTITLE"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Video + Subtitle</span>
          </button>
        </div>

        {/* Main Configuration Card */}
        <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-sm shadow-xl mb-6">
          <CardContent className="p-6 space-y-6">
            {/* Project Name */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Project Name
              </label>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="My Viral Reel"
                disabled={isProcessing}
                className="bg-zinc-950 border-zinc-800 text-sm focus:border-indigo-500"
              />
            </div>

            {/* Video File Dropzone */}
            {(mode === "VIDEO" || mode === "VIDEO_WITH_SUBTITLE") && (
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Source Video File (.mp4, .mov, .webm, .mkv)
                </label>
                <div className="relative border-2 border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-950/60 rounded-xl p-6 text-center transition-colors">
                  <input
                    type="file"
                    accept="video/mp4,video/quicktime,video/webm,video/x-matroska,.mkv"
                    onChange={handleVideoSelect}
                    disabled={isProcessing}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex flex-col items-center pointer-events-none">
                    <UploadCloud className="h-8 w-8 text-indigo-400 mb-2" />
                    {videoFile ? (
                      <div className="text-xs">
                        <span className="font-semibold text-emerald-400">{videoFile.name}</span>
                        <span className="text-zinc-500 ml-2">({formatFileSize(videoFile.size)})</span>
                      </div>
                    ) : (
                      <>
                        <span className="text-xs font-medium text-zinc-200">
                          Click to browse or drop your video file here
                        </span>
                        <span className="text-[11px] text-zinc-500 mt-1">
                          Up to 4K resolution supported locally
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Video Metadata Inspector Preview */}
                {videoInfo && (
                  <div className="mt-3 bg-zinc-950 border border-zinc-800/80 rounded-lg p-3 text-xs text-zinc-400 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase">File Size</span>
                      <span className="text-zinc-200 font-mono">{videoInfo.sizeFormatted}</span>
                    </div>
                    {videoInfo.duration !== undefined && (
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase">Duration</span>
                        <span className="text-zinc-200 font-mono">{videoInfo.duration.toFixed(1)}s</span>
                      </div>
                    )}
                    {videoInfo.width && videoInfo.height && (
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase">Resolution</span>
                        <span className="text-zinc-200 font-mono">
                          {videoInfo.width} &times; {videoInfo.height}
                        </span>
                      </div>
                    )}
                    {videoInfo.width && videoInfo.height && (
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase">Aspect Ratio</span>
                        <span className="text-indigo-400 font-mono font-medium">
                          {videoInfo.width < videoInfo.height ? "9:16 (Vertical)" : "16:9 (Landscape)"}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Subtitle File Dropzone */}
            {(mode === "SUBTITLE" || mode === "VIDEO_WITH_SUBTITLE") && (
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Subtitle Track (.srt, .vtt, .ass, .txt)
                </label>
                <div className="relative border-2 border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-950/60 rounded-xl p-5 text-center transition-colors">
                  <input
                    type="file"
                    accept=".srt,.vtt,.ass,.txt"
                    onChange={handleSubtitleSelect}
                    disabled={isProcessing}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex flex-col items-center pointer-events-none">
                    <FileText className="h-7 w-7 text-purple-400 mb-2" />
                    {subtitleFile ? (
                      <span className="text-xs font-semibold text-emerald-400">
                        {subtitleFile.name} ({formatFileSize(subtitleFile.size)})
                      </span>
                    ) : (
                      <>
                        <span className="text-xs font-medium text-zinc-200">
                          Click to browse or drop your subtitle file here
                        </span>
                        <span className="text-[11px] text-zinc-500 mt-1">
                          SRT, WebVTT, ASS format supported
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Language & Chroma Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {mode !== "SUBTITLE" && (
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Speech Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    disabled={isProcessing}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="auto">Auto Detect (Preserves Spoken / Hinglish)</option>
                    <option value="en">English</option>
                    <option value="hi">Hindi (Devanagari &amp; Roman)</option>
                    <option value="gu">Gujarati</option>
                  </select>
                </div>
              )}

              {mode === "SUBTITLE" && (
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Chroma Key Overlay Canvas
                  </label>
                  <select
                    value={chromaColor}
                    onChange={(e) => setChromaColor(e.target.value)}
                    disabled={isProcessing}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="#00FF00">Green Screen (#00FF00)</option>
                    <option value="#0000FF">Blue Screen (#0000FF)</option>
                    <option value="#000000">Black Canvas (#000000)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Error Message Box */}
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-300">
                  <div className="font-semibold text-rose-200 mb-0.5">Processing Error</div>
                  <div>{error}</div>
                </div>
              </div>
            )}

            {/* Live Progress Card when Processing */}
            {isProcessing && (
              <div className="bg-zinc-950 border border-indigo-500/30 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                    <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                      {jobStage || "Processing"}
                    </span>
                  </div>
                  <span className="font-mono text-indigo-400 font-semibold">{Math.round(jobProgress)}%</span>
                </div>

                <Progress value={jobProgress} className="h-2 bg-zinc-800" />

                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                  <span>{jobMessage || "Analyzing audio frames..."}</span>
                  <span className="font-mono text-zinc-500">Local Engine</span>
                </div>
              </div>
            )}

            {/* Action CTA Button */}
            <div className="pt-2">
              <Button
                onClick={handleStartGeneration}
                disabled={isProcessing}
                className="w-full py-3 text-sm font-semibold shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <RotateCw className="h-4 w-4 animate-spin" />
                    <span>Processing Media...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Generate Captions &amp; Open Studio</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
