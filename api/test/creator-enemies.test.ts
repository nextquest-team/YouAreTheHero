import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp, type App } from '../src/app.js';
import { db } from '../src/db/index.js';
import { enemies, items, media, scenes, statDefinitions, stories } from '../src/db/schema/index.js';
import { createUser } from './helpers/auth.js';
import { resetDb } from './helpers/db.js';

const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000';

describe('module ennemis du créateur', () => {
  let app: App;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
    await app.ready();
  });

  beforeEach(async () => {
    await resetDb();
  });

  /** Créateur avec une histoire à combats en brouillon, une stat numérique, une stat texte et un objet. */
  async function setup() {
    const { token, user } = await createUser(app, { role: 'CREATOR' });
    const [story] = await db
      .insert(stories)
      .values({ authorId: user.id, title: 'Le Donjon', genre: 'Fantastique', hasCombat: true })
      .returning();
    const [gold] = await db
      .insert(statDefinitions)
      .values({ storyId: story.id, name: 'Or', type: 'number', defaultValue: '0' })
      .returning();
    const [name] = await db
      .insert(statDefinitions)
      .values({ storyId: story.id, name: 'Nom', type: 'text', defaultValue: 'Anonyme' })
      .returning();
    const [key] = await db.insert(items).values({ storyId: story.id, name: 'Clé' }).returning();
    return { token, user, story, gold, name, key };
  }

  function request(method: 'POST' | 'PATCH' | 'DELETE', url: string, token: string, payload?: Record<string, unknown>) {
    return app.inject({ method, url, headers: { authorization: `Bearer ${token}` }, payload });
  }

  async function insertEnemy(storyId: string, overrides: Partial<typeof enemies.$inferInsert> = {}) {
    const [enemy] = await db
      .insert(enemies)
      .values({ storyId, name: 'Gobelin', attack: 3, hp: 6, ...overrides })
      .returning();
    return enemy;
  }

  async function publish(storyId: string) {
    await db.update(stories).set({ published: true }).where(eq(stories.id, storyId));
  }

  describe('POST /me/stories/:id/enemies', () => {
    it('crée un ennemi complet et le place en fin de liste', async () => {
      const { token, story, gold, key } = await setup();
      const payload = {
        name: ' Troll ',
        imageUrl: '/uploads/troll.png',
        attack: 4,
        hp: 12,
        shield: 3,
        extraStats: [{ name: 'Élément', value: 'Terre' }],
        defeatEffects: [
          { type: 'stat', statId: gold.id, delta: 5 },
          { type: 'item', itemId: key.id, qty: 1 },
        ],
      };

      const first = await request('POST', `/me/stories/${story.id}/enemies`, token, payload);
      const second = await request('POST', `/me/stories/${story.id}/enemies`, token, { name: 'Rat', attack: 1, hp: 2 });

      expect(first.statusCode).toBe(201);
      expect(first.json()).toEqual({ id: expect.any(String), ...payload, name: 'Troll', sortOrder: 0 });
      expect(second.statusCode).toBe(201);
      expect(second.json()).toMatchObject({
        imageUrl: null,
        shield: 0,
        extraStats: [],
        defeatEffects: [],
        sortOrder: 1,
      });
    });

    it("l'ennemi apparaît dans GET /me/stories/:id", async () => {
      const { token, story } = await setup();
      const created = (await request('POST', `/me/stories/${story.id}/enemies`, token, { name: 'Rat', attack: 1, hp: 2 })).json();

      const response = await app.inject({
        method: 'GET',
        url: `/me/stories/${story.id}`,
        headers: { authorization: `Bearer ${token}` },
      });

      expect(response.json().enemies).toEqual([created]);
    });

    it.each([
      ['PV à 0', { hp: 0 }],
      ['attaque négative', { attack: -1 }],
      ['bouclier négatif', { shield: -2 }],
      ["chemin d'image hors /uploads", { imageUrl: 'https://exemple.fr/troll.png' }],
      ['nom vide', { name: '  ' }],
    ])('répond 422 VALIDATION_ERROR : %s', async (_label, overrides) => {
      const { token, story } = await setup();

      const response = await request('POST', `/me/stories/${story.id}/enemies`, token, {
        name: 'Troll',
        attack: 2,
        hp: 5,
        ...overrides,
      });

      expect(response.statusCode).toBe(422);
      expect(response.json().error.code).toBe('VALIDATION_ERROR');
    });

    it("répond 422 INVALID_REFERENCE pour un butin qui cite une stat d'une autre histoire", async () => {
      const { token, story, user } = await setup();
      const [otherStory] = await db
        .insert(stories)
        .values({ authorId: user.id, title: 'Autre', genre: 'Fantastique' })
        .returning();
      const [foreignStat] = await db
        .insert(statDefinitions)
        .values({ storyId: otherStory.id, name: 'Or', type: 'number', defaultValue: '0' })
        .returning();

      const response = await request('POST', `/me/stories/${story.id}/enemies`, token, {
        name: 'Troll',
        attack: 2,
        hp: 5,
        defeatEffects: [{ type: 'stat', statId: foreignStat.id, delta: 1 }],
      });

      expect(response.statusCode).toBe(422);
      expect(response.json().error).toMatchObject({ code: 'INVALID_REFERENCE', field: 'defeatEffects[0].statId' });
    });

    it('répond 422 INVALID_REFERENCE pour un butin sur une stat texte', async () => {
      const { token, story, gold, name } = await setup();

      const response = await request('POST', `/me/stories/${story.id}/enemies`, token, {
        name: 'Troll',
        attack: 2,
        hp: 5,
        defeatEffects: [
          { type: 'stat', statId: gold.id, delta: 1 },
          { type: 'stat', statId: name.id, delta: 1 },
        ],
      });

      expect(response.statusCode).toBe(422);
      expect(response.json().error).toMatchObject({ code: 'INVALID_REFERENCE', field: 'defeatEffects[1].statId' });
    });

    it('répond 422 INVALID_REFERENCE pour un butin sur un objet inconnu', async () => {
      const { token, story } = await setup();

      const response = await request('POST', `/me/stories/${story.id}/enemies`, token, {
        name: 'Troll',
        attack: 2,
        hp: 5,
        defeatEffects: [{ type: 'item', itemId: UNKNOWN_ID, qty: 1 }],
      });

      expect(response.statusCode).toBe(422);
      expect(response.json().error).toMatchObject({ code: 'INVALID_REFERENCE', field: 'defeatEffects[0].itemId' });
    });

    it("répond 403 sur l'histoire d'un autre créateur", async () => {
      const { story } = await setup();
      const { token: otherToken } = await createUser(app, { role: 'CREATOR' });

      const response = await request('POST', `/me/stories/${story.id}/enemies`, otherToken, { name: 'Rat', attack: 1, hp: 2 });

      expect(response.statusCode).toBe(403);
    });

    it('répond 403 à un joueur', async () => {
      const { story } = await setup();
      const { token: playerToken } = await createUser(app, { role: 'PLAYER' });

      const response = await request('POST', `/me/stories/${story.id}/enemies`, playerToken, { name: 'Rat', attack: 1, hp: 2 });

      expect(response.statusCode).toBe(403);
    });

    it('répond 404 pour une histoire inconnue', async () => {
      const { token } = await setup();

      const response = await request('POST', `/me/stories/${UNKNOWN_ID}/enemies`, token, { name: 'Rat', attack: 1, hp: 2 });

      expect(response.statusCode).toBe(404);
    });

    it('répond 409 STORY_PUBLISHED sur une histoire publiée', async () => {
      const { token, story } = await setup();
      await publish(story.id);

      const response = await request('POST', `/me/stories/${story.id}/enemies`, token, { name: 'Rat', attack: 1, hp: 2 });

      expect(response.statusCode).toBe(409);
      expect(response.json().error.code).toBe('STORY_PUBLISHED');
    });
  });

  describe('PATCH /me/enemies/:enemyId', () => {
    it('modifie seulement les champs envoyés', async () => {
      const { token, story, gold } = await setup();
      const enemy = await insertEnemy(story.id, { imageUrl: '/uploads/gob.png', shield: 2 });

      const response = await request('PATCH', `/me/enemies/${enemy.id}`, token, {
        hp: 9,
        defeatEffects: [{ type: 'stat', statId: gold.id, delta: 2 }],
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        name: 'Gobelin',
        imageUrl: '/uploads/gob.png',
        attack: 3,
        hp: 9,
        shield: 2,
        defeatEffects: [{ type: 'stat', statId: gold.id, delta: 2 }],
      });
    });

    it("retire l'image avec imageUrl: null", async () => {
      const { token, story } = await setup();
      const enemy = await insertEnemy(story.id, { imageUrl: '/uploads/gob.png' });

      const response = await request('PATCH', `/me/enemies/${enemy.id}`, token, { imageUrl: null });

      expect(response.statusCode).toBe(200);
      expect(response.json().imageUrl).toBeNull();
    });

    it('répond 422 INVALID_REFERENCE pour un butin invalide', async () => {
      const { token, story, name } = await setup();
      const enemy = await insertEnemy(story.id);

      const response = await request('PATCH', `/me/enemies/${enemy.id}`, token, {
        defeatEffects: [{ type: 'stat', statId: name.id, delta: 1 }],
      });

      expect(response.statusCode).toBe(422);
      expect(response.json().error).toMatchObject({ code: 'INVALID_REFERENCE', field: 'defeatEffects[0].statId' });
    });

    it('répond 404 pour un ennemi inconnu', async () => {
      const { token } = await setup();

      const response = await request('PATCH', `/me/enemies/${UNKNOWN_ID}`, token, { name: 'X' });

      expect(response.statusCode).toBe(404);
    });

    it("répond 403 sur l'ennemi d'un autre créateur", async () => {
      const { story } = await setup();
      const enemy = await insertEnemy(story.id);
      const { token: otherToken } = await createUser(app, { role: 'CREATOR' });

      const response = await request('PATCH', `/me/enemies/${enemy.id}`, otherToken, { name: 'Volé' });

      expect(response.statusCode).toBe(403);
    });

    it('répond 409 STORY_PUBLISHED sur une histoire publiée', async () => {
      const { token, story } = await setup();
      const enemy = await insertEnemy(story.id);
      await publish(story.id);

      const response = await request('PATCH', `/me/enemies/${enemy.id}`, token, { name: 'Orc' });

      expect(response.statusCode).toBe(409);
      expect(response.json().error.code).toBe('STORY_PUBLISHED');
    });
  });

  describe('DELETE /me/enemies/:enemyId', () => {
    it('supprime un ennemi qui ne sert dans aucune scène', async () => {
      const { token, story } = await setup();
      const enemy = await insertEnemy(story.id);

      const response = await request('DELETE', `/me/enemies/${enemy.id}`, token);

      expect(response.statusCode).toBe(204);
      expect(await db.select().from(enemies).where(eq(enemies.id, enemy.id))).toEqual([]);
    });

    it('répond 409 ENEMY_IN_USE avec les scènes qui le combattent', async () => {
      const { token, story } = await setup();
      const enemy = await insertEnemy(story.id);
      const [scene] = await db
        .insert(scenes)
        .values({ storyId: story.id, title: 'Embuscade', text: 'texte', enemyId: enemy.id })
        .returning();

      const response = await request('DELETE', `/me/enemies/${enemy.id}`, token);

      expect(response.statusCode).toBe(409);
      expect(response.json().error).toMatchObject({
        code: 'ENEMY_IN_USE',
        usedIn: [{ kind: 'scene', id: scene.id, storyId: story.id, label: 'Embuscade' }],
      });
      expect(await db.select().from(enemies).where(eq(enemies.id, enemy.id))).toHaveLength(1);
    });

    it("répond 403 sur l'ennemi d'un autre créateur", async () => {
      const { story } = await setup();
      const enemy = await insertEnemy(story.id);
      const { token: otherToken } = await createUser(app, { role: 'CREATOR' });

      const response = await request('DELETE', `/me/enemies/${enemy.id}`, otherToken);

      expect(response.statusCode).toBe(403);
    });

    it('répond 404 pour un ennemi inconnu', async () => {
      const { token } = await setup();

      const response = await request('DELETE', `/me/enemies/${UNKNOWN_ID}`, token);

      expect(response.statusCode).toBe(404);
    });

    it('répond 409 STORY_PUBLISHED sur une histoire publiée', async () => {
      const { token, story } = await setup();
      const enemy = await insertEnemy(story.id);
      await publish(story.id);

      const response = await request('DELETE', `/me/enemies/${enemy.id}`, token);

      expect(response.statusCode).toBe(409);
      expect(response.json().error.code).toBe('STORY_PUBLISHED');
    });
  });

  it("la médiathèque refuse de supprimer l'image d'un ennemi créé par l'API (409 IMAGE_IN_USE)", async () => {
    const { token, user, story } = await setup();
    const [image] = await db.insert(media).values({ ownerId: user.id, url: '/uploads/troll.png' }).returning();
    const enemy = (
      await request('POST', `/me/stories/${story.id}/enemies`, token, {
        name: 'Troll',
        imageUrl: '/uploads/troll.png',
        attack: 2,
        hp: 5,
      })
    ).json();

    const response = await request('DELETE', `/me/media/${image.id}`, token);

    expect(response.statusCode).toBe(409);
    expect(response.json().error).toMatchObject({
      code: 'IMAGE_IN_USE',
      usedIn: [{ kind: 'enemy', id: enemy.id, storyId: story.id, label: 'Troll' }],
    });
  });
});
