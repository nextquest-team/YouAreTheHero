import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp, type App } from '../src/app.js';
import { db } from '../src/db/index.js';
import { choices, enemies, scenes, statDefinitions, stories } from '../src/db/schema/index.js';
import { createUser } from './helpers/auth.js';
import { resetDb } from './helpers/db.js';

describe('module /me/stories', () => {
  let app: App;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
    await app.ready();
  });

  beforeEach(async () => {
    await resetDb();
  });

  /** Crée une histoire via la route pour un créateur donné et retourne sa forme publique. */
  async function createStory(token: string, overrides: Record<string, unknown> = {}) {
    const response = await app.inject({
      method: 'POST',
      url: '/me/stories',
      headers: { authorization: `Bearer ${token}` },
      payload: { title: 'Le Donjon', genre: 'Fantastique', ...overrides },
    });
    return response.json();
  }

  it('POST /me/stories crée une histoire pour le créateur authentifié', async () => {
    const { token } = await createUser(app, { role: 'CREATOR' });

    const response = await app.inject({
      method: 'POST',
      url: '/me/stories',
      headers: { authorization: `Bearer ${token}` },
      payload: { title: 'Le Donjon', genre: 'Fantastique' },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.title).toBe('Le Donjon');
    expect(body.genre).toBe('Fantastique');
    expect(body.summary).toBe('');
    expect(body.published).toBe(false);
    expect(body.startSceneId).toBeNull();
    expect(body.id).toBeDefined();
  });

  it('POST /me/stories sans hasCombat crée une histoire avec hasCombat: false', async () => {
    const { token } = await createUser(app, { role: 'CREATOR' });

    const response = await app.inject({
      method: 'POST',
      url: '/me/stories',
      headers: { authorization: `Bearer ${token}` },
      payload: { title: 'Le Donjon', genre: 'Fantastique' },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().hasCombat).toBe(false);
  });

  it('GET /me/stories liste les histoires du créateur, triées par updatedAt décroissant', async () => {
    const { token } = await createUser(app, { role: 'CREATOR' });
    const first = await createStory(token, { title: 'Première' });
    const second = await createStory(token, { title: 'Seconde' });

    const response = await app.inject({
      method: 'GET',
      url: '/me/stories',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.map((s: { id: string }) => s.id)).toEqual([second.id, first.id]);
  });

  it('GET /me/stories répond 403 FORBIDDEN pour un PLAYER', async () => {
    const { token } = await createUser(app, { role: 'PLAYER' });

    const response = await app.inject({
      method: 'GET',
      url: '/me/stories',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe('FORBIDDEN');
  });

  it("GET /me/stories/:id d'un autre créateur répond 403 FORBIDDEN", async () => {
    const owner = await createUser(app, { role: 'CREATOR' });
    const intruder = await createUser(app, { role: 'CREATOR' });
    const story = await createStory(owner.token);

    const response = await app.inject({
      method: 'GET',
      url: `/me/stories/${story.id}`,
      headers: { authorization: `Bearer ${intruder.token}` },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe('FORBIDDEN');
  });

  it('GET /me/stories/:id avec un id inconnu répond 404 NOT_FOUND', async () => {
    const { token } = await createUser(app, { role: 'CREATOR' });

    const response = await app.inject({
      method: 'GET',
      url: '/me/stories/3fa85f64-5717-4562-b3fc-2c963f66afa6',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe('NOT_FOUND');
  });

  it('GET /me/stories/pas-un-uuid répond 422, jamais 500', async () => {
    const { token } = await createUser(app, { role: 'CREATOR' });

    const response = await app.inject({
      method: 'GET',
      url: '/me/stories/pas-un-uuid',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(422);
  });

  it("GET /me/stories/:id renvoie l'histoire complète avec scènes triées par sortOrder et leurs choix", async () => {
    const { token } = await createUser(app, { role: 'CREATOR' });
    const story = await createStory(token);

    const [statHp] = await db
      .insert(statDefinitions)
      .values({ storyId: story.id, name: 'PV', type: 'number', defaultValue: '10', sortOrder: 0 })
      .returning();

    const [sceneB] = await db
      .insert(scenes)
      .values({ storyId: story.id, title: 'Scène B', text: 'texte B', sortOrder: 1 })
      .returning();
    const [sceneA] = await db
      .insert(scenes)
      .values({ storyId: story.id, title: 'Scène A', text: 'texte A', sortOrder: 0 })
      .returning();

    await db
      .insert(choices)
      .values([
        { fromSceneId: sceneA.id, toSceneId: sceneB.id, label: 'Choix 2', sortOrder: 1 },
        { fromSceneId: sceneA.id, toSceneId: sceneB.id, label: 'Choix 1', sortOrder: 0 },
      ]);

    const response = await app.inject({
      method: 'GET',
      url: `/me/stories/${story.id}`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.stats).toHaveLength(1);
    expect(body.stats[0].id).toBe(statHp.id);
    expect(body.scenes.map((s: { title: string }) => s.title)).toEqual(['Scène A', 'Scène B']);
    expect(body.scenes[0].choices.map((c: { label: string }) => c.label)).toEqual(['Choix 1', 'Choix 2']);
    expect(body.scenes[1].choices).toEqual([]);
    expect(body.enemies).toEqual([]);
    expect(body.items).toEqual([]);
  });

  it('GET /me/stories/:id trie les ennemis par sortOrder puis id', async () => {
    const { token } = await createUser(app, { role: 'CREATOR' });
    const story = await createStory(token);

    await db.insert(enemies).values({ storyId: story.id, name: 'Zombie', attack: 3, hp: 8, sortOrder: 1 });
    await db.insert(enemies).values({ storyId: story.id, name: 'Araignée', attack: 1, hp: 4, sortOrder: 0 });

    const response = await app.inject({
      method: 'GET',
      url: `/me/stories/${story.id}`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().enemies.map((e: { name: string }) => e.name)).toEqual(['Araignée', 'Zombie']);
  });

  it("GET /me/stories/:id expose les nouveaux champs d'un ennemi", async () => {
    const { token } = await createUser(app, { role: 'CREATOR' });
    const story = await createStory(token);

    await db.insert(enemies).values({
      storyId: story.id,
      name: 'Goule',
      attack: 5,
      hp: 8,
      shield: 2,
      extraStats: [{ name: 'Élément', value: 'Ténèbres' }],
      defeatEffects: [{ type: 'item', itemId: '3fa85f64-5717-4562-b3fc-2c963f66afa6', qty: 1 }],
      sortOrder: 0,
    });

    const response = await app.inject({
      method: 'GET',
      url: `/me/stories/${story.id}`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    const [enemy] = response.json().enemies;
    expect(enemy.shield).toBe(2);
    expect(enemy.extraStats).toEqual([{ name: 'Élément', value: 'Ténèbres' }]);
    expect(enemy.defeatEffects).toEqual([{ type: 'item', itemId: '3fa85f64-5717-4562-b3fc-2c963f66afa6', qty: 1 }]);
    expect(enemy.sortOrder).toBe(0);
  });

  it('PATCH /me/stories/:id modifie les champs fournis', async () => {
    const { token } = await createUser(app, { role: 'CREATOR' });
    const story = await createStory(token);

    const response = await app.inject({
      method: 'PATCH',
      url: `/me/stories/${story.id}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { title: 'Titre modifié', summary: 'Nouveau résumé' },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.title).toBe('Titre modifié');
    expect(body.summary).toBe('Nouveau résumé');
    expect(body.genre).toBe('Fantastique');
  });

  it('PATCH /me/stories/:id avec un startSceneId d’une autre histoire répond 422 INVALID_REFERENCE', async () => {
    const { token } = await createUser(app, { role: 'CREATOR' });
    const story = await createStory(token);
    const otherStory = await createStory(token, { title: 'Autre histoire' });

    const [foreignScene] = await db
      .insert(scenes)
      .values({ storyId: otherStory.id, title: 'Scène étrangère', text: 'texte' })
      .returning();

    const response = await app.inject({
      method: 'PATCH',
      url: `/me/stories/${story.id}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { startSceneId: foreignScene.id },
    });

    expect(response.statusCode).toBe(422);
    expect(response.json().error.code).toBe('INVALID_REFERENCE');
    expect(response.json().error.field).toBe('startSceneId');
  });

  it('PATCH /me/stories/:id avec une stat de type text en attackStatId répond 422 INVALID_REFERENCE', async () => {
    const { token } = await createUser(app, { role: 'CREATOR' });
    const story = await createStory(token);

    const [textStat] = await db
      .insert(statDefinitions)
      .values({ storyId: story.id, name: 'Nom du héros', type: 'text', defaultValue: 'Anonyme' })
      .returning();

    const response = await app.inject({
      method: 'PATCH',
      url: `/me/stories/${story.id}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { attackStatId: textStat.id },
    });

    expect(response.statusCode).toBe(422);
    expect(response.json().error.code).toBe('INVALID_REFERENCE');
    expect(response.json().error.field).toBe('attackStatId');
  });

  it('PATCH /me/stories/:id avec une stat de type text en hpStatId répond 422 INVALID_REFERENCE', async () => {
    const { token } = await createUser(app, { role: 'CREATOR' });
    const story = await createStory(token);

    const [textStat] = await db
      .insert(statDefinitions)
      .values({ storyId: story.id, name: 'Nom du héros', type: 'text', defaultValue: 'Anonyme' })
      .returning();

    const response = await app.inject({
      method: 'PATCH',
      url: `/me/stories/${story.id}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { hpStatId: textStat.id },
    });

    expect(response.statusCode).toBe(422);
    expect(response.json().error.code).toBe('INVALID_REFERENCE');
    expect(response.json().error.field).toBe('hpStatId');
  });

  it('PATCH /me/stories/:id accepte coverUrl: null pour retirer la couverture', async () => {
    const { token } = await createUser(app, { role: 'CREATOR' });
    const story = await createStory(token, { coverUrl: '/uploads/cover.jpg' });

    const response = await app.inject({
      method: 'PATCH',
      url: `/me/stories/${story.id}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { coverUrl: null },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().coverUrl).toBeNull();
  });

  it('PATCH /me/stories/:id accepte null pour désaffecter une référence', async () => {
    const { token } = await createUser(app, { role: 'CREATOR' });
    const story = await createStory(token);

    const [numberStat] = await db
      .insert(statDefinitions)
      .values({ storyId: story.id, name: 'Force', type: 'number', defaultValue: '5' })
      .returning();

    await app.inject({
      method: 'PATCH',
      url: `/me/stories/${story.id}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { attackStatId: numberStat.id },
    });

    const response = await app.inject({
      method: 'PATCH',
      url: `/me/stories/${story.id}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { attackStatId: null },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().attackStatId).toBeNull();
  });

  it('PATCH /me/stories/:id { hasCombat: true } passe l’histoire en combat', async () => {
    const { token } = await createUser(app, { role: 'CREATOR' });
    const story = await createStory(token);

    const response = await app.inject({
      method: 'PATCH',
      url: `/me/stories/${story.id}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { hasCombat: true },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().hasCombat).toBe(true);
  });

  it('PATCH /me/stories/:id { hasCombat: false } répond 422 HAS_COMBAT_SCENES si une scène a un ennemi', async () => {
    const { token } = await createUser(app, { role: 'CREATOR' });
    const story = await createStory(token, { hasCombat: true });
    const [enemy] = await db
      .insert(enemies)
      .values({ storyId: story.id, name: 'Gobelin', attack: 2, hp: 5 })
      .returning();
    const [scene] = await db
      .insert(scenes)
      .values({ storyId: story.id, title: 'Combat', text: 'texte', enemyId: enemy.id })
      .returning();

    const response = await app.inject({
      method: 'PATCH',
      url: `/me/stories/${story.id}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { hasCombat: false },
    });

    expect(response.statusCode).toBe(422);
    expect(response.json().error.code).toBe('HAS_COMBAT_SCENES');
    expect(response.json().error.sceneIds).toEqual([scene.id]);
  });

  it('PATCH /me/stories/:id { hasCombat: false } répond 200 sans scène à ennemi', async () => {
    const { token } = await createUser(app, { role: 'CREATOR' });
    const story = await createStory(token, { hasCombat: true });

    const response = await app.inject({
      method: 'PATCH',
      url: `/me/stories/${story.id}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { hasCombat: false },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().hasCombat).toBe(false);
  });

  it('DELETE /me/stories/:id supprime l’histoire', async () => {
    const { token } = await createUser(app, { role: 'CREATOR' });
    const story = await createStory(token);

    const response = await app.inject({
      method: 'DELETE',
      url: `/me/stories/${story.id}`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(204);

    const getResponse = await app.inject({
      method: 'GET',
      url: `/me/stories/${story.id}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(getResponse.statusCode).toBe(404);
  });

  it('PATCH /me/stories/:id sur une histoire publiée répond 409 STORY_PUBLISHED', async () => {
    const { token } = await createUser(app, { role: 'CREATOR' });
    const story = await createStory(token);
    await db.update(stories).set({ published: true }).where(eq(stories.id, story.id));

    const response = await app.inject({
      method: 'PATCH',
      url: `/me/stories/${story.id}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { title: 'Interdit' },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().error.code).toBe('STORY_PUBLISHED');
  });

  it('DELETE /me/stories/:id sur une histoire publiée répond 409 STORY_PUBLISHED', async () => {
    const { token } = await createUser(app, { role: 'CREATOR' });
    const story = await createStory(token);
    await db.update(stories).set({ published: true }).where(eq(stories.id, story.id));

    const response = await app.inject({
      method: 'DELETE',
      url: `/me/stories/${story.id}`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().error.code).toBe('STORY_PUBLISHED');
  });

  it('GET /docs/json expose les routes /me/stories et /me/stories/{id}', async () => {
    const response = await app.inject({ method: 'GET', url: '/docs/json' });

    expect(response.statusCode).toBe(200);
    const paths = Object.keys(response.json().paths);
    expect(paths).toContain('/me/stories');
    expect(paths).toContain('/me/stories/{id}');
  });
});
