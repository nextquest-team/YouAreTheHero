import { z } from 'zod';
import { conditionSchema, effectSchema } from '../../../engine/schemas.js';

export const choiceIdParamSchema = z.object({ choiceId: z.uuid() });

// Même forme que les choix rangés sous leur scène dans GET /me/stories/:id.
export const choiceSchema = z.object({
  id: z.uuid(),
  toSceneId: z.uuid(),
  label: z.string(),
  condition: conditionSchema.nullable(),
  effects: z.array(effectSchema),
  sortOrder: z.number(),
});
export type ChoiceDto = z.infer<typeof choiceSchema>;

const labelSchema = z.string().trim().min(1).max(120);

export const createChoiceBodySchema = z.object({
  toSceneId: z.uuid(),
  label: labelSchema,
  condition: conditionSchema.nullable().optional(),
  effects: z.array(effectSchema).default([]),
});
export type CreateChoiceBody = z.infer<typeof createChoiceBodySchema>;

// `condition: null` retire la condition du choix.
export const updateChoiceBodySchema = z.object({
  toSceneId: z.uuid().optional(),
  label: labelSchema.optional(),
  condition: conditionSchema.nullable().optional(),
  effects: z.array(effectSchema).optional(),
});
export type UpdateChoiceBody = z.infer<typeof updateChoiceBodySchema>;
