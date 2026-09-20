"use client";

import React, { useState, useEffect } from "react";
import {
  Video,
  FileText,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { Card, CardContent } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { UploadZone } from "@/components/ui/UploadZone";
import { VideoCaptionPreview } from "@/components/preview/VideoCaptionPreview";
import { CaptionSegmentEditor } from "@/components/editor/CaptionSegmentEditor";
import {
  createProject,
  uploadAsset,
  startTranscription,
  importSubtitles,
  getProject,
  getAssetStreamUrl,
  ProjectData,
  CaptionTrackData,
} from "@/lib/api";

type InputMode = "VIDEO" | "SUBTITLE" | "VIDEO_WITH_SUBTITLE";

const VIDEO_EXTS = [".mp4", ".mov", ".webm", ".mkv", ".avi"];
const SUBTITLE_EXTS = [".srt", ".vtt", ".ass", ".txt"];

export default function CreateStudioPage() {
  const [mode, setMode] = useState<InputMode>("VIDEO");
  const [projectName, setProjectName] = useState("My New Project");
  const [language, setLanguage] = useState("auto");
  const [chromaColor, setChromaColor] = useState("#00FF00");

  // Selected files
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [subtitleFile, setSubtitleFile] = useState<File | null>(null);

  // Workflow state
  const [isProcessing, setIsProcessing] = useState(false);
  const [jobStage, setJobStage] = useState("");
  const [jobProgress, setJobProgress] = useState(0);
  const [jobMessage, setJobMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Generated project state
  const [project, setProject] = useState<ProjectData | null>(null);
  const [captionTrack, setCaptionTrack] = useState<CaptionTrackData | null>(null);
  const [videoStreamUrl, setVideoStreamUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [seekRequestedTime, setSeekRequestedTime] = useState<number | null>(null);

  const modeTabs = [
    { id: "VIDEO", label: "Upload Video", icon: <Video className="h-4 w-4" /> },
    { id: "SUBTITLE", label: "Subtitle Only", icon: <FileText className="h-4 w-4" /> },
    { id: "VIDEO_WITH_SUBTITLE", label: "Video + Subtitle", icon: <Layers className="h-4 w-4" /> },
  ];

  const languageOptions = [
    { value: "auto", label: "Auto Detect Language (Preserves Spoken / Hinglish)" },
    { value: "en", label: "English" },
    { value: "hi", label: "Hindi" },
    { value: "gu", label: "Gujarati" },
  ];

  const chromaOptions = [
    { value: "#00FF00", label: "Green Screen (#00FF00)" },
    { value: "#0000FF", label: "Blue Screen (#0000FF)" },
    { value: "#000000", label: "Black Background (#000000)" },
  ];

  // SSE event subscriber for live progress tracking
  const subscribeToJobEvents = (jobId: string, projectId: string) => {
    const eventSource = new EventSource(`/api/v1/jobs/${jobId}/events`);

    eventSource.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        setJobStage(data.stage || "Processing");
        setJobProgress(data.progress || 0);
        setJobMessage(data.message || "");

        if (data.status === "COMPLETED") {
          eventSource.close();
          // Fetch completed project details
          const fullProject = await getProject(projectId);
          setProject(fullProject);

          // Find video asset to stream
          const videoAsset = fullProject.assets.find((a) => a.type === "VIDEO");
          if (videoAsset) {
            setVideoStreamUrl(getAssetStreamUrl(videoAsset.id));
          }

          // Find default caption track
          if (fullProject.caption_tracks && fullProject.caption_tracks.length > 0) {
            setCaptionTrack(fullProject.caption_tracks[0]);
          }

          setIsProcessing(false);
        } else if (data.status === "FAILED") {
          eventSource.close();
          setIsProcessing(false);
          setError(data.error || data.message || "Processing failed.");
        }
      } catch (err) {
        console.error("SSE parse error:", err);
      }
    };

    eventSource.onerror = () => {
      console.warn("SSE connection error; falling back to polling if needed.");
    };
  };

  const handleStartGeneration = async () => {
    setError(null);

    // Form validation
    if (mode === "VIDEO" && !videoFile) {
      setError("Please select a video file.");
      return;
    }
    if (mode === "SUBTITLE" && !subtitleFile) {
      setError("Please select a subtitle file.");
      return;
    }
    if (mode === "VIDEO_WITH_SUBTITLE" && (!videoFile || !subtitleFile)) {
      setError("Please select both a video file and a subtitle file.");
      return;
    }

    try {
      setIsProcessing(true);
      setJobStage("Initializing");
      setJobProgress(5);
      setJobMessage("Creating local project workspace...");

      // 1. Create Project
      const proj = await createProject(projectName, mode);

      // 2. Upload Assets
      let videoAssetId: string | undefined;
      let subtitleAssetId: string | undefined;

      if (videoFile) {
        setJobStage("Uploading");
        setJobProgress(10);
        setJobMessage(`Uploading video (${videoFile.name})...`);
        const vAsset = await uploadAsset(proj.id, videoFile, "VIDEO");
        videoAssetId = vAsset.asset.id;
      }

      if (subtitleFile) {
        setJobStage("Uploading");
        setJobProgress(15);
        setJobMessage(`Uploading subtitle (${subtitleFile.name})...`);
        const sAsset = await uploadAsset(proj.id, subtitleFile, "SUBTITLE");
        subtitleAssetId = sAsset.asset.id;
      }

      // 3. Trigger Job Pipeline
      if (mode === "VIDEO" && videoAssetId) {
        setJobStage("Queuing");
        setJobMessage("Triggering local transcription job...");
        const job = await startTranscription(proj.id, videoAssetId, language);
        subscribeToJobEvents(job.id, proj.id);
      } else if (mode === "SUBTITLE" && subtitleAssetId) {
        setJobStage("Queuing");
        setJobMessage("Triggering subtitle import & chroma rendering...");
        const job = await importSubtitles(proj.id, subtitleAssetId, undefined, chromaColor);
        subscribeToJobEvents(job.id, proj.id);
      } else if (mode === "VIDEO_WITH_SUBTITLE" && subtitleAssetId && videoAssetId) {
        setJobStage("Queuing");
        setJobMessage("Synchronizing video with external subtitles...");
        const job = await importSubtitles(proj.id, subtitleAssetId, videoAssetId);
        subscribeToJobEvents(job.id, proj.id);
      }
    } catch (err: any) {
      setIsProcessing(false);
      setError(err.message || "Failed to start caption generation.");
    }
  };

  const resetStudio = () => {
    setProject(null);
    setCaptionTrack(null);
    setVideoStreamUrl(null);
    setVideoFile(null);
    setSubtitleFile(null);
    setJobProgress(0);
    setError(null);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Studio View: Active Project Preview & Editor */}
      {project && videoStreamUrl ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">{project.name}</h1>
                <span className="rounded-md bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                  Ready
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Source: {project.source_type} &bull; Language: {project.language || "en"}
                {project.duration && ` • Duration: ${project.duration.toFixed(1)}s`}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={resetStudio}>
              New Project
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Video Preview Player */}
            <div className="lg:col-span-7 space-y-3">
              <VideoCaptionPreview
                videoUrl={videoStreamUrl}
                captionTrack={captionTrack}
                onTimeUpdate={(time) => setCurrentTime(time)}
                externalSeekTime={seekRequestedTime}
              />
              <p className="text-[11px] text-zinc-500 text-center">
                Phase 1 Default Caption Overlay: White text &bull; Safe margins &bull;
                Synchronized word timing
              </p>
            </div>

            {/* Right: Caption Segment Inspector & Editor */}
            <div className="lg:col-span-5 h-[520px]">
              {captionTrack ? (
                <CaptionSegmentEditor
                  projectId={project.id}
                  captionTrack={captionTrack}
                  currentTime={currentTime}
                  onSeek={(time) => setSeekRequestedTime(time)}
                  onTrackUpdated={(updated) => setCaptionTrack(updated)}
                />
              ) : (
                <div className="flex h-full items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center text-xs text-zinc-400">
                  No caption tracks available for this project.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Creation View: Upload & Configuration Form */
        <div className="mx-auto max-w-3xl space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Create New Captions
            </h1>
            <p className="mt-1 text-xs text-zinc-400">
              Select your media source, configure local parameters, and generate
              frame-accurate captions.
            </p>
          </div>

          {/* Mode Selector Tabs */}
          <Tabs
            tabs={modeTabs}
            activeTab={mode}
            onChange={(id) => {
              setMode(id as InputMode);
              setError(null);
            }}
          />

          <Card>
            <CardContent className="space-y-6 pt-4">
              {/* Project Title */}
              <Input
                label="Project Name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. My Podcast Episode 1"
              />

              {/* Mode A: Video Upload */}
              {mode === "VIDEO" && (
                <div className="space-y-4">
                  <UploadZone
                    label="Upload Video File"
                    sublabel="Drag and drop or click to select video"
                    acceptedExtensions={VIDEO_EXTS}
                    maxSizeMB={500}
                    selectedFile={videoFile}
                    onFileSelect={(f) => setVideoFile(f)}
                  />

                  <Select
                    label="Spoken Language"
                    options={languageOptions}
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  />
                </div>
              )}

              {/* Mode B: Subtitle Only */}
              {mode === "SUBTITLE" && (
                <div className="space-y-4">
                  <UploadZone
                    label="Upload Subtitle File"
                    sublabel="Select an SRT, VTT, ASS, or TXT transcript"
                    acceptedExtensions={SUBTITLE_EXTS}
                    selectedFile={subtitleFile}
                    onFileSelect={(f) => setSubtitleFile(f)}
                  />

                  <Select
                    label="Chroma Key Background Canvas"
                    options={chromaOptions}
                    value={chromaColor}
                    onChange={(e) => setChromaColor(e.target.value)}
                  />
                  <p className="text-[11px] text-zinc-400">
                    Subtitle-only projects automatically generate a solid chroma
                    background video for immediate preview and export.
                  </p>
                </div>
              )}

              {/* Mode C: Video + Subtitle */}
              {mode === "VIDEO_WITH_SUBTITLE" && (
                <div className="space-y-5">
                  <UploadZone
                    label="Upload Video"
                    acceptedExtensions={VIDEO_EXTS}
                    selectedFile={videoFile}
                    onFileSelect={(f) => setVideoFile(f)}
                  />

                  <UploadZone
                    label="Upload External Subtitles (.srt, .vtt, .ass)"
                    acceptedExtensions={SUBTITLE_EXTS}
                    selectedFile={subtitleFile}
                    onFileSelect={(f) => setSubtitleFile(f)}
                  />
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-950/40 border border-rose-900/60 p-3 text-xs text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Live Progress Bar when Processing */}
              {isProcessing && (
                <div className="space-y-3 rounded-xl border border-indigo-900/50 bg-indigo-950/20 p-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 animate-spin" />
                      Stage: {jobStage}
                    </span>
                    <span className="font-mono text-zinc-300">
                      {jobProgress.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={jobProgress} />
                  <p className="text-xs text-zinc-400">{jobMessage}</p>
                </div>
              )}

              {/* Action CTA */}
              <div className="pt-2">
                <Button
                  onClick={handleStartGeneration}
                  disabled={isProcessing}
                  isLoading={isProcessing}
                  size="lg"
                  className="w-full gap-2 text-sm"
                >
                  <Sparkles className="h-4 w-4" />
                  {isProcessing ? "Processing Locally..." : "Generate Captions Locally"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

