import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp, type App } from '../src/app.js';
import { db } from '../src/db/index.js';
import { users } from '../src/db/schema/index.js';
import { resetDb } from './helpers/db.js';
import { createUser } from './helpers/auth.js';

describe('plugin auth et routes /auth', () => {
  let app: App;

  beforeAll(async () => {
    app = await buildApp({ logger: false });

    // Route de test pour requireRole : n'existe pas dans le code applicatif.
    app.get(
      '/test/creator-only',
      { preHandler: [app.authenticate, app.requireRole('CREATOR')] },
      async () => ({ ok: true }),
    );

    await app.ready();
  });

  beforeEach(async () => {
    await resetDb();
  });

  it('POST /auth/register répond 201 avec un token et le rôle demandé', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'nouveau@demo.fr', password: 'password123', displayName: 'Nouveau', role: 'PLAYER' },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(typeof body.token).toBe('string');
    expect(body.user.role).toBe('PLAYER');
    expect(body.user.email).toBe('nouveau@demo.fr');
  });

  it('la casse de l’email est ignorée à l’inscription comme à la connexion', async () => {
    const registerResponse = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'Jean@Demo.fr', password: 'password123', displayName: 'Jean', role: 'PLAYER' },
    });
    expect(registerResponse.statusCode).toBe(201);

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'jean@demo.fr', password: 'password123' },
    });

    expect(loginResponse.statusCode).toBe(200);
    expect(loginResponse.json().user.email).toBe('jean@demo.fr');
  });

  it('réinscrire le même email (casse différente) répond 409 EMAIL_TAKEN', async () => {
    await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'jean@demo.fr', password: 'password123', displayName: 'Jean', role: 'PLAYER' },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'Jean@Demo.fr', password: 'password123', displayName: 'Jean 2', role: 'PLAYER' },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().error.code).toBe('EMAIL_TAKEN');
  });

  it('deux inscriptions concurrentes sur le même email : une seule réussit, l’autre répond 409 EMAIL_TAKEN (jamais 500)', async () => {
    const payload = { email: 'course@demo.fr', password: 'password123', displayName: 'Course', role: 'PLAYER' };

    const [first, second] = await Promise.all([
      app.inject({ method: 'POST', url: '/auth/register', payload }),
      app.inject({ method: 'POST', url: '/auth/register', payload }),
    ]);

    expect([first.statusCode, second.statusCode].sort()).toEqual([201, 409]);

    const loser = first.statusCode === 409 ? first : second;
    expect(loser.json().error.code).toBe('EMAIL_TAKEN');
  });

  it('un mauvais mot de passe répond 401 INVALID_CREDENTIALS', async () => {
    await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'jean@demo.fr', password: 'password123', displayName: 'Jean', role: 'PLAYER' },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'jean@demo.fr', password: 'mauvais-mot-de-passe' },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().error.code).toBe('INVALID_CREDENTIALS');
  });

  it('un email inconnu répond la même erreur 401 INVALID_CREDENTIALS qu’un mauvais mot de passe', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'personne@demo.fr', password: 'password123' },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().error.code).toBe('INVALID_CREDENTIALS');
  });

  it('GET /auth/me sans token répond 401 UNAUTHORIZED', async () => {
    const response = await app.inject({ method: 'GET', url: '/auth/me' });

    expect(response.statusCode).toBe(401);
    expect(response.json().error.code).toBe('UNAUTHORIZED');
  });

  it('GET /auth/me avec un token valide répond 200 sans jamais exposer passwordHash', async () => {
    const { token, user } = await createUser(app, { role: 'PLAYER' });

    const response = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.id).toBe(user.id);
    expect(body.passwordHash).toBeUndefined();
  });

  it('le token d’un utilisateur supprimé en base répond 401 UNAUTHORIZED', async () => {
    const { token, user } = await createUser(app, { role: 'PLAYER' });

    await db.delete(users).where(eq(users.id, user.id));

    const response = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().error.code).toBe('UNAUTHORIZED');
  });

  it('PATCH /auth/me avec un avatarUrl hors /uploads/ répond 422', async () => {
    const { token } = await createUser(app, { role: 'PLAYER' });

    const response = await app.inject({
      method: 'PATCH',
      url: '/auth/me',
      headers: { authorization: `Bearer ${token}` },
      payload: { avatarUrl: 'http://x' },
    });

    expect(response.statusCode).toBe(422);
  });

  it('PATCH /auth/me avec un avatarUrl contenant .. répond 422', async () => {
    const { token } = await createUser(app, { role: 'PLAYER' });

    const response = await app.inject({
      method: 'PATCH',
      url: '/auth/me',
      headers: { authorization: `Bearer ${token}` },
      payload: { avatarUrl: '/uploads/../secret' },
    });

    expect(response.statusCode).toBe(422);
  });

  it('PATCH /auth/me met à jour displayName et avatarUrl', async () => {
    const { token } = await createUser(app, { role: 'PLAYER' });

    const response = await app.inject({
      method: 'PATCH',
      url: '/auth/me',
      headers: { authorization: `Bearer ${token}` },
      payload: { displayName: 'Nouveau nom', avatarUrl: '/uploads/avatar.jpg' },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.displayName).toBe('Nouveau nom');
    expect(body.avatarUrl).toBe('/uploads/avatar.jpg');
  });

  it('PATCH /auth/me { avatarUrl: null } efface un avatar déjà posé', async () => {
    const { token } = await createUser(app, { role: 'PLAYER' });

    await app.inject({
      method: 'PATCH',
      url: '/auth/me',
      headers: { authorization: `Bearer ${token}` },
      payload: { avatarUrl: '/uploads/avatar.jpg' },
    });

    const response = await app.inject({
      method: 'PATCH',
      url: '/auth/me',
      headers: { authorization: `Bearer ${token}` },
      payload: { avatarUrl: null },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().avatarUrl).toBeNull();
  });

  it('requireRole(CREATOR) appelé par un PLAYER répond 403 FORBIDDEN', async () => {
    const { token } = await createUser(app, { role: 'PLAYER' });

    const response = await app.inject({
      method: 'GET',
      url: '/test/creator-only',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe('FORBIDDEN');
  });

  it('requireRole(CREATOR) appelé par un CREATOR répond 200', async () => {
    const { token } = await createUser(app, { role: 'CREATOR' });

    const response = await app.inject({
      method: 'GET',
      url: '/test/creator-only',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
  });
});
