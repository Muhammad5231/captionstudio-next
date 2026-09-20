"use client";

import React, { useState, useEffect } from "react";
import { Download, Film, FileText, CheckCircle2, AlertCircle, X, Loader2 } from "lucide-react";
import { CaptionRenderSpec } from "@captionstudio/caption-schema";
import { createExport, getExportDownloadUrl, ExportData, API_BASE } from "@/lib/api";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  renderSpec: CaptionRenderSpec;
}

type FormatChoice = "MP4" | "SRT" | "VTT" | "ASS" | "JSON";

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  projectId,
  renderSpec,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<FormatChoice>("MP4");
  const [crf, setCrf] = useState<number>(20);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [stageMessage, setStageMessage] = useState<string>("");
  const [completedExport, setCompletedExport] = useState<ExportData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsExporting(false);
      setProgress(0);
      setStageMessage("");
      setCompletedExport(null);
      setErrorMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    setIsExporting(true);
    setProgress(5);
    setStageMessage("Initiating export job...");
    setErrorMsg(null);

    try {
      const exportRec = await createExport(projectId, selectedFormat, renderSpec, crf);
      if (!exportRec.job_id) {
        throw new Error("Job ID missing from export response");
      }

      // Connect to SSE stream for live progress
      const eventSource = new EventSource(`${API_BASE}/jobs/${exportRec.job_id}/stream`);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setProgress(data.progress || 0);
          setStageMessage(data.message || "Processing...");

          if (data.status === "COMPLETED") {
            eventSource.close();
            setCompletedExport(exportRec);
            setIsExporting(false);
          } else if (data.status === "FAILED") {
            eventSource.close();
            setErrorMsg(data.error || "Export rendering failed");
            setIsExporting(false);
          }
        } catch (e) {
          console.error("SSE parse error", e);
        }
      };

      eventSource.onerror = () => {
        // Fallback: Check if completed via timeout/polling
        eventSource.close();
        setTimeout(async () => {
          try {
            const check = await fetch(`${API_BASE}/exports/${exportRec.id}`).then((r) => r.json());
            if (check.status === "COMPLETED") {
              setCompletedExport(check);
              setProgress(100);
            }
          } catch {}
          setIsExporting(false);
        }, 3000);
      };
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to start export");
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-2">
            <Film className="h-5 w-5 text-indigo-400" />
            <h3 className="font-semibold text-lg text-white">Export Captions & Video</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {!completedExport ? (
          <div className="mt-4 flex flex-col gap-4">
            {/* Format Selector */}
            <div>
              <label className="text-xs font-medium text-zinc-400">Choose Output Format</label>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: "MP4", label: "Rendered MP4", desc: "Burned-in video" },
                  { id: "SRT", label: "SRT Subtitle", desc: "SubRip format" },
                  { id: "VTT", label: "WebVTT", desc: "Web subtitle" },
                  { id: "ASS", label: "ASS Subtitle", desc: "Styled karaoke" },
                  { id: "JSON", label: "JSON Project", desc: "Canonical captions" },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    onClick={() => setSelectedFormat(fmt.id as FormatChoice)}
                    className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition-all ${
                      selectedFormat === fmt.id
                        ? "border-indigo-500 bg-indigo-950/30 text-white ring-1 ring-indigo-500"
                        : "border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900"
                    }`}
                  >
                    <span className="font-semibold text-xs">{fmt.label}</span>
                    <span className="text-[10px] text-zinc-500">{fmt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* MP4 Quality Settings */}
            {selectedFormat === "MP4" && (
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-zinc-300">Video Quality (CRF)</span>
                  <span className="font-mono text-indigo-400">
                    {crf === 18 ? "18 (High Quality)" : crf === 20 ? "20 (Balanced)" : "24 (Fast/Compact)"}
                  </span>
                </div>
                <input
                  type="range"
                  min={18}
                  max={24}
                  step={2}
                  value={crf}
                  onChange={(e) => setCrf(parseInt(e.target.value))}
                  className="mt-2 w-full accent-indigo-500"
                />
              </div>
            )}

            {/* Progress Status */}
            {isExporting && (
              <div className="rounded-xl border border-indigo-900/60 bg-indigo-950/20 p-3">
                <div className="flex items-center justify-between text-xs text-indigo-300 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                    {stageMessage}
                  </span>
                  <span className="font-mono">{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="flex items-center gap-2 rounded-xl border border-red-800/60 bg-red-950/30 p-3 text-xs text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Actions */}
            <div className="mt-2 flex justify-end gap-2">
              <button
                onClick={onClose}
                disabled={isExporting}
                className="rounded-xl border border-zinc-800 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-900 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleStartExport}
                disabled={isExporting}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-600/30"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Rendering...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    <span>Start Export</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Completed Download Screen */
          <div className="mt-6 flex flex-col items-center gap-4 text-center py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-semibold text-base text-white">Export Ready!</h4>
              <p className="mt-1 text-xs text-zinc-400">
                Your {selectedFormat} file has been successfully generated.
              </p>
            </div>
            <a
              href={getExportDownloadUrl(completedExport.id)}
              download
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/30"
            >
              <Download className="h-4 w-4" />
              <span>Download File</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

