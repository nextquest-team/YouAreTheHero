import type { App } from '../../app.js';
import { storyIdParamSchema } from '../catalog/schemas.js';
import { createReviewBodySchema, reviewListSchema, reviewSchema } from './schemas.js';
import * as reviewsService from './service.js';

// Avis des joueurs sur les histoires, réservés aux PLAYER (voir docs/conception.md section 7).
export default async function routes(app: App) {
  const preHandler = [app.authenticate, app.requireRole('PLAYER')];

  app.route({
    method: 'GET',
    url: '/stories/:id/reviews',
    schema: {
      tags: ['reviews'],
      security: [{ bearerAuth: [] }],
      params: storyIdParamSchema,
      response: { 200: reviewListSchema },
    },
    preHandler,
    handler: async (request) => reviewsService.list(request.params.id, request.user.sub),
  });

  app.route({
    method: 'POST',
    url: '/stories/:id/reviews',
    schema: {
      tags: ['reviews'],
      security: [{ bearerAuth: [] }],
      params: storyIdParamSchema,
      body: createReviewBodySchema,
      response: { 200: reviewSchema.describe('Avis remplacé'), 201: reviewSchema.describe('Avis créé') },
    },
    preHandler,
    handler: async (request, reply) => {
      const { review, created } = await reviewsService.upsert(request.params.id, request.user.sub, request.body);
      reply.code(created ? 201 : 200);
      return review;
    },
  });
}
