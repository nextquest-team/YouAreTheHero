import { z } from 'zod';
import type { App } from '../../app.js';
import { saveUploadedImage } from '../../lib/uploads.js';

// Upload générique, ouvert à tout utilisateur connecté (selfie du joueur, avatar...).
// Les images du créateur passent plutôt par /me/media pour apparaître dans sa médiathèque.
export default async function routes(app: App) {
  app.route({
    method: 'POST',
    url: '/uploads',
    schema: {
      tags: ['uploads'],
      security: [{ bearerAuth: [] }],
      consumes: ['multipart/form-data'],
      response: { 201: z.object({ url: z.string() }) },
    },
    preHandler: [app.authenticate],
    handler: async (request, reply) => {
      const url = await saveUploadedImage(request);
      reply.code(201);
      return { url };
    },
  });
}
