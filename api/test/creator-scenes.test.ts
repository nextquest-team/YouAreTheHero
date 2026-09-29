import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp, type App } from '../src/app.js';
import { db } from '../src/db/index.js';
import { choices, enemies, items, media, scenes, statDefinitions, stories } from '../src/db/schema/index.js';
import { createUser } from './helpers/auth.js';
import { resetDb } from './helpers/db.js';

const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000';

describe('module scènes du créateur', () => {
  let app: App;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
    await app.ready();
  });

  beforeEach(async () => {
    await resetDb();
  });

  /** Créateur avec une histoire en brouillon (à combats par défaut), une stat, un objet et un ennemi. */
  async function setup(hasCombat = true) {
    const { token, user } = await createUser(app, { role: 'CREATOR' });
    const [story] = await db
      .insert(stories)
      .values({ authorId: user.id, title: 'Le Donjon', genre: 'Fantastique', hasCombat })
      .returning();
    const [gold] = await db
      .insert(statDefinitions)
      .values({ storyId: story.id, name: 'Or', type: 'number', defaultValue: '0' })
      .returning();
    const [key] = await db.insert(items).values({ storyId: story.id, name: 'Clé' }).returning();
    const [goblin] = await db.insert(enemies).values({ storyId: story.id, name: 'Gobelin', attack: 2, hp: 4 }).returning();
    return { token, user, story, gold, key, goblin };
  }

  function request(method: 'POST' | 'PATCH' | 'DELETE', url: string, token: string, payload?: Record<string, unknown>) {
    return app.inject({ method, url, headers: { authorization: `Bearer ${token}` }, payload });
  }

  async function insertScene(storyId: string, overrides: Partial<typeof scenes.$inferInsert> = {}) {
    const [scene] = await db.insert(scenes).values({ storyId, title: 'Entrée', text: 'texte', ...overrides }).returning();
    return scene;
  }

  async function publish(storyId: string) {
    await db.update(stories).set({ published: true }).where(eq(stories.id, storyId));
  }

  describe('POST /me/stories/:id/scenes', () => {
    it('crée une scène simple puis une scène de combat, en fin de liste', async () => {
      const { token, story, gold, key, goblin } = await setup();
      const win = await insertScene(story.id, { title: 'Victoire' });
      const lose = await insertScene(story.id, { title: 'Défaite', sortOrder: 1 });

      const simple = await request('POST', `/me/stories/${story.id}/scenes`, token, {
        title: ' Forge ',
        text: 'Une forge abandonnée.',
        backgroundUrl: '/uploads/forge.jpg',
        isEnding: false,
        onEnterEffects: [
          { type: 'stat', statId: gold.id, delta: 2 },
          { type: 'item', itemId: key.id, qty: 1 },
        ],
      });
      const combat = await request('POST', `/me/stories/${story.id}/scenes`, token, {
        title: 'Embuscade',
        text: 'Un gobelin surgit.',
        isEnding: false,
        enemyId: goblin.id,
        winSceneId: win.id,
        loseSceneId: lose.id,
      });

      expect(simple.statusCode).toBe(201);
      expect(simple.json()).toEqual({
        id: expect.any(String),
        title: 'Forge',
        text: 'Une forge abandonnée.',
        backgroundUrl: '/uploads/forge.jpg',
        isEnding: false,
        enemyId: null,
        winSceneId: null,
        loseSceneId: null,
        onEnterEffects: [
          { type: 'stat', statId: gold.id, delta: 2 },
          { type: 'item', itemId: key.id, qty: 1 },
        ],
        sortOrder: 2,
        choices: [],
      });
      expect(combat.statusCode).toBe(201);
      expect(combat.json()).toMatchObject({ enemyId: goblin.id, winSceneId: win.id, loseSceneId: lose.id, sortOrder: 3 });
    });

    it('isEnding vaut false par défaut, et la scène apparaît dans GET /me/stories/:id', async () => {
      const { token, story } = await setup();

      const created = await request('POST', `/me/stories/${story.id}/scenes`, token, { title: 'Fin', text: '' });
      const full = await app.inject({
        method: 'GET',
        url: `/me/stories/${story.id}`,
        headers: { authorization: `Bearer ${token}` },
      });

      expect(created.statusCode).toBe(201);
      expect(created.json().isEnding).toBe(false);
      expect(full.json().scenes).toEqual([created.json()]);
    });

    it('répond 422 COMBAT_DISABLED avec un ennemi dans une histoire sans combats', async () => {
      const { token, story, goblin } = await setup(false);

      const response = await request('POST', `/me/stories/${story.id}/scenes`, token, {
        title: 'Embuscade',
        text: 'texte',
        enemyId: goblin.id,
      });

      expect(response.statusCode).toBe(422);
      expect(response.json().error).toMatchObject({ code: 'COMBAT_DISABLED', field: 'enemyId' });
    });

    it.each(['enemyId', 'winSceneId', 'loseSceneId'])(
      'répond 422 INVALID_REFERENCE pour un %s inconnu',
      async (field) => {
        const { token, story } = await setup();

        const response = await request('POST', `/me/stories/${story.id}/scenes`, token, {
          title: 'Embuscade',
          text: 'texte',
          [field]: UNKNOWN_ID,
        });

        expect(response.statusCode).toBe(422);
        expect(response.json().error).toMatchObject({ code: 'INVALID_REFERENCE', field });
      },
    );

    it("répond 422 INVALID_REFERENCE pour une scène de victoire d'une autre histoire", async () => {
      const { token, story, user } = await setup();
      const [otherStory] = await db
        .insert(stories)
        .values({ authorId: user.id, title: 'Autre', genre: 'Fantastique' })
        .returning();
      const foreign = await insertScene(otherStory.id);

      const response = await request('POST', `/me/stories/${story.id}/scenes`, token, {
        title: 'Embuscade',
        text: 'texte',
        winSceneId: foreign.id,
      });

      expect(response.statusCode).toBe(422);
      expect(response.json().error).toMatchObject({ code: 'INVALID_REFERENCE', field: 'winSceneId' });
    });

    it("répond 422 INVALID_REFERENCE pour un effet d'arrivée sur un objet inconnu", async () => {
      const { token, story } = await setup();

      const response = await request('POST', `/me/stories/${story.id}/scenes`, token, {
        title: 'Forge',
        text: 'texte',
        onEnterEffects: [{ type: 'item', itemId: UNKNOWN_ID, qty: 1 }],
      });

      expect(response.statusCode).toBe(422);
      expect(response.json().error).toMatchObject({ code: 'INVALID_REFERENCE', field: 'onEnterEffects[0].itemId' });
    });

    it('répond 422 VALIDATION_ERROR pour un décor hors /uploads', async () => {
      const { token, story } = await setup();

      const response = await request('POST', `/me/stories/${story.id}/scenes`, token, {
        title: 'Forge',
        text: 'texte',
        backgroundUrl: '/uploads/../secret.jpg',
      });

      expect(response.statusCode).toBe(422);
      expect(response.json().error.code).toBe('VALIDATION_ERROR');
    });

    it("répond 403 sur l'histoire d'un autre créateur", async () => {
      const { story } = await setup();
      const { token: otherToken } = await createUser(app, { role: 'CREATOR' });

      const response = await request('POST', `/me/stories/${story.id}/scenes`, otherToken, { title: 'X', text: 'texte' });

      expect(response.statusCode).toBe(403);
    });

    it('répond 409 STORY_PUBLISHED sur une histoire publiée', async () => {
      const { token, story } = await setup();
      await publish(story.id);

      const response = await request('POST', `/me/stories/${story.id}/scenes`, token, { title: 'X', text: 'texte' });

      expect(response.statusCode).toBe(409);
      expect(response.json().error.code).toBe('STORY_PUBLISHED');
    });
  });

  describe('PATCH /me/scenes/:sceneId', () => {
    it('modifie les champs envoyés et renvoie la scène avec ses choix', async () => {
      const { token, story } = await setup();
      const scene = await insertScene(story.id, { backgroundUrl: '/uploads/forge.jpg' });
      const target = await insertScene(story.id, { title: 'Cour' });
      const [choice] = await db
        .insert(choices)
        .values({ fromSceneId: scene.id, toSceneId: target.id, label: 'Sortir' })
        .returning();

      const response = await request('PATCH', `/me/scenes/${scene.id}`, token, { title: 'Hall', isEnding: true });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        title: 'Hall',
        text: 'texte',
        backgroundUrl: '/uploads/forge.jpg',
        isEnding: true,
        choices: [{ id: choice.id, toSceneId: target.id, label: 'Sortir', condition: null, effects: [], sortOrder: 0 }],
      });
    });

    it('ajoute puis retire un ennemi', async () => {
      const { token, story, goblin } = await setup();
      const scene = await insertScene(story.id);

      const added = await request('PATCH', `/me/scenes/${scene.id}`, token, { enemyId: goblin.id });
      const removed = await request('PATCH', `/me/scenes/${scene.id}`, token, { enemyId: null });

      expect(added.statusCode).toBe(200);
      expect(added.json().enemyId).toBe(goblin.id);
      expect(removed.statusCode).toBe(200);
      expect(removed.json().enemyId).toBeNull();
    });

    it('répond 422 SCENE_HAS_CHOICES pour un ennemi sur une scène qui a des choix', async () => {
      const { token, story, goblin } = await setup();
      const scene = await insertScene(story.id);
      await db.insert(choices).values({ fromSceneId: scene.id, toSceneId: scene.id, label: 'Attendre' });

      const response = await request('PATCH', `/me/scenes/${scene.id}`, token, { enemyId: goblin.id });

      expect(response.statusCode).toBe(422);
      expect(response.json().error).toMatchObject({ code: 'SCENE_HAS_CHOICES', field: 'enemyId' });
    });

    it('répond 422 COMBAT_DISABLED pour un ennemi dans une histoire sans combats', async () => {
      const { token, story, goblin } = await setup(false);
      const scene = await insertScene(story.id);

      const response = await request('PATCH', `/me/scenes/${scene.id}`, token, { enemyId: goblin.id });

      expect(response.statusCode).toBe(422);
      expect(response.json().error).toMatchObject({ code: 'COMBAT_DISABLED', field: 'enemyId' });
    });

    it("répond 422 INVALID_REFERENCE pour l'ennemi d'une autre histoire", async () => {
      const { token, story, user } = await setup();
      const [otherStory] = await db
        .insert(stories)
        .values({ authorId: user.id, title: 'Autre', genre: 'Fantastique', hasCombat: true })
        .returning();
      const [foreign] = await db.insert(enemies).values({ storyId: otherStory.id, name: 'Orc', attack: 1, hp: 1 }).returning();
      const scene = await insertScene(story.id);

      const response = await request('PATCH', `/me/scenes/${scene.id}`, token, { enemyId: foreign.id });

      expect(response.statusCode).toBe(422);
      expect(response.json().error).toMatchObject({ code: 'INVALID_REFERENCE', field: 'enemyId' });
    });

    it("répond 422 INVALID_REFERENCE pour un effet d'arrivée sur une stat texte", async () => {
      const { token, story } = await setup();
      const [name] = await db
        .insert(statDefinitions)
        .values({ storyId: story.id, name: 'Nom', type: 'text', defaultValue: 'Anonyme' })
        .returning();
      const scene = await insertScene(story.id);

      const response = await request('PATCH', `/me/scenes/${scene.id}`, token, {
        onEnterEffects: [{ type: 'stat', statId: name.id, delta: 1 }],
      });

      expect(response.statusCode).toBe(422);
      expect(response.json().error).toMatchObject({ code: 'INVALID_REFERENCE', field: 'onEnterEffects[0].statId' });
    });

    it('répond 404 pour une scène inconnue', async () => {
      const { token } = await setup();

      const response = await request('PATCH', `/me/scenes/${UNKNOWN_ID}`, token, { title: 'X' });

      expect(response.statusCode).toBe(404);
    });

    it("répond 403 sur la scène d'un autre créateur", async () => {
      const { story } = await setup();
      const scene = await insertScene(story.id);
      const { token: otherToken } = await createUser(app, { role: 'CREATOR' });

      const response = await request('PATCH', `/me/scenes/${scene.id}`, otherToken, { title: 'Volée' });

      expect(response.statusCode).toBe(403);
    });

    it('répond 409 STORY_PUBLISHED sur une histoire publiée', async () => {
      const { token, story } = await setup();
      const scene = await insertScene(story.id);
      await publish(story.id);

      const response = await request('PATCH', `/me/scenes/${scene.id}`, token, { title: 'Hall' });

      expect(response.statusCode).toBe(409);
      expect(response.json().error.code).toBe('STORY_PUBLISHED');
    });
  });

  describe('DELETE /me/scenes/:sceneId', () => {
    it('supprime une scène isolée avec ses propres choix, même ceux qui bouclent sur elle', async () => {
      const { token, story } = await setup();
      const scene = await insertScene(story.id);
      const other = await insertScene(story.id, { title: 'Cour' });
      await db.insert(choices).values([
        { fromSceneId: scene.id, toSceneId: other.id, label: 'Sortir' },
        { fromSceneId: scene.id, toSceneId: scene.id, label: 'Attendre' },
      ]);
      await db.update(scenes).set({ winSceneId: scene.id }).where(eq(scenes.id, scene.id));

      const response = await request('DELETE', `/me/scenes/${scene.id}`, token);

      expect(response.statusCode).toBe(204);
      expect(await db.select().from(scenes).where(eq(scenes.id, scene.id))).toEqual([]);
      expect(await db.select().from(choices).where(eq(choices.fromSceneId, scene.id))).toEqual([]);
    });

    it('répond 409 SCENE_IN_USE avec tout ce qui mène encore à la scène', async () => {
      const { token, story, goblin } = await setup();
      const scene = await insertScene(story.id, { title: 'Trésor' });
      const combat = await insertScene(story.id, { title: 'Embuscade', enemyId: goblin.id, loseSceneId: scene.id });
      const hall = await insertScene(story.id, { title: 'Hall' });
      const [choice] = await db
        .insert(choices)
        .values({ fromSceneId: hall.id, toSceneId: scene.id, label: 'Descendre' })
        .returning();
      await db.update(stories).set({ startSceneId: scene.id }).where(eq(stories.id, story.id));

      const response = await request('DELETE', `/me/scenes/${scene.id}`, token);

      expect(response.statusCode).toBe(409);
      expect(response.json().error).toMatchObject({
        code: 'SCENE_IN_USE',
        usedIn: [
          { kind: 'story', id: story.id, storyId: story.id, label: 'Le Donjon' },
          { kind: 'scene', id: combat.id, storyId: story.id, label: 'Embuscade' },
          { kind: 'choice', id: choice.id, storyId: story.id, label: 'Descendre' },
        ],
      });
      expect(await db.select().from(scenes).where(eq(scenes.id, scene.id))).toHaveLength(1);
    });

    it("répond 403 sur la scène d'un autre créateur", async () => {
      const { story } = await setup();
      const scene = await insertScene(story.id);
      const { token: otherToken } = await createUser(app, { role: 'CREATOR' });

      const response = await request('DELETE', `/me/scenes/${scene.id}`, otherToken);

      expect(response.statusCode).toBe(403);
    });

    it('répond 404 pour une scène inconnue', async () => {
      const { token } = await setup();

      const response = await request('DELETE', `/me/scenes/${UNKNOWN_ID}`, token);

      expect(response.statusCode).toBe(404);
    });

    it('répond 409 STORY_PUBLISHED sur une histoire publiée', async () => {
      const { token, story } = await setup();
      const scene = await insertScene(story.id);
      await publish(story.id);

      const response = await request('DELETE', `/me/scenes/${scene.id}`, token);

      expect(response.statusCode).toBe(409);
      expect(response.json().error.code).toBe('STORY_PUBLISHED');
    });
  });

  it("la médiathèque refuse de supprimer le décor d'une scène créée par l'API (409 IMAGE_IN_USE)", async () => {
    const { token, user, story } = await setup();
    const [image] = await db.insert(media).values({ ownerId: user.id, url: '/uploads/forge.jpg' }).returning();
    const scene = (
      await request('POST', `/me/stories/${story.id}/scenes`, token, {
        title: 'Forge',
        text: 'texte',
        backgroundUrl: '/uploads/forge.jpg',
      })
    ).json();

    const response = await request('DELETE', `/me/media/${image.id}`, token);

    expect(response.statusCode).toBe(409);
    expect(response.json().error).toMatchObject({
      code: 'IMAGE_IN_USE',
      usedIn: [{ kind: 'scene', id: scene.id, storyId: story.id, label: 'Forge' }],
    });
  });
});
