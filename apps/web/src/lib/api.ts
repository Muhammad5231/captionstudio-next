export const API_BASE = "/api/v1";

export interface ProjectData {
  id: string;
  name: string;
  status: string;
  source_type: string;
  duration?: number;
  width?: number;
  height?: number;
  language?: string;
  created_at?: string;
  assets: Array<{
    id: string;
    project_id: string;
    type: string;
    original_filename: string;
    mime_type: string;
    size: number;
    duration?: number;
    width?: number;
    height?: number;
  }>;
  caption_tracks: Array<CaptionTrackData>;
}

export interface CaptionWordData {
  id: string;
  word: string;
  start_time: number;
  end_time: number;
  confidence?: number;
  word_index: number;
}

export interface CaptionSegmentData {
  id: string;
  segment_index: number;
  start_time: number;
  end_time: number;
  text: string;
  words: CaptionWordData[];
}

export interface CaptionTrackData {
  id: string;
  project_id: string;
  name: string;
  language: string;
  is_default: boolean;
  segments: CaptionSegmentData[];
}

export interface JobData {
  id: string;
  project_id: string;
  job_type: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";
  stage: string;
  progress: number;
  message: string;
  error_details?: string;
}

export async function createProject(name: string, sourceType: string): Promise<ProjectData> {
  const res = await fetch(`${API_BASE}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, source_type: sourceType }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: "Failed to create project" } }));
    throw new Error(err.error?.message || "Project creation failed");
  }
  return res.json();
}

export async function listProjects(): Promise<ProjectData[]> {
  const res = await fetch(`${API_BASE}/projects`);
  if (!res.ok) throw new Error("Failed to load projects");
  return res.json();
}

export async function getProject(id: string): Promise<ProjectData> {
  const res = await fetch(`${API_BASE}/projects/${id}`);
  if (!res.ok) throw new Error("Failed to load project details");
  return res.json();
}

export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/projects/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete project");
}

export async function uploadAsset(
  projectId: string,
  file: File,
  assetType: "VIDEO" | "SUBTITLE"
): Promise<{ asset: ProjectData["assets"][0] }> {
  const formData = new FormData();
  formData.append("project_id", projectId);
  formData.append("asset_type", assetType);
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/uploads`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: "Upload failed" } }));
    throw new Error(err.error?.message || "File upload failed");
  }

  return res.json();
}

export async function startTranscription(
  projectId: string,
  videoAssetId: string,
  language: string = "auto"
): Promise<JobData> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/transcribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ video_asset_id: videoAssetId, language }),
  });
  if (!res.ok) throw new Error("Failed to trigger transcription");
  return res.json();
}

export async function importSubtitles(
  projectId: string,
  subtitleAssetId: string,
  videoAssetId?: string,
  chromaColor: string = "#00FF00"
): Promise<JobData> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/subtitles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subtitle_asset_id: subtitleAssetId,
      video_asset_id: videoAssetId,
      chroma_color: chromaColor,
    }),
  });
  if (!res.ok) throw new Error("Failed to trigger subtitle import");
  return res.json();
}

export async function updateCaptionTrack(
  projectId: string,
  trackId: string,
  segments: Array<{ start_time: number; end_time: number; text: string }>
): Promise<CaptionTrackData> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/captions/${trackId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ segments }),
  });
  if (!res.ok) throw new Error("Failed to save captions");
  return res.json();
}

export function getAssetStreamUrl(assetId: string): string {
  return `${API_BASE}/assets/${assetId}/stream`;
}

