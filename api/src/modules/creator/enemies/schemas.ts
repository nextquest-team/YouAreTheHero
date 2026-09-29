import { z } from 'zod';
import { effectSchema, extraStatSchema } from '../../../engine/schemas.js';
import { uploadPathSchema } from '../../../lib/schemas.js';

export const enemyIdParamSchema = z.object({ enemyId: z.uuid() });

export const enemySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  imageUrl: z.string().nullable(),
  attack: z.number(),
  hp: z.number(),
  shield: z.number(),
  extraStats: z.array(extraStatSchema),
  defeatEffects: z.array(effectSchema),
  sortOrder: z.number(),
});
export type EnemyDto = z.infer<typeof enemySchema>;

// Seules attack, hp et shield comptent au combat ; extraStats n'est qu'affiché au joueur.
const nameSchema = z.string().trim().min(1).max(60);
const attackSchema = z.int().min(0).max(1000);
const hpSchema = z.int().min(1).max(1000);
const shieldSchema = z.int().min(0).max(1000);
const extraStatsBodySchema = z
  .array(extraStatSchema.extend({ name: z.string().trim().min(1).max(40), value: z.string().trim().max(40) }))
  .max(20);

export const createEnemyBodySchema = z.object({
  name: nameSchema,
  imageUrl: uploadPathSchema.nullable().optional(),
  attack: attackSchema,
  hp: hpSchema,
  shield: shieldSchema.default(0),
  extraStats: extraStatsBodySchema.default([]),
  defeatEffects: z.array(effectSchema).default([]),
});
export type CreateEnemyBody = z.infer<typeof createEnemyBodySchema>;

export const updateEnemyBodySchema = z.object({
  name: nameSchema.optional(),
  imageUrl: uploadPathSchema.nullable().optional(),
  attack: attackSchema.optional(),
  hp: hpSchema.optional(),
  shield: shieldSchema.optional(),
  extraStats: extraStatsBodySchema.optional(),
  defeatEffects: z.array(effectSchema).optional(),
});
export type UpdateEnemyBody = z.infer<typeof updateEnemyBodySchema>;
