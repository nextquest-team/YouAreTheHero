import { and, eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp, type App } from '../src/app.js';
import { db } from '../src/db/index.js';
import { reviews, saves, stories } from '../src/db/schema/index.js';
import { runSeed } from '../src/db/seed.js';
import { createUser } from './helpers/auth.js';

type Player = { token: string; user: { id: string } };

describe('module avis', () => {
  let app: App;
  let storyId: string;
  let draftId: string;
  let player: Player;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
    await app.ready();
  });

  beforeEach(async () => {
    await runSeed();
    [{ id: storyId }] = await db.select({ id: stories.id }).from(stories).where(eq(stories.published, true)).limit(1);
    [{ id: draftId }] = await db.select({ id: stories.id }).from(stories).where(eq(stories.published, false)).limit(1);
    player = await createUser(app, { role: 'PLAYER' });
  });

  const auth = (p: Player) => ({ authorization: `Bearer ${p.token}` });
  const list = (p: Player, id = storyId) => app.inject({ method: 'GET', url: `/stories/${id}/reviews`, headers: auth(p) });
  const post = (p: Player, payload: unknown, id = storyId) =>
    app.inject({ method: 'POST', url: `/stories/${id}/reviews`, headers: auth(p), payload: payload as object });

  /** Démarre la partie du joueur puis la passe au statut voulu. */
  async function play(p: Player, status: 'IN_PROGRESS' | 'FINISHED' | 'DEAD') {
    const start = await app.inject({ method: 'POST', url: `/play/${storyId}/start`, headers: auth(p), payload: {} });
    expect(start.statusCode).toBe(200);
    await db.update(saves).set({ status }).where(and(eq(saves.userId, p.user.id), eq(saves.storyId, storyId)));
  }

  async function finishedPlayer(): Promise<Player> {
    const p = await createUser(app, { role: 'PLAYER' });
    await play(p, 'FINISHED');
    return p;
  }

  it('une histoire sans avis donne une liste vide et canReview à false', async () => {
    const response = await list(player);

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ avgRating: null, count: 0, mine: null, canReview: false, reviews: [] });
  });

  it.each(['IN_PROGRESS', 'DEAD'] as const)('refuse un avis avec une partie %s (403 STORY_NOT_FINISHED)', async (status) => {
    await play(player, status);

    const response = await post(player, { rating: 4 });

    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe('STORY_NOT_FINISHED');
    expect((await list(player)).json().canReview).toBe(false);
  });

  it('refuse un avis sans aucune partie', async () => {
    const response = await post(player, { rating: 4 });

    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe('STORY_NOT_FINISHED');
  });

  it('crée l’avis (201) après une partie terminée, et la liste le renvoie', async () => {
    const p = await finishedPlayer();

    const created = await post(p, { rating: 5, comment: '  Superbe fin  ' });

    expect(created.statusCode).toBe(201);
    expect(created.json()).toMatchObject({ rating: 5, comment: 'Superbe fin', author: { id: p.user.id } });

    const body = (await list(p)).json();
    expect(body.canReview).toBe(true);
    expect(body.count).toBe(1);
    expect(body.avgRating).toBe(5);
    expect(body.mine.id).toBe(created.json().id);
    expect(body.reviews).toHaveLength(1);
    expect(body.reviews[0].author.displayName).toBeTruthy();
  });

  it('un second POST remplace l’avis (200) sans en créer un deuxième', async () => {
    const p = await finishedPlayer();
    const first = await post(p, { rating: 2, comment: 'Moyen' });

    const second = await post(p, { rating: 4 });

    expect(second.statusCode).toBe(200);
    expect(second.json().id).toBe(first.json().id);
    expect(second.json()).toMatchObject({ rating: 4, comment: null });
    expect(await db.select().from(reviews).where(eq(reviews.storyId, storyId))).toHaveLength(1);
  });

  it('calcule la moyenne, la reflète dans le catalogue, et trie du plus récent au plus ancien', async () => {
    const a = await finishedPlayer();
    const b = await finishedPlayer();
    await post(a, { rating: 5 });
    await post(b, { rating: 2 });

    const body = (await list(player)).json();

    expect(body.count).toBe(2);
    expect(body.avgRating).toBe(3.5);
    expect(body.mine).toBeNull();
    expect(body.reviews.map((r: { rating: number }) => r.rating)).toEqual([2, 5]);

    const catalog = await app.inject({ method: 'GET', url: '/stories', headers: auth(player) });
    expect(catalog.json().find((s: { id: string }) => s.id === storyId).avgRating).toBe(3.5);
  });

  it.each([{ rating: 0 }, { rating: 6 }, { rating: 3.5 }, { rating: '4' }, {}, { rating: 4, comment: 'x'.repeat(1001) }])(
    'répond 422 pour un corps invalide %j',
    async (payload) => {
      const p = await finishedPlayer();

      expect((await post(p, payload)).statusCode).toBe(422);
    },
  );

  it('accepte un commentaire de 1000 caractères et traite un commentaire blanc comme absent', async () => {
    const p = await finishedPlayer();

    expect((await post(p, { rating: 3, comment: 'x'.repeat(1000) })).statusCode).toBe(201);
    expect((await post(p, { rating: 3, comment: '   ' })).json().comment).toBeNull();
  });

  it('répond 404 pour une histoire inconnue ou non publiée', async () => {
    expect((await list(player, draftId)).statusCode).toBe(404);
    expect((await post(player, { rating: 4 }, draftId)).statusCode).toBe(404);
    expect((await list(player, '00000000-0000-4000-8000-000000000000')).statusCode).toBe(404);
  });

  it('refuse un créateur (403) et un appel sans token (401)', async () => {
    const creator = await createUser(app, { role: 'CREATOR' });

    expect((await list(creator)).statusCode).toBe(403);
    expect((await post(creator, { rating: 4 })).statusCode).toBe(403);
    expect((await app.inject({ method: 'GET', url: `/stories/${storyId}/reviews` })).statusCode).toBe(401);
  });

  it('les avis disparaissent avec leur histoire', async () => {
    const p = await finishedPlayer();
    await post(p, { rating: 4 });

    await db.delete(stories).where(eq(stories.id, storyId));

    expect(await db.select().from(reviews).where(eq(reviews.storyId, storyId))).toEqual([]);
  });
});
