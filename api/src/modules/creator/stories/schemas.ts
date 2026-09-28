import { z } from 'zod';
import { conditionSchema, effectSchema } from '../../../engine/schemas.js';
import { uploadPathSchema } from '../../../lib/schemas.js';

export const idParamSchema = z.object({ id: z.uuid() });

export const storySchema = z.object({
  id: z.uuid(),
  title: z.string(),
  summary: z.string(),
  genre: z.string(),
  coverUrl: z.string().nullable(),
  startSceneId: z.uuid().nullable(),
  attackStatId: z.uuid().nullable(),
  hpStatId: z.uuid().nullable(),
  published: z.boolean(),
  publishedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type StoryDto = z.infer<typeof storySchema>;

// Formes minimales des entités enfants, juste de quoi assembler l'histoire complète :
// A les remplacera par les schémas dédiés de ses modules stats/enemies/items/scenes/choices.
const statDefinitionSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  type: z.enum(['number', 'text']),
  defaultValue: z.string(),
  min: z.number().nullable(),
  max: z.number().nullable(),
  sortOrder: z.number(),
});

const enemySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  imageUrl: z.string().nullable(),
  attack: z.number(),
  hp: z.number(),
});

const itemSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  useEffects: z.array(effectSchema).nullable(),
  sortOrder: z.number(),
});

const choiceSchema = z.object({
  id: z.uuid(),
  toSceneId: z.uuid(),
  label: z.string(),
  condition: conditionSchema.nullable(),
  effects: z.array(effectSchema),
  sortOrder: z.number(),
});

const sceneSchema = z.object({
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

export const storyFullSchema = storySchema.extend({
  stats: z.array(statDefinitionSchema),
  enemies: z.array(enemySchema),
  items: z.array(itemSchema),
  scenes: z.array(sceneSchema),
});
export type StoryFullDto = z.infer<typeof storyFullSchema>;

export const createStoryBodySchema = z.object({
  title: z.string().min(1).max(120),
  summary: z.string().default(''),
  genre: z.string().min(1).max(40),
  coverUrl: uploadPathSchema.optional(),
});
export type CreateStoryBody = z.infer<typeof createStoryBodySchema>;

export const updateStoryBodySchema = z.object({
  title: z.string().min(1).max(120).optional(),
  summary: z.string().optional(),
  genre: z.string().min(1).max(40).optional(),
  coverUrl: uploadPathSchema.nullable().optional(),
  startSceneId: z.uuid().nullable().optional(),
  attackStatId: z.uuid().nullable().optional(),
  hpStatId: z.uuid().nullable().optional(),
});
export type UpdateStoryBody = z.infer<typeof updateStoryBodySchema>;
