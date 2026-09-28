import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp, type App } from '../src/app.js';
import { db } from '../src/db/index.js';
import { stories } from '../src/db/schema/index.js';
import { runSeed } from '../src/db/seed.js';
import { createUser } from './helpers/auth.js';

describe('module catalogue (/stories)', () => {
  let app: App;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
    await app.ready();
  });

  beforeEach(async () => {
    await runSeed();
  });

  async function playerToken(): Promise<string> {
    const { token } = await createUser(app, { role: 'PLAYER' });
    return token;
  }

  it('le joueur voit uniquement les histoires publiées', async () => {
    const token = await playerToken();

    const response = await app.inject({ method: 'GET', url: '/stories', headers: { authorization: `Bearer ${token}` } });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toHaveLength(1);
    expect(body[0].title).toBe('La Crypte du Roi Oublié');
    expect(body[0].author.displayName).toBe('Auteur Démo');
    expect(body[0].avgRating).toBeNull();
    expect(body[0].isFavorite).toBe(false);
  });

  it('q recherche un mot du résumé, insensible à la casse', async () => {
    const token = await playerToken();

    const response = await app.inject({
      method: 'GET',
      url: '/stories?q=GOULE',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveLength(1);

    const miss = await app.inject({
      method: 'GET',
      url: '/stories?q=inexistant',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(miss.json()).toHaveLength(0);
  });

  it('genre filtre en ignorant la casse', async () => {
    const token = await playerToken();

    const response = await app.inject({
      method: 'GET',
      url: '/stories?genre=fantasy',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveLength(1);

    const miss = await app.inject({
      method: 'GET',
      url: '/stories?genre=horreur',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(miss.json()).toHaveLength(0);
  });

  it('GET /stories/:id sur un brouillon répond 404', async () => {
    const token = await playerToken();
    const [draft] = await db.select().from(stories).where(eq(stories.published, false));

    const response = await app.inject({
      method: 'GET',
      url: `/stories/${draft.id}`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(404);
  });

  it('GET /stories/:id sur une histoire publiée renvoie les stats triées et mySave à null', async () => {
    const token = await playerToken();
    const [published] = await db.select().from(stories).where(eq(stories.published, true));

    const response = await app.inject({
      method: 'GET',
      url: `/stories/${published.id}`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.stats.map((s: { name: string }) => s.name)).toEqual(['Nom', 'Force', 'PV']);
    expect(body.mySave).toBeNull();
  });

  it('GET /stories répond 403 FORBIDDEN pour un CREATOR', async () => {
    const { token } = await createUser(app, { role: 'CREATOR' });

    const response = await app.inject({ method: 'GET', url: '/stories', headers: { authorization: `Bearer ${token}` } });

    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe('FORBIDDEN');
  });

  it('mySave reflète la partie en cours après un start', async () => {
    const token = await playerToken();
    const [published] = await db.select().from(stories).where(eq(stories.published, true));

    await app.inject({
      method: 'POST',
      url: `/play/${published.id}/start`,
      headers: { authorization: `Bearer ${token}` },
      payload: {},
    });

    const response = await app.inject({
      method: 'GET',
      url: `/stories/${published.id}`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().mySave).toMatchObject({ status: 'IN_PROGRESS' });
    expect(response.json().mySave.updatedAt).toEqual(expect.any(String));
  });

  it('GET /stories/genres renvoie les genres distincts des histoires publiées, triés', async () => {
    const token = await playerToken();

    const response = await app.inject({ method: 'GET', url: '/stories/genres', headers: { authorization: `Bearer ${token}` } });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(['Fantasy']);
  });
});
