import React, { useState, useRef } from "react";
import { UploadCloud, FileVideo, FileText, X, AlertCircle } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import { Badge } from "./Badge";

export interface UploadZoneProps {
  acceptedExtensions: string[];
  maxSizeMB?: number;
  label: string;
  sublabel?: string;
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  error?: string | null;
  className?: string;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  acceptedExtensions,
  maxSizeMB = 500,
  label,
  sublabel,
  selectedFile,
  onFileSelect,
  error,
  className,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (file: File) => {
    setLocalError(null);
    const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;

    if (!acceptedExtensions.map((e) => e.toLowerCase()).includes(ext)) {
      setLocalError(
        `Unsupported file type '${ext}'. Supported formats: ${acceptedExtensions.join(", ")}`
      );
      return;
    }

    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setLocalError(`File size exceeds the ${maxSizeMB}MB limit.`);
      return;
    }

    onFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const isVideo = selectedFile && /\.(mp4|mov|webm|mkv|avi)$/i.test(selectedFile.name);
  const displayError = error || localError;

  return (
    <div className={cn("w-full space-y-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={acceptedExtensions.join(",")}
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
          }
        }}
      />

      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all",
            isDragOver
              ? "border-indigo-500 bg-indigo-950/20"
              : "border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 hover:bg-zinc-900/30"
          )}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-indigo-400 group-hover:scale-105 transition-transform mb-3">
            <UploadCloud className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-semibold text-zinc-100">{label}</h4>
          <p className="mt-1 text-xs text-zinc-400">
            {sublabel || `Drag & drop file here or click to browse`}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
            {acceptedExtensions.map((ext) => (
              <Badge key={ext} variant="neutral">
                {ext.toUpperCase().replace(".", "")}
              </Badge>
            ))}
            <span className="text-[11px] text-zinc-500 ml-1">
              (Up to {maxSizeMB}MB)
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-950/80 border border-indigo-800/60 text-indigo-400 shrink-0">
              {isVideo ? (
                <FileVideo className="h-5 w-5" />
              ) : (
                <FileText className="h-5 w-5" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-100 max-w-sm truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-zinc-400 font-mono">
                {formatBytes(selectedFile.size)} • {selectedFile.type || "file"}
              </p>
            </div>
          </div>
          <button
            onClick={() => onFileSelect(null)}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
            title="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {displayError && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-950/40 border border-rose-900/50 p-2.5 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{displayError}</span>
        </div>
      )}
    </div>
  );
};

