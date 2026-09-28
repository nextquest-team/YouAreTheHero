import { z } from 'zod';

export const mediaIdParamSchema = z.object({ mediaId: z.uuid() });

export const mediaSchema = z.object({
  id: z.uuid(),
  url: z.string(),
  createdAt: z.iso.datetime(),
});
export type MediaDto = z.infer<typeof mediaSchema>;

// Un endroit où l'image est encore utilisée, renvoyé dans le 409 IMAGE_IN_USE.
export const mediaUsageSchema = z.object({
  kind: z.enum(['story', 'scene', 'enemy', 'item']),
  id: z.uuid(),
  storyId: z.uuid(),
  label: z.string(),
});
export type MediaUsage = z.infer<typeof mediaUsageSchema>;
