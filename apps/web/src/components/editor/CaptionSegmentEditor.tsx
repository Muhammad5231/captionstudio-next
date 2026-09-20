import React, { useState } from "react";
import { Clock, Edit3, Check, Save } from "lucide-react";
import { CaptionTrackData, CaptionSegmentData, updateCaptionTrack } from "@/lib/api";
import { formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface CaptionSegmentEditorProps {
  projectId: string;
  captionTrack: CaptionTrackData;
  currentTime: number;
  onSeek: (time: number) => void;
  onTrackUpdated: (track: CaptionTrackData) => void;
}

export const CaptionSegmentEditor: React.FC<CaptionSegmentEditorProps> = ({
  projectId,
  captionTrack,
  currentTime,
  onSeek,
  onTrackUpdated,
}) => {
  const [segments, setSegments] = useState<CaptionSegmentData[]>(captionTrack.segments);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const startEdit = (seg: CaptionSegmentData) => {
    setEditingId(seg.id);
    setEditText(seg.text);
  };

  const commitEdit = (id: string) => {
    setSegments((prev) =>
      prev.map((s) => (s.id === id ? { ...s, text: editText } : s))
    );
    setEditingId(null);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const payload = segments.map((s) => ({
        start_time: s.start_time,
        end_time: s.end_time,
        text: s.text,
      }));
      const updated = await updateCaptionTrack(projectId, captionTrack.id, payload);
      onTrackUpdated(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error("Save failed:", e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">
            Caption Segments ({segments.length})
          </h3>
          <p className="text-xs text-zinc-400">
            Click segment to seek. Edit text directly below.
          </p>
        </div>
        <Button
          size="sm"
          variant={saveSuccess ? "subtle" : "default"}
          onClick={handleSaveAll}
          isLoading={isSaving}
          className="gap-1.5"
        >
          {saveSuccess ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" /> Saved
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5" /> Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Segments List */}
      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {segments.map((seg) => {
          const isActive =
            currentTime >= seg.start_time && currentTime <= seg.end_time;
          const isEditing = editingId === seg.id;

          return (
            <div
              key={seg.id}
              className={`rounded-xl border p-3 transition-all ${
                isActive
                  ? "border-indigo-500 bg-indigo-950/30 shadow-md"
                  : "border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/80"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <button
                  onClick={() => onSeek(seg.start_time)}
                  className="flex items-center gap-1.5 rounded bg-zinc-800/80 px-2 py-0.5 text-[11px] font-mono text-zinc-300 hover:bg-indigo-600 hover:text-white transition-colors"
                  title="Jump video to this timestamp"
                >
                  <Clock className="h-3 w-3" />
                  {formatTime(seg.start_time)} - {formatTime(seg.end_time)}
                </button>

                {!isEditing ? (
                  <button
                    onClick={() => startEdit(seg)}
                    className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    title="Edit caption text"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => commitEdit(seg.id)}
                    className="rounded bg-emerald-600/30 px-2 py-0.5 text-[11px] font-medium text-emerald-300 hover:bg-emerald-600/50"
                  >
                    Done
                  </button>
                )}
              </div>

              {isEditing ? (
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      commitEdit(seg.id);
                    }
                  }}
                  rows={2}
                  className="w-full rounded-lg border border-indigo-500 bg-zinc-950 p-2 text-xs text-zinc-100 focus:outline-none"
                  autoFocus
                />
              ) : (
                <p
                  onClick={() => onSeek(seg.start_time)}
                  className="text-xs text-zinc-200 cursor-pointer hover:text-white transition-colors"
                >
                  {seg.text}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

