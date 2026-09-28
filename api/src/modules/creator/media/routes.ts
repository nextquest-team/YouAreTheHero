import { z } from 'zod';
import type { App } from '../../../app.js';
import { saveUploadedImage } from '../../../lib/uploads.js';
import { mediaIdParamSchema, mediaSchema } from './schemas.js';
import * as mediaService from './service.js';

// Médiathèque : images du créateur, communes à toutes ses histoires.
export default async function routes(app: App) {
  const preHandler = [app.authenticate, app.requireRole('CREATOR')];

  app.route({
    method: 'GET',
    url: '/me/media',
    schema: {
      tags: ['creator'],
      security: [{ bearerAuth: [] }],
      response: { 200: mediaSchema.array() },
    },
    preHandler,
    handler: async (request) => mediaService.listMine(request.user.sub),
  });

  app.route({
    method: 'POST',
    url: '/me/media',
    schema: {
      tags: ['creator'],
      security: [{ bearerAuth: [] }],
      consumes: ['multipart/form-data'],
      response: { 201: mediaSchema },
    },
    preHandler,
    handler: async (request, reply) => {
      const url = await saveUploadedImage(request);
      const created = await mediaService.create(request.user.sub, url);
      reply.code(201);
      return created;
    },
  });

  app.route({
    method: 'DELETE',
    url: '/me/media/:mediaId',
    schema: {
      tags: ['creator'],
      security: [{ bearerAuth: [] }],
      params: mediaIdParamSchema,
      response: { 204: z.null().describe('Sans contenu') },
    },
    preHandler,
    handler: async (request, reply) => {
      const row = await mediaService.assertMediaOwner(request.params.mediaId, request.user.sub);
      await mediaService.remove(row);
      reply.code(204).send(null);
    },
  });
}
