import { z } from 'zod';
import type { App } from '../../../app.js';
import { assertEditable, assertOwner } from '../ownership.js';
import { idParamSchema } from '../stories/schemas.js';
import * as enemiesService from './service.js';
import { createEnemyBodySchema, enemyIdParamSchema, enemySchema, updateEnemyBodySchema } from './schemas.js';

// Ennemis d'une histoire. Toutes les routes vérifient le propriétaire (403)
// et refusent l'édition d'une histoire publiée (409 STORY_PUBLISHED).
export default async function routes(app: App) {
  const preHandler = [app.authenticate, app.requireRole('CREATOR')];

  app.route({
    method: 'POST',
    url: '/me/stories/:id/enemies',
    schema: {
      tags: ['creator'],
      security: [{ bearerAuth: [] }],
      params: idParamSchema,
      body: createEnemyBodySchema,
      response: { 201: enemySchema },
    },
    preHandler,
    handler: async (request, reply) => {
      const story = await assertOwner(request.params.id, request.user.sub);
      assertEditable(story);
      const enemy = await enemiesService.create(story, request.body);
      reply.code(201);
      return enemy;
    },
  });

  app.route({
    method: 'PATCH',
    url: '/me/enemies/:enemyId',
    schema: {
      tags: ['creator'],
      security: [{ bearerAuth: [] }],
      params: enemyIdParamSchema,
      body: updateEnemyBodySchema,
      response: { 200: enemySchema },
    },
    preHandler,
    handler: async (request) => {
      const { enemy, story } = await enemiesService.loadOwned(request.params.enemyId, request.user.sub);
      assertEditable(story);
      return enemiesService.update(enemy, request.body);
    },
  });

  app.route({
    method: 'DELETE',
    url: '/me/enemies/:enemyId',
    schema: {
      tags: ['creator'],
      security: [{ bearerAuth: [] }],
      params: enemyIdParamSchema,
      response: { 204: z.null().describe('Sans contenu') },
    },
    preHandler,
    handler: async (request, reply) => {
      const { enemy, story } = await enemiesService.loadOwned(request.params.enemyId, request.user.sub);
      assertEditable(story);
      await enemiesService.remove(enemy);
      reply.code(204).send(null);
    },
  });
}
