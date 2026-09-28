import { z } from 'zod';
import { uploadPathSchema } from '../../lib/schemas.js';

export const roleSchema = z.enum(['PLAYER', 'CREATOR']);
export type Role = z.infer<typeof roleSchema>;

/** Forme publique d'un utilisateur : jamais de passwordHash. */
export const userPublicSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  displayName: z.string(),
  role: roleSchema,
  avatarUrl: z.string().nullable(),
  createdAt: z.iso.datetime(),
});
export type UserPublic = z.infer<typeof userPublicSchema>;

export const authResponseSchema = z.object({
  token: z.string(),
  user: userPublicSchema,
});

export const registerBodySchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(50),
  role: roleSchema,
});

export const loginBodySchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const patchMeBodySchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  avatarUrl: uploadPathSchema.nullable().optional(),
});
