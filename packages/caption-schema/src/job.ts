import { z } from "zod";

export const JobTypeSchema = z.enum([
  "MEDIA_ANALYSIS",
  "AUDIO_EXTRACTION",
  "TRANSCRIPTION",
  "SUBTITLE_IMPORT",
  "CAPTION_GENERATION",
]);

export type JobType = z.infer<typeof JobTypeSchema>;

export const JobStatusSchema = z.enum([
  "QUEUED",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
]);

export type JobStatus = z.infer<typeof JobStatusSchema>;

export const JobProgressEventSchema = z.object({
  jobId: z.string(),
  status: JobStatusSchema,
  stage: z.string(),
  progress: z.number().min(0).max(100),
  message: z.string(),
  error: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  completedAt: z.string().nullable().optional(),
});

export type JobProgressEvent = z.infer<typeof JobProgressEventSchema>;

