import { beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { buildApp, type App } from '../src/app.js';
import { conflict } from '../src/lib/errors.js';

describe('squelette Fastify', () => {
  let app: App;

  beforeAll(async () => {
    app = await buildApp({ logger: false });

    // Routes de test pour vérifier le plugin d'erreurs sans dépendre d'un module métier.
    app.get('/test/conflict', async () => {
      throw conflict('X', 'm', { usedIn: ['a'] });
    });

    app.route({
      method: 'POST',
      url: '/test/validate',
      schema: { body: z.object({ n: z.number() }) },
      handler: async (request) => ({ n: request.body.n }),
    });

    await app.ready();
  });

  it('GET /health répond 200 { status: "ok" }', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });

  it('GET /nope répond 404 NOT_FOUND', async () => {
    const response = await app.inject({ method: 'GET', url: '/nope' });

    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe('NOT_FOUND');
  });

  it('GET /docs/json expose le schéma OpenAPI', async () => {
    const response = await app.inject({ method: 'GET', url: '/docs/json' });

    expect(response.statusCode).toBe(200);
    expect(response.json().openapi).toBeDefined();
  });

  it('une HttpError conflict répond 409 avec le code et les extras', async () => {
    const response = await app.inject({ method: 'GET', url: '/test/conflict' });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({
      error: { code: 'X', message: 'm', usedIn: ['a'] },
    });
  });

  it('un body invalide selon le schéma Zod répond 422 VALIDATION_ERROR', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/test/validate',
      payload: { n: 'a' },
    });

    expect(response.statusCode).toBe(422);
    expect(response.json().error.code).toBe('VALIDATION_ERROR');
  });

  it('un JSON malformé répond 400 avec le code natif Fastify, pas 500', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/test/validate',
      headers: { 'content-type': 'application/json' },
      payload: '{"n":',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBeDefined();
    expect(response.json().error.message).toBeDefined();
  });
});
