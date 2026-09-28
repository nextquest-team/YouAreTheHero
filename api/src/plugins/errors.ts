import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod';
import { HttpError, notFound } from '../lib/errors.js';

/**
 * Centralise la forme des erreurs HTTP : { error: { code, message, ...extra } }.
 * `fp` retire l'encapsulation pour que ce handler s'applique à toute l'app,
 * quel que soit l'ordre d'enregistrement des autres plugins/modules.
 */
export default fp(async function errorsPlugin(app: FastifyInstance) {
  app.setNotFoundHandler((request, reply) => {
    const error = notFound(`Route ${request.method} ${request.url} introuvable`);
    reply.code(error.statusCode).send({
      error: { code: error.code, message: error.message },
    });
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof HttpError) {
      reply.code(error.statusCode).send({
        error: { code: error.code, message: error.message, ...error.extra },
      });
      return;
    }

    if (hasZodFastifySchemaValidationErrors(error)) {
      reply.code(422).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Erreur de validation',
          issues: error.validation.map((issue) => ({
            path: issue.instancePath,
            message: issue.message,
          })),
        },
      });
      return;
    }

    request.log.error(error);
    reply.code(500).send({
      error: { code: 'INTERNAL_ERROR', message: 'Une erreur interne est survenue' },
    });
  });
});
