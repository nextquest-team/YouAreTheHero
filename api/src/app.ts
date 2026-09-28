import { mkdir } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import cors from '@fastify/cors';
import staticPlugin from '@fastify/static';
import fastify, { type FastifyBaseLogger, type FastifyInstance, type RawServerDefault } from 'fastify';
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from 'fastify-type-provider-zod';
import { env } from './config/env.js';
import authRoutes from './modules/auth/routes.js';
import creatorStoriesRoutes from './modules/creator/stories/routes.js';
import authPlugin from './plugins/auth.js';
import errorsPlugin from './plugins/errors.js';
import swaggerPlugin from './plugins/swagger.js';

// Type partagé par tous les modules de routes : export default async function routes(app: App) { ... }
export type App = FastifyInstance<RawServerDefault, IncomingMessage, ServerResponse, FastifyBaseLogger, ZodTypeProvider>;

export async function buildApp(opts: { logger?: boolean } = {}): Promise<App> {
  const app = fastify({
    logger: opts.logger ?? true,
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await mkdir(env.UPLOADS_DIR, { recursive: true });

  await app.register(cors);
  await app.register(staticPlugin, { root: env.UPLOADS_DIR, prefix: '/uploads/' });
  await app.register(swaggerPlugin);
  await app.register(errorsPlugin);
  await app.register(authPlugin);
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(creatorStoriesRoutes);

  app.get('/health', async () => ({ status: 'ok' as const }));

  return app;
}
