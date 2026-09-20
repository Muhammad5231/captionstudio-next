import { z } from "zod";

export const CaptionWordSchema = z.object({
  id: z.string(),
  text: z.string(),
  start: z.number().min(0),
  end: z.number().min(0),
  confidence: z.number().min(0).max(1).optional(),
});

export type CaptionWord = z.infer<typeof CaptionWordSchema>;

export const CaptionSegmentSchema = z.object({
  id: z.string(),
  start: z.number().min(0),
  end: z.number().min(0),
  text: z.string(),
  words: z.array(CaptionWordSchema).default([]),
});

export type CaptionSegment = z.infer<typeof CaptionSegmentSchema>;

export const CaptionTrackSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string().default("Default Track"),
  language: z.string().default("en"),
  isDefault: z.boolean().default(true),
  segments: z.array(CaptionSegmentSchema).default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type CaptionTrack = z.infer<typeof CaptionTrackSchema>;

export interface GroupingOptions {
  maxWordsPerSegment?: number;
  maxCharsPerSegment?: number;
  maxDurationSeconds?: number;
  splitOnPunctuation?: boolean;
  minGapSecondsToSplit?: number;
}

