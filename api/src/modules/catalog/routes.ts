import type { App } from '../../app.js';
import * as catalogService from './service.js';
import { genresSchema, listStoriesQuerySchema, storyCardSchema, storyDetailSchema, storyIdParamSchema } from './schemas.js';

// Bibliothèque des histoires publiées, réservée aux PLAYER (voir docs/conception.md section 7).
export default async function routes(app: App) {
  const preHandler = [app.authenticate, app.requireRole('PLAYER')];

  // Déclarée avant /stories/:id : un chemin statique n'est de toute façon jamais capturé par un
  // paramétré chez Fastify, mais l'ordre reste explicite pour ne pas s'y fier par accident.
  app.route({
    method: 'GET',
    url: '/stories/genres',
    schema: {
      tags: ['catalog'],
      security: [{ bearerAuth: [] }],
      response: { 200: genresSchema },
    },
    preHandler,
    handler: async () => catalogService.listGenres(),
  });

  app.route({
    method: 'GET',
    url: '/stories',
    schema: {
      tags: ['catalog'],
      security: [{ bearerAuth: [] }],
      querystring: listStoriesQuerySchema,
      response: { 200: storyCardSchema.array() },
    },
    preHandler,
    handler: async (request) => catalogService.listPublished(request.user.sub, request.query),
  });

  app.route({
    method: 'GET',
    url: '/stories/:id',
    schema: {
      tags: ['catalog'],
      security: [{ bearerAuth: [] }],
      params: storyIdParamSchema,
      response: { 200: storyDetailSchema },
    },
    preHandler,
    handler: async (request) => catalogService.getPublishedDetail(request.params.id, request.user.sub),
  });
}
