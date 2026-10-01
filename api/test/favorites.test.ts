import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp, type App } from '../src/app.js';
import { db } from '../src/db/index.js';
import { favorites, stories } from '../src/db/schema/index.js';
import { runSeed } from '../src/db/seed.js';
import { createUser } from './helpers/auth.js';

describe('module favoris', () => {
  let app: App;
  let token: string;
  let published: { id: string; title: string }[];
  let draftId: string;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
    await app.ready();
  });

  beforeEach(async () => {
    await runSeed();
    ({ token } = await createUser(app, { role: 'PLAYER' }));
    published = await db.select({ id: stories.id, title: stories.title }).from(stories).where(eq(stories.published, true));
    [{ id: draftId }] = await db.select({ id: stories.id }).from(stories).where(eq(stories.published, false)).limit(1);
  });

  const headers = () => ({ authorization: `Bearer ${token}` });
  const put = (id: string) => app.inject({ method: 'PUT', url: `/stories/${id}/favorite`, headers: headers() });
  const del = (id: string) => app.inject({ method: 'DELETE', url: `/stories/${id}/favorite`, headers: headers() });
  const mine = () => app.inject({ method: 'GET', url: '/me/favorites', headers: headers() });

  it('PUT ajoute le favori, de façon idempotente, et le catalogue le reflète', async () => {
    expect((await put(published[0].id)).statusCode).toBe(204);
    expect((await put(published[0].id)).statusCode).toBe(204);

    const catalog = await app.inject({ method: 'GET', url: '/stories', headers: headers() });
    const flags = Object.fromEntries(catalog.json().map((s: { id: string; isFavorite: boolean }) => [s.id, s.isFavorite]));
    expect(flags[published[0].id]).toBe(true);
    expect(flags[published[1].id]).toBe(false);

    const detail = await app.inject({ method: 'GET', url: `/stories/${published[0].id}`, headers: headers() });
    expect(detail.json().isFavorite).toBe(true);
  });

  it('DELETE retire le favori, de façon idempotente', async () => {
    await put(published[0].id);

    expect((await del(published[0].id)).statusCode).toBe(204);
    expect((await del(published[0].id)).statusCode).toBe(204);
    expect((await mine()).json()).toEqual([]);
  });

  it('GET /me/favorites renvoie les cartes du catalogue, le dernier ajouté en premier', async () => {
    await put(published[0].id);
    await put(published[1].id);

    const response = await mine();

    expect(response.statusCode).toBe(200);
    const body: { id: string; isFavorite: boolean; author: { displayName: string }; avgRating: number | null }[] =
      response.json();
    expect(body.map((s) => s.id)).toEqual([published[1].id, published[0].id]);
    expect(body.every((s) => s.isFavorite)).toBe(true);
    expect(body[0].author.displayName).toBeTruthy();
    expect(body[0].avgRating).toBeNull();
  });

  it('les favoris sont propres à chaque joueur', async () => {
    await put(published[0].id);
    const other = await createUser(app, { role: 'PLAYER' });

    const response = await app.inject({
      method: 'GET',
      url: '/me/favorites',
      headers: { authorization: `Bearer ${other.token}` },
    });

    expect(response.json()).toEqual([]);
  });

  it("répond 404 pour une histoire inconnue ou non publiée", async () => {
    expect((await put(draftId)).statusCode).toBe(404);
    expect((await del(draftId)).statusCode).toBe(404);
    expect((await put('00000000-0000-4000-8000-000000000000')).statusCode).toBe(404);
  });

  it('répond 422 pour un id qui n’est pas un uuid', async () => {
    expect((await put('pas-un-uuid')).statusCode).toBe(422);
  });

  it('refuse un créateur (403) et un appel sans token (401)', async () => {
    const creator = await createUser(app, { role: 'CREATOR' });
    const creatorHeaders = { authorization: `Bearer ${creator.token}` };

    const asCreator = await app.inject({ method: 'PUT', url: `/stories/${published[0].id}/favorite`, headers: creatorHeaders });
    const list = await app.inject({ method: 'GET', url: '/me/favorites', headers: creatorHeaders });
    const anonymous = await app.inject({ method: 'GET', url: '/me/favorites' });

    expect(asCreator.statusCode).toBe(403);
    expect(list.statusCode).toBe(403);
    expect(anonymous.statusCode).toBe(401);
  });

  it('un favori disparaît avec son histoire et n’apparaît plus si elle est dépubliée', async () => {
    await put(published[0].id);
    await put(published[1].id);

    await db.update(stories).set({ published: false }).where(eq(stories.id, published[0].id));
    expect((await mine()).json().map((s: { id: string }) => s.id)).toEqual([published[1].id]);

    await db.delete(stories).where(eq(stories.id, published[1].id));
    expect(await db.select().from(favorites).where(eq(favorites.storyId, published[1].id))).toEqual([]);
  });
});
