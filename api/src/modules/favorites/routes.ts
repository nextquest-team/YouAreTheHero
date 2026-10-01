import { z } from 'zod';
import type { App } from '../../app.js';
import { storyCardSchema, storyIdParamSchema } from '../catalog/schemas.js';
import * as favoritesService from './service.js';

// Favoris du joueur, réservés aux PLAYER (voir docs/conception.md section 7).
export default async function routes(app: App) {
  const preHandler = [app.authenticate, app.requireRole('PLAYER')];

  app.route({
    method: 'PUT',
    url: '/stories/:id/favorite',
    schema: {
      tags: ['favorites'],
      security: [{ bearerAuth: [] }],
      params: storyIdParamSchema,
      response: { 204: z.null().describe('Sans contenu') },
    },
    preHandler,
    handler: async (request, reply) => {
      await favoritesService.add(request.user.sub, request.params.id);
      reply.code(204).send(null);
    },
  });

  app.route({
    method: 'DELETE',
    url: '/stories/:id/favorite',
    schema: {
      tags: ['favorites'],
      security: [{ bearerAuth: [] }],
      params: storyIdParamSchema,
      response: { 204: z.null().describe('Sans contenu') },
    },
    preHandler,
    handler: async (request, reply) => {
      await favoritesService.remove(request.user.sub, request.params.id);
      reply.code(204).send(null);
    },
  });

  app.route({
    method: 'GET',
    url: '/me/favorites',
    schema: {
      tags: ['favorites'],
      security: [{ bearerAuth: [] }],
      response: { 200: storyCardSchema.array() },
    },
    preHandler,
    handler: async (request) => favoritesService.listMine(request.user.sub),
  });
}
