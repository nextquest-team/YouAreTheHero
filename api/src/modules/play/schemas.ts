import { z } from 'zod';
import { extraStatSchema } from '../../engine/schemas.js';
import { uploadPathSchema } from '../../lib/schemas.js';

export const storyIdParamSchema = z.object({ storyId: z.uuid() });

export const startBodySchema = z.object({
  textStats: z.record(z.uuid(), z.string()).optional(),
  heroFaceUrl: uploadPathSchema.optional(),
});
export type StartBody = z.infer<typeof startBodySchema>;

export const chooseBodySchema = z.object({ choiceId: z.uuid() });
export type ChooseBody = z.infer<typeof chooseBodySchema>;

const sceneDtoSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  text: z.string(),
  backgroundUrl: z.string().nullable(),
  isEnding: z.boolean(),
});

const choiceDtoSchema = z.object({
  id: z.uuid(),
  label: z.string(),
  locked: z.boolean(),
  conditionLabel: z.string().nullable(),
});

const statDtoSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  type: z.enum(['number', 'text']),
  value: z.union([z.number(), z.string()]),
  min: z.number().nullable(),
  max: z.number().nullable(),
});

const inventoryItemDtoSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  imageUrl: z.string().nullable(),
  description: z.string().nullable(),
  qty: z.number(),
  usable: z.boolean(),
});

const changeDtoSchema = z.object({
  label: z.string(),
  kind: z.enum(['stat', 'item']),
  delta: z.number(),
});

const combatDtoSchema = z.object({
  enemy: z.object({
    name: z.string(),
    imageUrl: z.string().nullable(),
    attack: z.number(),
    hpMax: z.number(),
    shieldMax: z.number(),
    extraStats: z.array(extraStatSchema),
  }),
  enemyHp: z.number(),
  enemyShield: z.number(),
  heroHp: z.number(),
  log: z.array(z.string()),
});

export const gameStateSchema = z.object({
  storyId: z.uuid(),
  status: z.enum(['IN_PROGRESS', 'FINISHED', 'DEAD']),
  scene: sceneDtoSchema,
  choices: z.array(choiceDtoSchema),
  stats: z.array(statDtoSchema),
  hpStatId: z.uuid().nullable(),
  heroFaceUrl: z.string().nullable(),
  inventory: z.array(inventoryItemDtoSchema),
  changes: z.array(changeDtoSchema),
  combat: combatDtoSchema.nullable(),
});
export type GameStateDto = z.infer<typeof gameStateSchema>;

export const saveSummarySchema = z.object({
  story: z.object({ id: z.uuid(), title: z.string(), coverUrl: z.string().nullable() }),
  status: z.enum(['IN_PROGRESS', 'FINISHED', 'DEAD']),
  updatedAt: z.iso.datetime(),
});
export type SaveSummaryDto = z.infer<typeof saveSummarySchema>;
