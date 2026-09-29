import { z } from 'zod';
import type { App } from '../../../app.js';
import { assertEditable } from '../ownership.js';
import { sceneIdParamSchema } from '../scenes/schemas.js';
import * as choicesService from './service.js';
import { choiceIdParamSchema, choiceSchema, createChoiceBodySchema, updateChoiceBodySchema } from './schemas.js';

// Choix d'une scène. Toutes les routes vérifient le propriétaire (403)
// et refusent l'édition d'une histoire publiée (409 STORY_PUBLISHED).
export default async function routes(app: App) {
  const preHandler = [app.authenticate, app.requireRole('CREATOR')];

  app.route({
    method: 'POST',
    url: '/me/scenes/:sceneId/choices',
    schema: {
      tags: ['creator'],
      security: [{ bearerAuth: [] }],
      params: sceneIdParamSchema,
      body: createChoiceBodySchema,
      response: { 201: choiceSchema },
    },
    preHandler,
    handler: async (request, reply) => {
      const { scene, story } = await choicesService.loadOwnedScene(request.params.sceneId, request.user.sub);
      assertEditable(story);
      const choice = await choicesService.create(scene, request.body);
      reply.code(201);
      return choice;
    },
  });

  app.route({
    method: 'PATCH',
    url: '/me/choices/:choiceId',
    schema: {
      tags: ['creator'],
      security: [{ bearerAuth: [] }],
      params: choiceIdParamSchema,
      body: updateChoiceBodySchema,
      response: { 200: choiceSchema },
    },
    preHandler,
    handler: async (request) => {
      const { choice, story } = await choicesService.loadOwned(request.params.choiceId, request.user.sub);
      assertEditable(story);
      return choicesService.update(choice, story, request.body);
    },
  });

  app.route({
    method: 'DELETE',
    url: '/me/choices/:choiceId',
    schema: {
      tags: ['creator'],
      security: [{ bearerAuth: [] }],
      params: choiceIdParamSchema,
      response: { 204: z.null().describe('Sans contenu') },
    },
    preHandler,
    handler: async (request, reply) => {
      const { choice, story } = await choicesService.loadOwned(request.params.choiceId, request.user.sub);
      assertEditable(story);
      await choicesService.remove(choice);
      reply.code(204).send(null);
    },
  });
}
