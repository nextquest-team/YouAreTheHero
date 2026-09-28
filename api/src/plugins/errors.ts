import { DrizzleQueryError } from 'drizzle-orm';
import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod';
import { HttpError, notFound } from '../lib/errors.js';

/** Forme unique de toute réponse d'erreur : { error: { code, message, ...extra } }. */
function sendError(
  reply: FastifyReply,
  statusCode: number,
  code: string,
  message: string,
  extra?: Record<string, unknown>,
): void {
  reply.code(statusCode).send({ error: { code, message, ...extra } });
}

/** Erreur Fastify native déjà qualifiée côté client (JSON malformé, Content-Type refusé, payload trop gros...). */
function isFastifyClientError(error: unknown): error is FastifyError {
  return (
    error instanceof Error &&
    typeof (error as FastifyError).statusCode === 'number' &&
    (error as FastifyError).statusCode! >= 400 &&
    (error as FastifyError).statusCode! < 500
  );
}

/**
 * Journalise une erreur 500 sans exposer de données sensibles : une DrizzleQueryError embarque
 * la requête SQL et ses paramètres (potentiellement un email ou un hash) dans son message, donc
 * on ne garde que le code Postgres de sa cause. La stack n'est journalisée qu'hors production.
 */
function logServerError(request: FastifyRequest, error: unknown): void {
  if (!(error instanceof Error)) {
    request.log.error({ value: String(error) });
    return;
  }
  if (error instanceof DrizzleQueryError) {
    const cause = error.cause as { code?: string } | undefined;
    request.log.error({ name: error.name, code: cause?.code });
  } else {
    request.log.error({ name: error.name, message: error.message });
  }
  if (process.env.NODE_ENV !== 'production' && error.stack) {
    request.log.error(error.stack);
  }
}

/**
 * Centralise la forme des erreurs HTTP : { error: { code, message, ...extra } }.
 * `fp` retire l'encapsulation pour que ce handler s'applique à toute l'app,
 * quel que soit l'ordre d'enregistrement des autres plugins/modules.
 */
export default fp(async function errorsPlugin(app: FastifyInstance) {
  app.setNotFoundHandler((request, reply) => {
    const error = notFound(`Route ${request.method} ${request.url} introuvable`);
    sendError(reply, error.statusCode, error.code, error.message);
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof HttpError) {
      sendError(reply, error.statusCode, error.code, error.message, error.extra);
      return;
    }

    if (hasZodFastifySchemaValidationErrors(error)) {
      sendError(reply, 422, 'VALIDATION_ERROR', 'Erreur de validation', {
        issues: error.validation.map((issue) => ({
          path: issue.instancePath,
          message: issue.message,
        })),
      });
      return;
    }

    // Erreur Fastify native déjà qualifiée (< 500) : on garde son statut et son code
    // plutôt que de l'aplatir en 500, et on ne la journalise pas comme une erreur serveur.
    if (isFastifyClientError(error)) {
      sendError(reply, error.statusCode!, error.code || 'BAD_REQUEST', error.message);
      return;
    }

    logServerError(request, error);
    sendError(reply, 500, 'INTERNAL_ERROR', 'Une erreur interne est survenue');
  });
});
