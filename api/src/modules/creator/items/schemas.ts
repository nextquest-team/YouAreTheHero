import { z } from 'zod';
import { effectSchema } from '../../../engine/schemas.js';
import { uploadPathSchema } from '../../../lib/schemas.js';

export const itemIdParamSchema = z.object({ itemId: z.uuid() });

// `useEffects` renseigné (liste non vide) : l'objet est un consommable, utilisable en jeu.
export const itemSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  useEffects: z.array(effectSchema).nullable(),
  sortOrder: z.number(),
});
export type ItemDto = z.infer<typeof itemSchema>;

const nameSchema = z.string().trim().min(1).max(60);
const descriptionSchema = z.string().trim().max(500);

export const createItemBodySchema = z.object({
  name: nameSchema,
  description: descriptionSchema.nullable().optional(),
  imageUrl: uploadPathSchema.nullable().optional(),
  useEffects: z.array(effectSchema).nullable().optional(),
});
export type CreateItemBody = z.infer<typeof createItemBodySchema>;

export const updateItemBodySchema = z.object({
  name: nameSchema.optional(),
  description: descriptionSchema.nullable().optional(),
  imageUrl: uploadPathSchema.nullable().optional(),
  useEffects: z.array(effectSchema).nullable().optional(),
});
export type UpdateItemBody = z.infer<typeof updateItemBodySchema>;
