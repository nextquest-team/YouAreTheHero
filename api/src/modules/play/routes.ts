import { z } from 'zod';
import type { App } from '../../app.js';
import * as playService from './service.js';
import { chooseBodySchema, gameStateSchema, saveSummarySchema, startBodySchema, storyIdParamSchema } from './schemas.js';

// Moteur de jeu, réservé aux PLAYER (voir docs/conception.md sections 4 et 7).
export default async function routes(app: App) {
  const preHandler = [app.authenticate, app.requireRole('PLAYER')];

  app.route({
    method: 'GET',
    url: '/me/saves',
    schema: {
      tags: ['play'],
      security: [{ bearerAuth: [] }],
      response: { 200: saveSummarySchema.array() },
    },
    preHandler,
    handler: async (request) => playService.listMySaves(request.user.sub),
  });

  app.route({
    method: 'POST',
    url: '/play/:storyId/start',
    schema: {
      tags: ['play'],
      security: [{ bearerAuth: [] }],
      params: storyIdParamSchema,
      body: startBodySchema,
      response: { 200: gameStateSchema },
    },
    preHandler,
    handler: async (request) => playService.start(request.user.sub, request.params.storyId, request.body),
  });

  app.route({
    method: 'GET',
    url: '/play/:storyId',
    schema: {
      tags: ['play'],
      security: [{ bearerAuth: [] }],
      params: storyIdParamSchema,
      response: { 200: gameStateSchema },
    },
    preHandler,
    handler: async (request) => playService.getState(request.user.sub, request.params.storyId),
  });

  app.route({
    method: 'POST',
    url: '/play/:storyId/choose',
    schema: {
      tags: ['play'],
      security: [{ bearerAuth: [] }],
      params: storyIdParamSchema,
      body: chooseBodySchema,
      response: { 200: gameStateSchema },
    },
    preHandler,
    handler: async (request) => playService.choose(request.user.sub, request.params.storyId, request.body),
  });

  app.route({
    method: 'DELETE',
    url: '/play/:storyId',
    schema: {
      tags: ['play'],
      security: [{ bearerAuth: [] }],
      params: storyIdParamSchema,
      response: { 204: z.null().describe('Sans contenu') },
    },
    preHandler,
    handler: async (request, reply) => {
      await playService.abandon(request.user.sub, request.params.storyId);
      reply.code(204).send(null);
    },
  });
}
