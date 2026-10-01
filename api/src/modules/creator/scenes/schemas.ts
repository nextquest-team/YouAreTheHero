import { z } from 'zod';
import { effectSchema } from '../../../engine/schemas.js';
import { uploadPathSchema } from '../../../lib/schemas.js';
import { choiceSchema } from '../choices/schemas.js';

export const sceneIdParamSchema = z.object({ sceneId: z.uuid() });

// Même forme que les scènes de GET /me/stories/:id, avec leurs choix (dans l'ordre).
export const sceneSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  text: z.string(),
  backgroundUrl: z.string().nullable(),
  isEnding: z.boolean(),
  enemyId: z.uuid().nullable(),
  winSceneId: z.uuid().nullable(),
  loseSceneId: z.uuid().nullable(),
  onEnterEffects: z.array(effectSchema),
  sortOrder: z.number(),
  choices: z.array(choiceSchema),
});
export type SceneDto = z.infer<typeof sceneSchema>;

// Endroit qui mène encore à une scène, renvoyé dans le 409 SCENE_IN_USE : l'histoire (scène de
// départ), une autre scène (issue de combat) ou le choix d'une autre scène.
export const sceneUsageSchema = z.object({
  kind: z.enum(['story', 'scene', 'choice']),
  id: z.uuid(),
  storyId: z.uuid(),
  label: z.string(),
});
export type SceneUsage = z.infer<typeof sceneUsageSchema>;

const titleSchema = z.string().trim().min(1).max(120);
const textSchema = z.string().max(10000);

export const createSceneBodySchema = z.object({
  title: titleSchema,
  text: textSchema,
  backgroundUrl: uploadPathSchema.nullable().optional(),
  isEnding: z.boolean().default(false),
  enemyId: z.uuid().nullable().optional(),
  winSceneId: z.uuid().nullable().optional(),
  loseSceneId: z.uuid().nullable().optional(),
  onEnterEffects: z.array(effectSchema).default([]),
});
export type CreateSceneBody = z.infer<typeof createSceneBodySchema>;

// `null` efface l'ennemi, la scène de victoire ou de défaite, ou le décor.
export const updateSceneBodySchema = z.object({
  title: titleSchema.optional(),
  text: textSchema.optional(),
  backgroundUrl: uploadPathSchema.nullable().optional(),
  isEnding: z.boolean().optional(),
  enemyId: z.uuid().nullable().optional(),
  winSceneId: z.uuid().nullable().optional(),
  loseSceneId: z.uuid().nullable().optional(),
  onEnterEffects: z.array(effectSchema).optional(),
});
export type UpdateSceneBody = z.infer<typeof updateSceneBodySchema>;
