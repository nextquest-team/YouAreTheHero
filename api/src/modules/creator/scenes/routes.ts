import { z } from 'zod';
import type { App } from '../../../app.js';
import { assertEditable, assertOwner } from '../ownership.js';
import { idParamSchema } from '../stories/schemas.js';
import * as scenesService from './service.js';
import { createSceneBodySchema, sceneIdParamSchema, sceneSchema, updateSceneBodySchema } from './schemas.js';

// Scènes d'une histoire. Toutes les routes vérifient le propriétaire (403)
// et refusent l'édition d'une histoire publiée (409 STORY_PUBLISHED).
export default async function routes(app: App) {
  const preHandler = [app.authenticate, app.requireRole('CREATOR')];

  app.route({
    method: 'POST',
    url: '/me/stories/:id/scenes',
    schema: {
      tags: ['creator'],
      security: [{ bearerAuth: [] }],
      params: idParamSchema,
      body: createSceneBodySchema,
      response: { 201: sceneSchema },
    },
    preHandler,
    handler: async (request, reply) => {
      const story = await assertOwner(request.params.id, request.user.sub);
      assertEditable(story);
      const scene = await scenesService.create(story, request.body);
      reply.code(201);
      return scene;
    },
  });

  app.route({
    method: 'PATCH',
    url: '/me/scenes/:sceneId',
    schema: {
      tags: ['creator'],
      security: [{ bearerAuth: [] }],
      params: sceneIdParamSchema,
      body: updateSceneBodySchema,
      response: { 200: sceneSchema },
    },
    preHandler,
    handler: async (request) => {
      const { scene, story } = await scenesService.loadOwned(request.params.sceneId, request.user.sub);
      assertEditable(story);
      return scenesService.update(scene, story, request.body);
    },
  });

  app.route({
    method: 'DELETE',
    url: '/me/scenes/:sceneId',
    schema: {
      tags: ['creator'],
      security: [{ bearerAuth: [] }],
      params: sceneIdParamSchema,
      response: { 204: z.null().describe('Sans contenu') },
    },
    preHandler,
    handler: async (request, reply) => {
      const { scene, story } = await scenesService.loadOwned(request.params.sceneId, request.user.sub);
      assertEditable(story);
      await scenesService.remove(scene);
      reply.code(204).send(null);
    },
  });
}
