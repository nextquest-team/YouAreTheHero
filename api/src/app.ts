import { mkdir } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import staticPlugin from '@fastify/static';
import fastify, { type FastifyBaseLogger, type FastifyInstance, type RawServerDefault } from 'fastify';
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from 'fastify-type-provider-zod';
import { env } from './config/env.js';
import { MAX_UPLOAD_BYTES } from './lib/uploads.js';
import authRoutes from './modules/auth/routes.js';
import catalogRoutes from './modules/catalog/routes.js';
import creatorMediaRoutes from './modules/creator/media/routes.js';
import creatorStoriesRoutes from './modules/creator/stories/routes.js';
import playRoutes from './modules/play/routes.js';
import uploadsRoutes from './modules/uploads/routes.js';
import authPlugin from './plugins/auth.js';
import errorsPlugin from './plugins/errors.js';
import swaggerPlugin from './plugins/swagger.js';

// Type partagé par tous les modules de routes : export default async function routes(app: App) { ... }
export type App = FastifyInstance<RawServerDefault, IncomingMessage, ServerResponse, FastifyBaseLogger, ZodTypeProvider>;

declare module 'fastify' {
  interface FastifyInstance {
    /** Un jet de dé à 6 faces (1 à 6), utilisé par le combat (voir engine/combat.ts). Remplaçable
     * pour des tests reproductibles via `buildApp({ roll })`. */
    roll: () => number;
  }
}

function rollD6(): number {
  return Math.floor(Math.random() * 6) + 1;
}

export async function buildApp(opts: { logger?: boolean; roll?: () => number } = {}): Promise<App> {
  const app = fastify({
    logger: opts.logger ?? true,
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.decorate('roll', opts.roll ?? rollD6);

  await mkdir(env.UPLOADS_DIR, { recursive: true });

  await app.register(cors);
  await app.register(staticPlugin, { root: env.UPLOADS_DIR, prefix: '/uploads/' });
  await app.register(swaggerPlugin);
  await app.register(errorsPlugin);
  await app.register(authPlugin);
  await app.register(multipart, { limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 } });
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(uploadsRoutes);
  await app.register(creatorStoriesRoutes);
  await app.register(creatorMediaRoutes);
  await app.register(catalogRoutes);
  await app.register(playRoutes);

  app.get('/health', async () => ({ status: 'ok' as const }));

  return app;
}
