import fastifyJwt from '@fastify/jwt';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { env } from '../config/env.js';
import { forbidden, unauthorized } from '../lib/errors.js';
import type { Role } from '../modules/auth/schemas.js';
import { userExists } from '../modules/auth/service.js';

// Augmentation de module : le payload signé et `request.user` partagent la même forme,
// le rôle ne changeant jamais on peut le lire directement depuis le token.
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; role: Role };
    user: { sub: string; role: Role };
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireRole: (role: Role) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

/**
 * Décore l'app avec `authenticate` et `requireRole`. Enregistré via `fastify-plugin`
 * pour que ces décorateurs restent visibles dans toute l'app quel que soit l'ordre
 * d'enregistrement des modules de routes.
 */
export default fp(async function authPlugin(app: FastifyInstance) {
  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: '7d' },
  });

  app.decorate('authenticate', async (request: FastifyRequest) => {
    try {
      await request.jwtVerify();
    } catch {
      throw unauthorized();
    }

    // Le rôle vient du token (il ne change jamais) ; seule l'existence de l'utilisateur est vérifiée en base.
    if (!(await userExists(request.user.sub))) {
      throw unauthorized();
    }
  });

  app.decorate('requireRole', (role: Role) => {
    return async (request: FastifyRequest) => {
      if (request.user.role !== role) {
        throw forbidden();
      }
    };
  });
});
