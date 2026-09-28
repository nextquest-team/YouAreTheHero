import { z } from 'zod';
import type { App } from '../../../app.js';
import { assertEditable, assertOwner } from '../ownership.js';
import { idParamSchema } from '../stories/schemas.js';
import * as statsService from './service.js';
import { createStatBodySchema, statIdParamSchema, statSchema, updateStatBodySchema } from './schemas.js';

// Définitions de stats d'une histoire. Toutes les routes vérifient le propriétaire (403)
// et refusent l'édition d'une histoire publiée (409 STORY_PUBLISHED).
export default async function routes(app: App) {
  const preHandler = [app.authenticate, app.requireRole('CREATOR')];

  app.route({
    method: 'POST',
    url: '/me/stories/:id/stats',
    schema: {
      tags: ['creator'],
      security: [{ bearerAuth: [] }],
      params: idParamSchema,
      body: createStatBodySchema,
      response: { 201: statSchema },
    },
    preHandler,
    handler: async (request, reply) => {
      const story = await assertOwner(request.params.id, request.user.sub);
      assertEditable(story);
      const stat = await statsService.create(story, request.body);
      reply.code(201);
      return stat;
    },
  });

  app.route({
    method: 'PATCH',
    url: '/me/stats/:statId',
    schema: {
      tags: ['creator'],
      security: [{ bearerAuth: [] }],
      params: statIdParamSchema,
      body: updateStatBodySchema,
      response: { 200: statSchema },
    },
    preHandler,
    handler: async (request) => {
      const { stat, story } = await statsService.loadOwned(request.params.statId, request.user.sub);
      assertEditable(story);
      return statsService.update(stat, story, request.body);
    },
  });

  app.route({
    method: 'DELETE',
    url: '/me/stats/:statId',
    schema: {
      tags: ['creator'],
      security: [{ bearerAuth: [] }],
      params: statIdParamSchema,
      response: { 204: z.null().describe('Sans contenu') },
    },
    preHandler,
    handler: async (request, reply) => {
      const { stat, story } = await statsService.loadOwned(request.params.statId, request.user.sub);
      assertEditable(story);
      await statsService.remove(stat);
      reply.code(204).send(null);
    },
  });
}
