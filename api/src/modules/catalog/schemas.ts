import { z } from 'zod';

export const storyIdParamSchema = z.object({ id: z.uuid() });

export const listStoriesQuerySchema = z.object({
  q: z.string().optional(),
  genre: z.string().optional(),
  // Les histoires publiées d'un seul créateur (page auteur).
  authorId: z.uuid().optional(),
});
export type ListStoriesQuery = z.infer<typeof listStoriesQuerySchema>;

const authorSchema = z.object({
  id: z.uuid(),
  displayName: z.string(),
});

export const storyCardSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  summary: z.string(),
  genre: z.string(),
  coverUrl: z.string().nullable(),
  hasCombat: z.boolean(),
  author: authorSchema,
  avgRating: z.number().nullable(),
  isFavorite: z.boolean(),
});
export type StoryCardDto = z.infer<typeof storyCardSchema>;

const storyStatSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  type: z.enum(['number', 'text']),
  defaultValue: z.string(),
  min: z.number().nullable(),
  max: z.number().nullable(),
});

const mySaveSchema = z.object({
  status: z.enum(['IN_PROGRESS', 'FINISHED', 'DEAD']),
  updatedAt: z.iso.datetime(),
});

export const storyDetailSchema = storyCardSchema.extend({
  stats: z.array(storyStatSchema),
  mySave: mySaveSchema.nullable(),
});
export type StoryDetailDto = z.infer<typeof storyDetailSchema>;

export const genresSchema = z.array(z.string());
