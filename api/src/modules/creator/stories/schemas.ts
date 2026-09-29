import { z } from 'zod';
import { uploadPathSchema } from '../../../lib/schemas.js';
import { enemySchema } from '../enemies/schemas.js';
import { itemSchema } from '../items/schemas.js';
import { sceneSchema } from '../scenes/schemas.js';
import { statSchema } from '../stats/schemas.js';

export const idParamSchema = z.object({ id: z.uuid() });

export const storySchema = z.object({
  id: z.uuid(),
  title: z.string(),
  summary: z.string(),
  genre: z.string(),
  coverUrl: z.string().nullable(),
  hasCombat: z.boolean(),
  startSceneId: z.uuid().nullable(),
  attackStatId: z.uuid().nullable(),
  hpStatId: z.uuid().nullable(),
  published: z.boolean(),
  publishedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type StoryDto = z.infer<typeof storySchema>;

export const storyFullSchema = storySchema.extend({
  stats: z.array(statSchema),
  enemies: z.array(enemySchema),
  items: z.array(itemSchema),
  scenes: z.array(sceneSchema),
});
export type StoryFullDto = z.infer<typeof storyFullSchema>;

// Problème relevé avant publication. `sceneId` pointe la scène concernée, s'il y en a une.
export const publishIssueSchema = z.object({
  code: z.string(),
  message: z.string(),
  sceneId: z.uuid().nullable(),
});
export type PublishIssue = z.infer<typeof publishIssueSchema>;

// Réponse de POST /publish : l'histoire publiée et les avertissements (non bloquants).
export const publishResultSchema = storySchema.extend({ warnings: z.array(publishIssueSchema) });
export type PublishResultDto = z.infer<typeof publishResultSchema>;

export const createStoryBodySchema = z.object({
  title: z.string().min(1).max(120),
  summary: z.string().default(''),
  genre: z.string().min(1).max(40),
  coverUrl: uploadPathSchema.optional(),
  hasCombat: z.boolean().default(false),
});
export type CreateStoryBody = z.infer<typeof createStoryBodySchema>;

export const updateStoryBodySchema = z.object({
  title: z.string().min(1).max(120).optional(),
  summary: z.string().optional(),
  genre: z.string().min(1).max(40).optional(),
  coverUrl: uploadPathSchema.nullable().optional(),
  hasCombat: z.boolean().optional(),
  startSceneId: z.uuid().nullable().optional(),
  attackStatId: z.uuid().nullable().optional(),
  hpStatId: z.uuid().nullable().optional(),
});
export type UpdateStoryBody = z.infer<typeof updateStoryBodySchema>;
