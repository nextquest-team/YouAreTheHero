import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp, type App } from '../src/app.js';
import { db } from '../src/db/index.js';
import { choices, enemies, items, scenes, statDefinitions, stories } from '../src/db/schema/index.js';
import { createUser } from './helpers/auth.js';
import { resetDb } from './helpers/db.js';

describe('module stats du créateur', () => {
  let app: App;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
    await app.ready();
  });

  beforeEach(async () => {
    await resetDb();
  });

  /** Créateur avec une histoire en brouillon. */
  async function setup() {
    const { token, user } = await createUser(app, { role: 'CREATOR' });
    const [story] = await db
      .insert(stories)
      .values({ authorId: user.id, title: 'Le Donjon', genre: 'Fantastique', hasCombat: true })
      .returning();
    return { token, user, story };
  }

  function createStat(token: string, storyId: string, payload: Record<string, unknown>) {
    return app.inject({
      method: 'POST',
      url: `/me/stories/${storyId}/stats`,
      headers: { authorization: `Bearer ${token}` },
      payload,
    });
  }

  function patchStat(token: string, statId: string, payload: Record<string, unknown>) {
    return app.inject({
      method: 'PATCH',
      url: `/me/stats/${statId}`,
      headers: { authorization: `Bearer ${token}` },
      payload,
    });
  }

  function deleteStat(token: string, statId: string) {
    return app.inject({
      method: 'DELETE',
      url: `/me/stats/${statId}`,
      headers: { authorization: `Bearer ${token}` },
    });
  }

  async function insertStat(storyId: string, overrides: Partial<typeof statDefinitions.$inferInsert> = {}) {
    const [stat] = await db
      .insert(statDefinitions)
      .values({ storyId, name: 'Force', type: 'number', defaultValue: '5', ...overrides })
      .returning();
    return stat;
  }

  describe('POST /me/stories/:id/stats', () => {
    it('crée une stat numérique et la place en fin de liste', async () => {
      const { token, story } = await setup();

      const first = await createStat(token, story.id, { name: '  PV ', type: 'number', defaultValue: '10', min: 0, max: 20 });
      const second = await createStat(token, story.id, { name: 'Force', type: 'number', defaultValue: '3' });

      expect(first.statusCode).toBe(201);
      expect(first.json()).toMatchObject({ name: 'PV', type: 'number', defaultValue: '10', min: 0, max: 20, sortOrder: 0 });
      expect(second.json()).toMatchObject({ min: null, max: null, sortOrder: 1 });
    });

    it('crée une stat texte', async () => {
      const { token, story } = await setup();

      const response = await createStat(token, story.id, { name: 'Nom du héros', type: 'text', defaultValue: 'Anonyme' });

      expect(response.statusCode).toBe(201);
      expect(response.json()).toMatchObject({ type: 'text', defaultValue: 'Anonyme', min: null, max: null });
    });

    it('la stat apparaît dans GET /me/stories/:id', async () => {
      const { token, story } = await setup();
      const created = (await createStat(token, story.id, { name: 'PV', type: 'number', defaultValue: '10' })).json();

      const response = await app.inject({
        method: 'GET',
        url: `/me/stories/${story.id}`,
        headers: { authorization: `Bearer ${token}` },
      });

      expect(response.json().stats).toEqual([created]);
    });

    it.each([
      ['min supérieur au max', { type: 'number', defaultValue: '5', min: 10, max: 2 }, 'min'],
      ['défaut sous le min', { type: 'number', defaultValue: '-1', min: 0 }, 'defaultValue'],
      ['défaut au-dessus du max', { type: 'number', defaultValue: '30', max: 20 }, 'defaultValue'],
      ['défaut non entier', { type: 'number', defaultValue: '2.5' }, 'defaultValue'],
      ['défaut qui n’est pas un nombre', { type: 'number', defaultValue: 'beaucoup' }, 'defaultValue'],
      ['stat texte avec un min', { type: 'text', defaultValue: 'Anonyme', min: 0 }, 'min'],
      ['texte par défaut trop long', { type: 'text', defaultValue: 'x'.repeat(51) }, 'defaultValue'],
    ])('répond 422 INVALID_STAT : %s', async (_label, payload, field) => {
      const { token, story } = await setup();

      const response = await createStat(token, story.id, { name: 'Stat', ...payload });

      expect(response.statusCode).toBe(422);
      expect(response.json().error).toMatchObject({ code: 'INVALID_STAT', field });
    });

    it('répond 422 VALIDATION_ERROR sans nom', async () => {
      const { token, story } = await setup();

      const response = await createStat(token, story.id, { name: '  ', type: 'number', defaultValue: '1' });

      expect(response.statusCode).toBe(422);
      expect(response.json().error.code).toBe('VALIDATION_ERROR');
    });

    it("répond 403 sur l'histoire d'un autre créateur", async () => {
      const { story } = await setup();
      const { token: otherToken } = await createUser(app, { role: 'CREATOR' });

      const response = await createStat(otherToken, story.id, { name: 'PV', type: 'number', defaultValue: '10' });

      expect(response.statusCode).toBe(403);
    });

    it('répond 409 STORY_PUBLISHED sur une histoire publiée', async () => {
      const { token, story } = await setup();
      await db.update(stories).set({ published: true }).where(eq(stories.id, story.id));

      const response = await createStat(token, story.id, { name: 'PV', type: 'number', defaultValue: '10' });

      expect(response.statusCode).toBe(409);
      expect(response.json().error.code).toBe('STORY_PUBLISHED');
    });

    it('répond 403 pour un joueur', async () => {
      const { story } = await setup();
      const { token: playerToken } = await createUser(app, { role: 'PLAYER' });

      const response = await createStat(playerToken, story.id, { name: 'PV', type: 'number', defaultValue: '10' });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('PATCH /me/stats/:statId', () => {
    it('renomme une stat sans toucher au reste', async () => {
      const { token, story } = await setup();
      const stat = await insertStat(story.id, { min: 0, max: 10 });

      const response = await patchStat(token, stat.id, { name: 'Vigueur' });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({ name: 'Vigueur', defaultValue: '5', min: 0, max: 10 });
    });

    it('valide les valeurs fusionnées avec celles déjà enregistrées', async () => {
      const { token, story } = await setup();
      const stat = await insertStat(story.id, { defaultValue: '5' });

      const response = await patchStat(token, stat.id, { max: 3 });

      expect(response.statusCode).toBe(422);
      expect(response.json().error).toMatchObject({ code: 'INVALID_STAT', field: 'defaultValue' });
    });

    it('passer en texte efface le min et le max', async () => {
      const { token, story } = await setup();
      const stat = await insertStat(story.id, { min: 0, max: 10 });

      const response = await patchStat(token, stat.id, { type: 'text', defaultValue: 'Rien' });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({ type: 'text', defaultValue: 'Rien', min: null, max: null });
    });

    it("refuse de passer en texte la stat d'attaque (422)", async () => {
      const { token, story } = await setup();
      const stat = await insertStat(story.id);
      await db.update(stories).set({ attackStatId: stat.id }).where(eq(stories.id, story.id));

      const response = await patchStat(token, stat.id, { type: 'text' });

      expect(response.statusCode).toBe(422);
      expect(response.json().error).toMatchObject({ code: 'INVALID_STAT', field: 'type' });
    });

    it('refuse de passer en texte une stat utilisée (409 STAT_IN_USE)', async () => {
      const { token, story } = await setup();
      const stat = await insertStat(story.id);
      await db
        .insert(scenes)
        .values({ storyId: story.id, title: 'Forge', text: 'texte', onEnterEffects: [{ type: 'stat', statId: stat.id, delta: 1 }] });

      const response = await patchStat(token, stat.id, { type: 'text' });

      expect(response.statusCode).toBe(409);
      expect(response.json().error.code).toBe('STAT_IN_USE');
    });

    it('répond 404 pour une stat inconnue', async () => {
      const { token } = await setup();

      const response = await patchStat(token, '00000000-0000-4000-8000-000000000000', { name: 'X' });

      expect(response.statusCode).toBe(404);
    });

    it("répond 403 sur la stat d'un autre créateur", async () => {
      const { story } = await setup();
      const stat = await insertStat(story.id);
      const { token: otherToken } = await createUser(app, { role: 'CREATOR' });

      const response = await patchStat(otherToken, stat.id, { name: 'Volée' });

      expect(response.statusCode).toBe(403);
    });

    it('répond 409 STORY_PUBLISHED sur une histoire publiée', async () => {
      const { token, story } = await setup();
      const stat = await insertStat(story.id);
      await db.update(stories).set({ published: true }).where(eq(stories.id, story.id));

      const response = await patchStat(token, stat.id, { name: 'Vigueur' });

      expect(response.statusCode).toBe(409);
      expect(response.json().error.code).toBe('STORY_PUBLISHED');
    });
  });

  describe('DELETE /me/stats/:statId', () => {
    it("supprime une stat inutilisée et remet attackStatId et hpStatId à null", async () => {
      const { token, story } = await setup();
      const stat = await insertStat(story.id);
      await db.update(stories).set({ attackStatId: stat.id, hpStatId: stat.id }).where(eq(stories.id, story.id));

      const response = await deleteStat(token, stat.id);

      expect(response.statusCode).toBe(204);
      const [after] = await db.select().from(stories).where(eq(stories.id, story.id));
      expect(after.attackStatId).toBeNull();
      expect(after.hpStatId).toBeNull();
      expect(await db.select().from(statDefinitions).where(eq(statDefinitions.id, stat.id))).toEqual([]);
    });

    it('répond 409 STAT_IN_USE avec tous les endroits qui citent la stat', async () => {
      const { token, story } = await setup();
      const stat = await insertStat(story.id);
      const other = await insertStat(story.id, { name: 'Magie' });
      const statEffect = { type: 'stat' as const, statId: stat.id, delta: -1 };

      const [sceneA, sceneB] = await db
        .insert(scenes)
        .values([
          { storyId: story.id, title: 'Entrée', text: 'texte', onEnterEffects: [statEffect] },
          { storyId: story.id, title: 'Couloir', text: 'texte' },
        ])
        .returning();
      const [byCondition, byEffect] = await db
        .insert(choices)
        .values([
          {
            fromSceneId: sceneA.id,
            toSceneId: sceneB.id,
            label: 'Forcer la porte',
            condition: { type: 'stat', statId: stat.id, op: '>=', value: 3 },
          },
          { fromSceneId: sceneA.id, toSceneId: sceneB.id, label: 'Se blesser', effects: [statEffect] },
          // Cite une autre stat : ne doit pas remonter.
          {
            fromSceneId: sceneA.id,
            toSceneId: sceneB.id,
            label: 'Lancer un sort',
            condition: { type: 'stat', statId: other.id, op: '>=', value: 1 },
          },
        ])
        .returning();
      const [potion] = await db
        .insert(items)
        .values({ storyId: story.id, name: 'Potion', useEffects: [{ type: 'stat', statId: stat.id, delta: 2 }] })
        .returning();
      const [goule] = await db
        .insert(enemies)
        .values({ storyId: story.id, name: 'Goule', attack: 3, hp: 6, defeatEffects: [statEffect] })
        .returning();

      const response = await deleteStat(token, stat.id);

      expect(response.statusCode).toBe(409);
      const error = response.json().error;
      expect(error.code).toBe('STAT_IN_USE');
      expect(error.usedIn).toHaveLength(5);
      expect(error.usedIn).toEqual(
        expect.arrayContaining([
          { kind: 'choice', id: byCondition.id, storyId: story.id, label: 'Forcer la porte' },
          { kind: 'choice', id: byEffect.id, storyId: story.id, label: 'Se blesser' },
          { kind: 'scene', id: sceneA.id, storyId: story.id, label: 'Entrée' },
          { kind: 'item', id: potion.id, storyId: story.id, label: 'Potion' },
          { kind: 'enemy', id: goule.id, storyId: story.id, label: 'Goule' },
        ]),
      );
      expect(await db.select().from(statDefinitions).where(eq(statDefinitions.id, stat.id))).toHaveLength(1);
    });

    it("répond 403 sur la stat d'un autre créateur", async () => {
      const { story } = await setup();
      const stat = await insertStat(story.id);
      const { token: otherToken } = await createUser(app, { role: 'CREATOR' });

      const response = await deleteStat(otherToken, stat.id);

      expect(response.statusCode).toBe(403);
    });

    it('répond 409 STORY_PUBLISHED sur une histoire publiée', async () => {
      const { token, story } = await setup();
      const stat = await insertStat(story.id);
      await db.update(stories).set({ published: true }).where(eq(stories.id, story.id));

      const response = await deleteStat(token, stat.id);

      expect(response.statusCode).toBe(409);
      expect(response.json().error.code).toBe('STORY_PUBLISHED');
    });
  });
});
