import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp, type App } from '../src/app.js';
import { db } from '../src/db/index.js';
import { choices, enemies, items, media, scenes, statDefinitions, stories } from '../src/db/schema/index.js';
import { createUser } from './helpers/auth.js';
import { resetDb } from './helpers/db.js';

const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000';

describe('module objets du créateur', () => {
  let app: App;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
    await app.ready();
  });

  beforeEach(async () => {
    await resetDb();
  });

  /** Créateur avec une histoire en brouillon, une stat PV numérique et une stat texte. */
  async function setup() {
    const { token, user } = await createUser(app, { role: 'CREATOR' });
    const [story] = await db
      .insert(stories)
      .values({ authorId: user.id, title: 'Le Donjon', genre: 'Fantastique', hasCombat: true })
      .returning();
    const [hp] = await db
      .insert(statDefinitions)
      .values({ storyId: story.id, name: 'PV', type: 'number', defaultValue: '10' })
      .returning();
    const [name] = await db
      .insert(statDefinitions)
      .values({ storyId: story.id, name: 'Nom', type: 'text', defaultValue: 'Anonyme' })
      .returning();
    return { token, user, story, hp, name };
  }

  function request(method: 'POST' | 'PATCH' | 'DELETE', url: string, token: string, payload?: Record<string, unknown>) {
    return app.inject({ method, url, headers: { authorization: `Bearer ${token}` }, payload });
  }

  async function insertItem(storyId: string, overrides: Partial<typeof items.$inferInsert> = {}) {
    const [item] = await db.insert(items).values({ storyId, name: 'Clé', ...overrides }).returning();
    return item;
  }

  async function publish(storyId: string) {
    await db.update(stories).set({ published: true }).where(eq(stories.id, storyId));
  }

  describe('POST /me/stories/:id/items', () => {
    it('crée un consommable puis un objet simple, en fin de liste', async () => {
      const { token, story, hp } = await setup();
      const payload = {
        name: ' Potion ',
        description: 'Rend 3 PV',
        imageUrl: '/uploads/potion.png',
        useEffects: [{ type: 'stat', statId: hp.id, delta: 3 }],
      };

      const first = await request('POST', `/me/stories/${story.id}/items`, token, payload);
      const second = await request('POST', `/me/stories/${story.id}/items`, token, { name: 'Clé rouillée' });

      expect(first.statusCode).toBe(201);
      expect(first.json()).toEqual({ id: expect.any(String), ...payload, name: 'Potion', sortOrder: 0 });
      expect(second.statusCode).toBe(201);
      expect(second.json()).toMatchObject({ description: null, imageUrl: null, useEffects: null, sortOrder: 1 });
    });

    it("l'objet apparaît dans GET /me/stories/:id", async () => {
      const { token, story } = await setup();
      const created = (await request('POST', `/me/stories/${story.id}/items`, token, { name: 'Clé' })).json();

      const response = await app.inject({
        method: 'GET',
        url: `/me/stories/${story.id}`,
        headers: { authorization: `Bearer ${token}` },
      });

      expect(response.json().items).toEqual([created]);
    });

    it('répond 422 VALIDATION_ERROR pour une image hors /uploads', async () => {
      const { token, story } = await setup();

      const response = await request('POST', `/me/stories/${story.id}/items`, token, {
        name: 'Clé',
        imageUrl: '/etc/passwd',
      });

      expect(response.statusCode).toBe(422);
      expect(response.json().error.code).toBe('VALIDATION_ERROR');
    });

    it('répond 422 INVALID_REFERENCE pour un effet sur une stat texte', async () => {
      const { token, story, name } = await setup();

      const response = await request('POST', `/me/stories/${story.id}/items`, token, {
        name: 'Parchemin',
        useEffects: [{ type: 'stat', statId: name.id, delta: 1 }],
      });

      expect(response.statusCode).toBe(422);
      expect(response.json().error).toMatchObject({ code: 'INVALID_REFERENCE', field: 'useEffects[0].statId' });
    });

    it("répond 422 INVALID_REFERENCE pour un effet qui donne l'objet d'une autre histoire", async () => {
      const { token, story, user } = await setup();
      const [otherStory] = await db
        .insert(stories)
        .values({ authorId: user.id, title: 'Autre', genre: 'Fantastique' })
        .returning();
      const foreign = await insertItem(otherStory.id);

      const response = await request('POST', `/me/stories/${story.id}/items`, token, {
        name: 'Coffre',
        useEffects: [{ type: 'item', itemId: foreign.id, qty: 1 }],
      });

      expect(response.statusCode).toBe(422);
      expect(response.json().error).toMatchObject({ code: 'INVALID_REFERENCE', field: 'useEffects[0].itemId' });
    });

    it("répond 403 sur l'histoire d'un autre créateur", async () => {
      const { story } = await setup();
      const { token: otherToken } = await createUser(app, { role: 'CREATOR' });

      const response = await request('POST', `/me/stories/${story.id}/items`, otherToken, { name: 'Clé' });

      expect(response.statusCode).toBe(403);
    });

    it('répond 409 STORY_PUBLISHED sur une histoire publiée', async () => {
      const { token, story } = await setup();
      await publish(story.id);

      const response = await request('POST', `/me/stories/${story.id}/items`, token, { name: 'Clé' });

      expect(response.statusCode).toBe(409);
      expect(response.json().error.code).toBe('STORY_PUBLISHED');
    });
  });

  describe('PATCH /me/items/:itemId', () => {
    it('modifie les champs envoyés et peut citer l’objet lui-même', async () => {
      const { token, story } = await setup();
      const item = await insertItem(story.id, { description: 'Vieille', imageUrl: '/uploads/cle.png' });

      const response = await request('PATCH', `/me/items/${item.id}`, token, {
        name: 'Clé dorée',
        useEffects: [{ type: 'item', itemId: item.id, qty: 1 }],
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        name: 'Clé dorée',
        description: 'Vieille',
        imageUrl: '/uploads/cle.png',
        useEffects: [{ type: 'item', itemId: item.id, qty: 1 }],
      });
    });

    it('useEffects: null repasse en objet non consommable, description vide → null', async () => {
      const { token, story, hp } = await setup();
      const item = await insertItem(story.id, {
        description: 'Rend 3 PV',
        useEffects: [{ type: 'stat', statId: hp.id, delta: 3 }],
      });

      const response = await request('PATCH', `/me/items/${item.id}`, token, { useEffects: null, description: '' });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({ useEffects: null, description: null });
    });

    it('répond 422 INVALID_REFERENCE pour un effet sur une stat inconnue', async () => {
      const { token, story } = await setup();
      const item = await insertItem(story.id);

      const response = await request('PATCH', `/me/items/${item.id}`, token, {
        useEffects: [{ type: 'stat', statId: UNKNOWN_ID, delta: 1 }],
      });

      expect(response.statusCode).toBe(422);
      expect(response.json().error).toMatchObject({ code: 'INVALID_REFERENCE', field: 'useEffects[0].statId' });
    });

    it('répond 404 pour un objet inconnu', async () => {
      const { token } = await setup();

      const response = await request('PATCH', `/me/items/${UNKNOWN_ID}`, token, { name: 'X' });

      expect(response.statusCode).toBe(404);
    });

    it("répond 403 sur l'objet d'un autre créateur", async () => {
      const { story } = await setup();
      const item = await insertItem(story.id);
      const { token: otherToken } = await createUser(app, { role: 'CREATOR' });

      const response = await request('PATCH', `/me/items/${item.id}`, otherToken, { name: 'Volé' });

      expect(response.statusCode).toBe(403);
    });

    it('répond 409 STORY_PUBLISHED sur une histoire publiée', async () => {
      const { token, story } = await setup();
      const item = await insertItem(story.id);
      await publish(story.id);

      const response = await request('PATCH', `/me/items/${item.id}`, token, { name: 'Clé dorée' });

      expect(response.statusCode).toBe(409);
      expect(response.json().error.code).toBe('STORY_PUBLISHED');
    });
  });

  describe('DELETE /me/items/:itemId', () => {
    it("supprime un objet inutilisé, même s'il se cite lui-même", async () => {
      const { token, story } = await setup();
      const item = await insertItem(story.id);
      await db
        .update(items)
        .set({ useEffects: [{ type: 'item', itemId: item.id, qty: 1 }] })
        .where(eq(items.id, item.id));

      const response = await request('DELETE', `/me/items/${item.id}`, token);

      expect(response.statusCode).toBe(204);
      expect(await db.select().from(items).where(eq(items.id, item.id))).toEqual([]);
    });

    it('répond 409 ITEM_IN_USE avec tous les endroits qui citent l’objet', async () => {
      const { token, story } = await setup();
      const item = await insertItem(story.id);
      const itemEffect = { type: 'item' as const, itemId: item.id, qty: 1 };

      const [sceneA, sceneB] = await db
        .insert(scenes)
        .values([
          { storyId: story.id, title: 'Porte', text: 'texte', onEnterEffects: [itemEffect] },
          { storyId: story.id, title: 'Couloir', text: 'texte' },
        ])
        .returning();
      const [conditionChoice, effectChoice] = await db
        .insert(choices)
        .values([
          {
            fromSceneId: sceneB.id,
            toSceneId: sceneA.id,
            label: 'Ouvrir la porte',
            condition: { type: 'item', itemId: item.id, op: 'has' },
          },
          { fromSceneId: sceneB.id, toSceneId: sceneA.id, label: 'Ramasser', effects: [itemEffect] },
        ])
        .returning();
      const chest = await insertItem(story.id, { name: 'Coffre', useEffects: [itemEffect] });
      const [enemy] = await db
        .insert(enemies)
        .values({ storyId: story.id, name: 'Gardien', attack: 2, hp: 4, defeatEffects: [itemEffect] })
        .returning();

      const response = await request('DELETE', `/me/items/${item.id}`, token);

      expect(response.statusCode).toBe(409);
      const error = response.json().error;
      expect(error.code).toBe('ITEM_IN_USE');
      expect(error.usedIn).toEqual(
        expect.arrayContaining([
          { kind: 'choice', id: conditionChoice.id, storyId: story.id, label: 'Ouvrir la porte' },
          { kind: 'choice', id: effectChoice.id, storyId: story.id, label: 'Ramasser' },
          { kind: 'scene', id: sceneA.id, storyId: story.id, label: 'Porte' },
          { kind: 'item', id: chest.id, storyId: story.id, label: 'Coffre' },
          { kind: 'enemy', id: enemy.id, storyId: story.id, label: 'Gardien' },
        ]),
      );
      expect(error.usedIn).toHaveLength(5);
    });

    it("répond 403 sur l'objet d'un autre créateur", async () => {
      const { story } = await setup();
      const item = await insertItem(story.id);
      const { token: otherToken } = await createUser(app, { role: 'CREATOR' });

      const response = await request('DELETE', `/me/items/${item.id}`, otherToken);

      expect(response.statusCode).toBe(403);
    });

    it('répond 404 pour un objet inconnu', async () => {
      const { token } = await setup();

      const response = await request('DELETE', `/me/items/${UNKNOWN_ID}`, token);

      expect(response.statusCode).toBe(404);
    });

    it('répond 409 STORY_PUBLISHED sur une histoire publiée', async () => {
      const { token, story } = await setup();
      const item = await insertItem(story.id);
      await publish(story.id);

      const response = await request('DELETE', `/me/items/${item.id}`, token);

      expect(response.statusCode).toBe(409);
      expect(response.json().error.code).toBe('STORY_PUBLISHED');
    });
  });

  it("la médiathèque refuse de supprimer l'image d'un objet créé par l'API (409 IMAGE_IN_USE)", async () => {
    const { token, user, story } = await setup();
    const [image] = await db.insert(media).values({ ownerId: user.id, url: '/uploads/cle.png' }).returning();
    const item = (
      await request('POST', `/me/stories/${story.id}/items`, token, { name: 'Clé', imageUrl: '/uploads/cle.png' })
    ).json();

    const response = await request('DELETE', `/me/media/${image.id}`, token);

    expect(response.statusCode).toBe(409);
    expect(response.json().error).toMatchObject({
      code: 'IMAGE_IN_USE',
      usedIn: [{ kind: 'item', id: item.id, storyId: story.id, label: 'Clé' }],
    });
  });
});
