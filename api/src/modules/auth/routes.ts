import type { App } from '../../app.js';
import { unauthorized } from '../../lib/errors.js';
import * as authService from './service.js';
import { authResponseSchema, loginBodySchema, patchMeBodySchema, registerBodySchema, userPublicSchema } from './schemas.js';

export default async function routes(app: App) {
  app.route({
    method: 'POST',
    url: '/register',
    schema: {
      tags: ['auth'],
      body: registerBodySchema,
      response: { 201: authResponseSchema },
    },
    handler: async (request, reply) => {
      const user = await authService.register(request.body);
      const token = await reply.jwtSign({ sub: user.id, role: user.role });
      reply.code(201);
      return { token, user };
    },
  });

  app.route({
    method: 'POST',
    url: '/login',
    schema: {
      tags: ['auth'],
      body: loginBodySchema,
      response: { 200: authResponseSchema },
    },
    handler: async (request, reply) => {
      const user = await authService.login(request.body);
      const token = await reply.jwtSign({ sub: user.id, role: user.role });
      return { token, user };
    },
  });

  app.route({
    method: 'GET',
    url: '/me',
    schema: {
      tags: ['auth'],
      security: [{ bearerAuth: [] }],
      response: { 200: userPublicSchema },
    },
    preHandler: [app.authenticate],
    handler: async (request) => {
      const user = await authService.getPublicUser(request.user.sub);
      if (!user) {
        throw unauthorized();
      }
      return user;
    },
  });

  app.route({
    method: 'PATCH',
    url: '/me',
    schema: {
      tags: ['auth'],
      security: [{ bearerAuth: [] }],
      body: patchMeBodySchema,
      response: { 200: userPublicSchema },
    },
    preHandler: [app.authenticate],
    handler: async (request) => authService.updateMe(request.user.sub, request.body),
  });
}
