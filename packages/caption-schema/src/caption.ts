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

export const CaptionAnimationTypeSchema = z.enum([
  "none",
  "word-pop",
  "bounce",
  "fade",
  "karaoke",
  "zoom",
  "slide",
  "elastic",
]);
export type CaptionAnimationType = z.infer<typeof CaptionAnimationTypeSchema>;

export const CaptionDisplayModeSchema = z.enum([
  "word",
  "chunk",
  "segment",
  "line",
]);
export type CaptionDisplayMode = z.infer<typeof CaptionDisplayModeSchema>;

export const CaptionRenderSpecSchema = z.object({
  version: z.literal(1).default(1),
  // Typography
  fontFamily: z.string().default("Montserrat"),
  fontSize: z.number().min(10).max(200).default(42),
  fontWeight: z.union([z.string(), z.number()]).default("800"),
  fontStyle: z.enum(["normal", "italic"]).default("normal"),
  textTransform: z.enum(["none", "uppercase", "lowercase", "capitalize"]).default("uppercase"),
  letterSpacing: z.number().default(0),
  lineHeight: z.number().default(1.2),

  // Colors & Styling
  textColor: z.string().default("#FFFFFF"),
  highlightColor: z.string().default("#FFE600"),
  secondaryColor: z.string().default("#00FF88"),
  strokeColor: z.string().default("#000000"),
  strokeWidth: z.number().min(0).max(30).default(6),
  shadowColor: z.string().default("rgba(0, 0, 0, 0.8)"),
  shadowBlur: z.number().min(0).max(50).default(8),
  shadowOffsetX: z.number().default(2),
  shadowOffsetY: z.number().default(4),

  // Background Box / Pill
  backgroundColor: z.string().default("transparent"),
  backgroundPaddingX: z.number().min(0).default(16),
  backgroundPaddingY: z.number().min(0).default(8),
  backgroundBorderRadius: z.number().min(0).default(8),

  // Position & Alignment
  positionY: z.number().min(0).max(100).default(80),
  positionX: z.number().min(0).max(100).default(50),
  alignment: z.enum(["left", "center", "right"]).default("center"),

  // Layout limits
  maxWordsPerLine: z.number().min(1).max(15).default(4),
  maxLines: z.number().min(1).max(5).default(2),
  safeAreaMargin: z.number().min(0).max(30).default(5),

  // Animation & Display
  animation: z.object({
    type: CaptionAnimationTypeSchema.default("word-pop"),
    durationMs: z.number().min(0).max(1000).default(120),
    scale: z.number().min(1).max(2).default(1.15),
  }).default({ type: "word-pop", durationMs: 120, scale: 1.15 }),
  displayMode: CaptionDisplayModeSchema.default("segment"),
});
export type CaptionRenderSpec = z.infer<typeof CaptionRenderSpecSchema>;

export const StyleCategorySchema = z.enum([
  "VIRAL_BOLD",
  "MINIMAL",
  "KINETIC",
  "HIGHLIGHT",
  "CINEMATIC",
  "CREATOR_SOCIAL",
]);
export type StyleCategory = z.infer<typeof StyleCategorySchema>;

export const StyleTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: StyleCategorySchema,
  description: z.string(),
  renderSpec: CaptionRenderSpecSchema,
  thumbnailCss: z.record(z.string()).optional(),
  tags: z.array(z.string()).default([]),
});
export type StyleTemplate = z.infer<typeof StyleTemplateSchema>;

export const CaptionTrackSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string().default("Default Track"),
  language: z.string().default("en"),
  isDefault: z.boolean().default(true),
  style: CaptionRenderSpecSchema.optional(),
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


