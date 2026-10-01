import { z } from 'zod';

export const createReviewBodySchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});
export type CreateReviewBody = z.infer<typeof createReviewBodySchema>;

export const reviewSchema = z.object({
  id: z.uuid(),
  rating: z.number().int(),
  comment: z.string().nullable(),
  author: z.object({ id: z.uuid(), displayName: z.string() }),
  createdAt: z.iso.datetime(),
});
export type ReviewDto = z.infer<typeof reviewSchema>;

export const reviewListSchema = z.object({
  avgRating: z.number().nullable(),
  count: z.number().int(),
  mine: reviewSchema.nullable(),
  canReview: z.boolean(),
  reviews: z.array(reviewSchema),
});
export type ReviewListDto = z.infer<typeof reviewListSchema>;
