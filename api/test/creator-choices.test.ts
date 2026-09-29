import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp, type App } from '../src/app.js';
import { db } from '../src/db/index.js';
import { choices, enemies, items, scenes, statDefinitions, stories } from '../src/db/schema/index.js';
import { createUser } from './helpers/auth.js';
import { resetDb } from './helpers/db.js';

const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000';

describe('module choix du créateur', () => {
  let app: App;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
    await app.ready();
  });

  beforeEach(async () => {
    await resetDb();
  });

  /** Créateur avec une histoire en brouillon : deux scènes, deux stats (nombre et texte), un objet. */
  async function setup() {
    const { token, user } = await createUser(app, { role: 'CREATOR' });
    const [story] = await db
      .insert(stories)
      .values({ authorId: user.id, title: 'Le Donjon', genre: 'Fantastique', hasCombat: true })
      .returning();
    const [hall, cellar] = await db
      .insert(scenes)
      .values([
        { storyId: story.id, title: 'Hall', text: 'texte' },
        { storyId: story.id, title: 'Cave', text: 'texte' },
      ])
      .returning();
    const [strength] = await db
      .insert(statDefinitions)
      .values({ storyId: story.id, name: 'Force', type: 'number', defaultValue: '3' })
      .returning();
    const [name] = await db
      .insert(statDefinitions)
      .values({ storyId: story.id, name: 'Nom', type: 'text', defaultValue: 'Anonyme' })
      .returning();
    const [key] = await db.insert(items).values({ storyId: story.id, name: 'Clé' }).returning();
    return { token, user, story, hall, cellar, strength, name, key };
  }

  function request(method: 'POST' | 'PATCH' | 'DELETE', url: string, token: string, payload?: Record<string, unknown>) {
    return app.inject({ method, url, headers: { authorization: `Bearer ${token}` }, payload });
  }

  async function insertChoice(fromSceneId: string, toSceneId: string, overrides: Partial<typeof choices.$inferInsert> = {}) {
    const [choice] = await db.insert(choices).values({ fromSceneId, toSceneId, label: 'Descendre', ...overrides }).returning();
    return choice;
  }

  async function publish(storyId: string) {
    await db.update(stories).set({ published: true }).where(eq(stories.id, storyId));
  }

  describe('POST /me/scenes/:sceneId/choices', () => {
    it('crée un choix avec condition et effets, puis un choix libre en fin de liste', async () => {
      const { token, hall, cellar, strength, key } = await setup();
      const payload = {
        toSceneId: cellar.id,
        label: ' Forcer la porte ',
        condition: { type: 'stat', statId: strength.id, op: '>=', value: 5 },
        effects: [
          { type: 'stat', statId: strength.id, delta: -1 },
          { type: 'item', itemId: key.id, qty: -1 },
        ],
      };

      const first = await request('POST', `/me/scenes/${hall.id}/choices`, token, payload);
      const second = await request('POST', `/me/scenes/${hall.id}/choices`, token, { toSceneId: cellar.id, label: 'Descendre' });

      expect(first.statusCode).toBe(201);
      expect(first.json()).toEqual({ id: expect.any(String), ...payload, label: 'Forcer la porte', sortOrder: 0 });
      expect(second.statusCode).toBe(201);
      expect(second.json()).toMatchObject({ condition: null, effects: [], sortOrder: 1 });
    });

    it('le choix apparaît sous sa scène dans GET /me/stories/:id', async () => {
      const { token, story, hall, cellar } = await setup();
      const created = (await request('POST', `/me/scenes/${hall.id}/choices`, token, { toSceneId: cellar.id, label: 'Descendre' })).json();

      const response = await app.inject({
        method: 'GET',
        url: `/me/stories/${story.id}`,
        headers: { authorization: `Bearer ${token}` },
      });

      const hallDto = response.json().scenes.find((scene: { id: string }) => scene.id === hall.id);
      expect(hallDto.choices).toEqual([created]);
    });

    it('répond 422 COMBAT_SCENE sur une scène de combat', async () => {
      const { token, story, hall, cellar } = await setup();
      const [goblin] = await db.insert(enemies).values({ storyId: story.id, name: 'Gobelin', attack: 2, hp: 4 }).returning();
      await db.update(scenes).set({ enemyId: goblin.id }).where(eq(scenes.id, hall.id));

      const response = await request('POST', `/me/scenes/${hall.id}/choices`, token, { toSceneId: cellar.id, label: 'Fuir' });

      expect(response.statusCode).toBe(422);
      expect(response.json().error.code).toBe('COMBAT_SCENE');
    });

    it("répond 422 INVALID_REFERENCE pour une scène d'arrivée d'une autre histoire", async () => {
      const { token, user, hall } = await setup();
      const [otherStory] = await db
        .insert(stories)
        .values({ authorId: user.id, title: 'Autre', genre: 'Fantastique' })
        .returning();
      const [foreign] = await db.insert(scenes).values({ storyId: otherStory.id, title: 'Ailleurs', text: 'texte' }).returning();

      const response = await request('POST', `/me/scenes/${hall.id}/choices`, token, { toSceneId: foreign.id, label: 'Partir' });

      expect(response.statusCode).toBe(422);
      expect(response.json().error).toMatchObject({ code: 'INVALID_REFERENCE', field: 'toSceneId' });
    });

    it.each([
      [
        'condition sur une stat texte',
        (nameId: string) => ({ condition: { type: 'stat', statId: nameId, op: '==', value: 1 } }),
        'condition.statId',
      ],
      [
        'condition sur un objet inconnu',
        () => ({ condition: { type: 'item', itemId: UNKNOWN_ID, op: 'has' } }),
        'condition.itemId',
      ],
      [
        'effet sur une stat inconnue',
        () => ({ effects: [{ type: 'stat', statId: UNKNOWN_ID, delta: 1 }] }),
        'effects[0].statId',
      ],
    ])('répond 422 INVALID_REFERENCE : %s', async (_label, extra, field) => {
      const { token, hall, cellar, name } = await setup();

      const response = await request('POST', `/me/scenes/${hall.id}/choices`, token, {
        toSceneId: cellar.id,
        label: 'Essayer',
        ...extra(name.id),
      });

      expect(response.statusCode).toBe(422);
      expect(response.json().error).toMatchObject({ code: 'INVALID_REFERENCE', field });
    });

    it('répond 404 pour une scène inconnue', async () => {
      const { token, cellar } = await setup();

      const response = await request('POST', `/me/scenes/${UNKNOWN_ID}/choices`, token, { toSceneId: cellar.id, label: 'X' });

      expect(response.statusCode).toBe(404);
    });

    it("répond 403 sur la scène d'un autre créateur", async () => {
      const { hall, cellar } = await setup();
      const { token: otherToken } = await createUser(app, { role: 'CREATOR' });

      const response = await request('POST', `/me/scenes/${hall.id}/choices`, otherToken, { toSceneId: cellar.id, label: 'X' });

      expect(response.statusCode).toBe(403);
    });

    it('répond 409 STORY_PUBLISHED sur une histoire publiée', async () => {
      const { token, story, hall, cellar } = await setup();
      await publish(story.id);

      const response = await request('POST', `/me/scenes/${hall.id}/choices`, token, { toSceneId: cellar.id, label: 'X' });

      expect(response.statusCode).toBe(409);
      expect(response.json().error.code).toBe('STORY_PUBLISHED');
    });
  });

  describe('PATCH /me/choices/:choiceId', () => {
    it('modifie les champs envoyés', async () => {
      const { token, hall, cellar, key } = await setup();
      const choice = await insertChoice(hall.id, cellar.id, { effects: [{ type: 'item', itemId: key.id, qty: 1 }] });

      const response = await request('PATCH', `/me/choices/${choice.id}`, token, {
        label: 'Rester',
        toSceneId: hall.id,
        condition: { type: 'item', itemId: key.id, op: 'not_has' },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        id: choice.id,
        toSceneId: hall.id,
        label: 'Rester',
        condition: { type: 'item', itemId: key.id, op: 'not_has' },
        effects: [{ type: 'item', itemId: key.id, qty: 1 }],
        sortOrder: 0,
      });
    });

    it('retire la condition avec condition: null', async () => {
      const { token, hall, cellar, key } = await setup();
      const choice = await insertChoice(hall.id, cellar.id, { condition: { type: 'item', itemId: key.id, op: 'has' } });

      const response = await request('PATCH', `/me/choices/${choice.id}`, token, { condition: null });

      expect(response.statusCode).toBe(200);
      expect(response.json().condition).toBeNull();
    });

    it('répond 422 INVALID_REFERENCE pour une scène d’arrivée inconnue', async () => {
      const { token, hall, cellar } = await setup();
      const choice = await insertChoice(hall.id, cellar.id);

      const response = await request('PATCH', `/me/choices/${choice.id}`, token, { toSceneId: UNKNOWN_ID });

      expect(response.statusCode).toBe(422);
      expect(response.json().error).toMatchObject({ code: 'INVALID_REFERENCE', field: 'toSceneId' });
    });

    it('répond 422 INVALID_REFERENCE pour un effet sur une stat texte', async () => {
      const { token, hall, cellar, name } = await setup();
      const choice = await insertChoice(hall.id, cellar.id);

      const response = await request('PATCH', `/me/choices/${choice.id}`, token, {
        effects: [{ type: 'stat', statId: name.id, delta: 1 }],
      });

      expect(response.statusCode).toBe(422);
      expect(response.json().error).toMatchObject({ code: 'INVALID_REFERENCE', field: 'effects[0].statId' });
    });

    it('répond 404 pour un choix inconnu', async () => {
      const { token } = await setup();

      const response = await request('PATCH', `/me/choices/${UNKNOWN_ID}`, token, { label: 'X' });

      expect(response.statusCode).toBe(404);
    });

    it("répond 403 sur le choix d'un autre créateur", async () => {
      const { hall, cellar } = await setup();
      const choice = await insertChoice(hall.id, cellar.id);
      const { token: otherToken } = await createUser(app, { role: 'CREATOR' });

      const response = await request('PATCH', `/me/choices/${choice.id}`, otherToken, { label: 'Volé' });

      expect(response.statusCode).toBe(403);
    });

    it('répond 409 STORY_PUBLISHED sur une histoire publiée', async () => {
      const { token, story, hall, cellar } = await setup();
      const choice = await insertChoice(hall.id, cellar.id);
      await publish(story.id);

      const response = await request('PATCH', `/me/choices/${choice.id}`, token, { label: 'Rester' });

      expect(response.statusCode).toBe(409);
      expect(response.json().error.code).toBe('STORY_PUBLISHED');
    });
  });

  describe('DELETE /me/choices/:choiceId', () => {
    it('supprime le choix', async () => {
      const { token, hall, cellar } = await setup();
      const choice = await insertChoice(hall.id, cellar.id);

      const response = await request('DELETE', `/me/choices/${choice.id}`, token);

      expect(response.statusCode).toBe(204);
      expect(await db.select().from(choices).where(eq(choices.id, choice.id))).toEqual([]);
    });

    it("répond 403 sur le choix d'un autre créateur", async () => {
      const { hall, cellar } = await setup();
      const choice = await insertChoice(hall.id, cellar.id);
      const { token: otherToken } = await createUser(app, { role: 'CREATOR' });

      const response = await request('DELETE', `/me/choices/${choice.id}`, otherToken);

      expect(response.statusCode).toBe(403);
    });

    it('répond 404 pour un choix inconnu', async () => {
      const { token } = await setup();

      const response = await request('DELETE', `/me/choices/${UNKNOWN_ID}`, token);

      expect(response.statusCode).toBe(404);
    });

    it('répond 409 STORY_PUBLISHED sur une histoire publiée', async () => {
      const { token, story, hall, cellar } = await setup();
      const choice = await insertChoice(hall.id, cellar.id);
      await publish(story.id);

      const response = await request('DELETE', `/me/choices/${choice.id}`, token);

      expect(response.statusCode).toBe(409);
      expect(response.json().error.code).toBe('STORY_PUBLISHED');
    });
  });
});
