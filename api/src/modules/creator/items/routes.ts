import { z } from 'zod';
import type { App } from '../../../app.js';
import { assertEditable, assertOwner } from '../ownership.js';
import { idParamSchema } from '../stories/schemas.js';
import * as itemsService from './service.js';
import { createItemBodySchema, itemIdParamSchema, itemSchema, updateItemBodySchema } from './schemas.js';

// Objets d'une histoire. Toutes les routes vérifient le propriétaire (403)
// et refusent l'édition d'une histoire publiée (409 STORY_PUBLISHED).
export default async function routes(app: App) {
  const preHandler = [app.authenticate, app.requireRole('CREATOR')];

  app.route({
    method: 'POST',
    url: '/me/stories/:id/items',
    schema: {
      tags: ['creator'],
      security: [{ bearerAuth: [] }],
      params: idParamSchema,
      body: createItemBodySchema,
      response: { 201: itemSchema },
    },
    preHandler,
    handler: async (request, reply) => {
      const story = await assertOwner(request.params.id, request.user.sub);
      assertEditable(story);
      const item = await itemsService.create(story, request.body);
      reply.code(201);
      return item;
    },
  });

  app.route({
    method: 'PATCH',
    url: '/me/items/:itemId',
    schema: {
      tags: ['creator'],
      security: [{ bearerAuth: [] }],
      params: itemIdParamSchema,
      body: updateItemBodySchema,
      response: { 200: itemSchema },
    },
    preHandler,
    handler: async (request) => {
      const { item, story } = await itemsService.loadOwned(request.params.itemId, request.user.sub);
      assertEditable(story);
      return itemsService.update(item, request.body);
    },
  });

  app.route({
    method: 'DELETE',
    url: '/me/items/:itemId',
    schema: {
      tags: ['creator'],
      security: [{ bearerAuth: [] }],
      params: itemIdParamSchema,
      response: { 204: z.null().describe('Sans contenu') },
    },
    preHandler,
    handler: async (request, reply) => {
      const { item, story } = await itemsService.loadOwned(request.params.itemId, request.user.sub);
      assertEditable(story);
      await itemsService.remove(item);
      reply.code(204).send(null);
    },
  });
}
