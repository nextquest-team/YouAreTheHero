import { z } from 'zod';

export const statIdParamSchema = z.object({ statId: z.uuid() });

export const statTypeSchema = z.enum(['number', 'text']);

export const statSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  type: statTypeSchema,
  defaultValue: z.string(),
  min: z.number().nullable(),
  max: z.number().nullable(),
  sortOrder: z.number(),
});
export type StatDto = z.infer<typeof statSchema>;

// La cohérence entre type, valeur par défaut, min et max est vérifiée par le service, sur les
// valeurs fusionnées : un PATCH peut ne changer que le min d'une stat existante.
export const createStatBodySchema = z.object({
  name: z.string().trim().min(1).max(40),
  type: statTypeSchema,
  defaultValue: z.string().trim(),
  min: z.int().nullable().optional(),
  max: z.int().nullable().optional(),
});
export type CreateStatBody = z.infer<typeof createStatBodySchema>;

export const updateStatBodySchema = z.object({
  name: z.string().trim().min(1).max(40).optional(),
  type: statTypeSchema.optional(),
  defaultValue: z.string().trim().optional(),
  min: z.int().nullable().optional(),
  max: z.int().nullable().optional(),
});
export type UpdateStatBody = z.infer<typeof updateStatBodySchema>;
