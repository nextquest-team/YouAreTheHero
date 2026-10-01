import { z } from 'zod';
import type { App } from '../../../app.js';
import { assertEditable, assertOwner } from '../ownership.js';
import * as storiesService from './service.js';
import {
  createStoryBodySchema,
  idParamSchema,
  publishResultSchema,
  storyFullSchema,
  storySchema,
  updateStoryBodySchema,
} from './schemas.js';

// Module d'exemple : toutes les routes /me/stories sont réservées au créateur propriétaire.
// A recopiera cette structure (routes minces, service avec la logique, schémas séparés) pour
// stats, ennemis, objets, scènes et choix.
export default async function routes(app: App) {
  const preHandler = [app.authenticate, app.requireRole('CREATOR')];

  app.route({
    method: 'GET',
    url: '/me/stories',
    schema: {
      tags: ['creator'],
      security: [{ bearerAuth: [] }],
      response: { 200: storySchema.array() },
    },
    preHandler,
    handler: async (request) => storiesService.listMine(request.user.sub),
  });

  app.route({
    method: 'POST',
    url: '/me/stories',
    schema: {
      tags: ['creator'],
      security: [{ bearerAuth: [] }],
      body: createStoryBodySchema,
      response: { 201: storySchema },
    },
    preHandler,
    handler: async (request, reply) => {
      const story = await storiesService.create(request.user.sub, request.body);
      reply.code(201);
      return story;
    },
  });

  app.route({
    method: 'GET',
    url: '/me/stories/:id',
    schema: {
      tags: ['creator'],
      security: [{ bearerAuth: [] }],
      params: idParamSchema,
      response: { 200: storyFullSchema },
    },
    preHandler,
    handler: async (request) => {
      const story = await assertOwner(request.params.id, request.user.sub);
      return storiesService.getFull(story);
    },
  });

  app.route({
    method: 'PATCH',
    url: '/me/stories/:id',
    schema: {
      tags: ['creator'],
      security: [{ bearerAuth: [] }],
      params: idParamSchema,
      body: updateStoryBodySchema,
      response: { 200: storySchema },
    },
    preHandler,
    handler: async (request) => {
      const story = await assertOwner(request.params.id, request.user.sub);
      assertEditable(story);
      return storiesService.update(story, request.body);
    },
  });

  app.route({
    method: 'DELETE',
    url: '/me/stories/:id',
    schema: {
      tags: ['creator'],
      security: [{ bearerAuth: [] }],
      params: idParamSchema,
      response: { 204: z.null().describe('Sans contenu') },
    },
    preHandler,
    handler: async (request, reply) => {
      const story = await assertOwner(request.params.id, request.user.sub);
      assertEditable(story);
      await storiesService.remove(story.id);
      reply.code(204).send(null);
    },
  });

  app.route({
    method: 'POST',
    url: '/me/stories/:id/publish',
    schema: {
      tags: ['creator'],
      security: [{ bearerAuth: [] }],
      params: idParamSchema,
      response: { 200: publishResultSchema },
    },
    preHandler,
    handler: async (request) => {
      const story = await assertOwner(request.params.id, request.user.sub);
      return storiesService.publish(story);
    },
  });

  app.route({
    method: 'POST',
    url: '/me/stories/:id/unpublish',
    schema: {
      tags: ['creator'],
      security: [{ bearerAuth: [] }],
      params: idParamSchema,
      response: { 200: storySchema },
    },
    preHandler,
    handler: async (request) => {
      const story = await assertOwner(request.params.id, request.user.sub);
      return storiesService.unpublish(story);
    },
  });
}
