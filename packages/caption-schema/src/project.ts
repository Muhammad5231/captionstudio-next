import { z } from "zod";

export const ProjectSourceTypeSchema = z.enum([
  "VIDEO",
  "SUBTITLE",
  "VIDEO_WITH_SUBTITLE",
]);

export type ProjectSourceType = z.infer<typeof ProjectSourceTypeSchema>;

export const ProjectStatusSchema = z.enum([
  "CREATED",
  "PROCESSING",
  "READY",
  "FAILED",
]);

export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  sourceType: ProjectSourceTypeSchema,
  status: ProjectStatusSchema.default("CREATED"),
  duration: z.number().nullable().optional(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  language: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Project = z.infer<typeof ProjectSchema>;

export const AssetTypeSchema = z.enum(["VIDEO", "AUDIO", "SUBTITLE", "THUMBNAIL"]);

export type AssetType = z.infer<typeof AssetTypeSchema>;

export const ProjectAssetSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  type: AssetTypeSchema,
  originalFilename: z.string(),
  mimeType: z.string(),
  size: z.number(),
  storageKey: z.string(),
  duration: z.number().nullable().optional(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  createdAt: z.string().optional(),
});

export type ProjectAsset = z.infer<typeof ProjectAssetSchema>;

