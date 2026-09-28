import { and, eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp, type App } from '../src/app.js';
import { db } from '../src/db/index.js';
import { choices, items, scenes, statDefinitions, stories } from '../src/db/schema/index.js';
import { runSeed } from '../src/db/seed.js';

describe('module jeu (/play, /me/saves)', () => {
  let app: App;
  let token: string;
  let storyId: string;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
    await app.ready();
  });

  beforeEach(async () => {
    await runSeed();

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'joueur@demo.fr', password: 'demo1234' },
    });
    token = response.json().token;

    const [crypt] = await db.select().from(stories).where(eq(stories.published, true));
    storyId = crypt.id;
  });

  async function getScene(title: string) {
    const [scene] = await db.select().from(scenes).where(and(eq(scenes.storyId, storyId), eq(scenes.title, title)));
    return scene;
  }

  async function getChoice(sceneId: string, label: string) {
    const [choice] = await db.select().from(choices).where(and(eq(choices.fromSceneId, sceneId), eq(choices.label, label)));
    return choice;
  }

  async function getStat(name: string) {
    const [stat] = await db.select().from(statDefinitions).where(and(eq(statDefinitions.storyId, storyId), eq(statDefinitions.name, name)));
    return stat;
  }

  async function getItem(name: string) {
    const [item] = await db.select().from(items).where(and(eq(items.storyId, storyId), eq(items.name, name)));
    return item;
  }

  function authHeaders() {
    return { authorization: `Bearer ${token}` };
  }

  function start(payload: Record<string, unknown> = {}) {
    return app.inject({ method: 'POST', url: `/play/${storyId}/start`, headers: authHeaders(), payload });
  }

  function choose(choiceId: string) {
    return app.inject({ method: 'POST', url: `/play/${storyId}/choose`, headers: authHeaders(), payload: { choiceId } });
  }

  function getState() {
    return app.inject({ method: 'GET', url: `/play/${storyId}`, headers: authHeaders() });
  }

  it("start place le joueur sur la scène d'entrée avec la potion et heroFaceUrl à null par défaut", async () => {
    const response = await start();

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.status).toBe('IN_PROGRESS');
    expect(body.scene.title).toBe('Entrée de la crypte');
    expect(body.heroFaceUrl).toBeNull();
    expect(body.combat).toBeNull();

    const potion = await getItem('Potion de soin');
    const inventoryEntry = body.inventory.find((i: { id: string }) => i.id === potion.id);
    expect(inventoryEntry).toMatchObject({ qty: 1, usable: true });
    expect(body.changes).toEqual([{ label: '+1 Potion de soin', kind: 'item', delta: 1 }]);

    const pv = await getStat('PV');
    expect(body.hpStatId).toBe(pv.id);
    const pvStat = body.stats.find((s: { id: string }) => s.id === pv.id);
    expect(pvStat).toMatchObject({ min: 0, max: 20 });
  });

  it('textStats initialise une stat de type texte (Nom)', async () => {
    const nomStat = await getStat('Nom');

    const response = await start({ textStats: { [nomStat.id]: 'Aragorn' } });

    expect(response.statusCode).toBe(200);
    const stat = response.json().stats.find((s: { id: string }) => s.id === nomStat.id);
    expect(stat.value).toBe('Aragorn');
  });

  it('un choix avec effet Force +1 modifie les stats, et le choix conditionné à Force 7 reste verrouillé', async () => {
    await start();
    const entree = await getScene('Entrée de la crypte');
    const sword = await getChoice(entree.id, "Arracher l'épée rouillée des mains de la statue du roi");

    const afterSword = await choose(sword.id);
    expect(afterSword.statusCode).toBe(200);
    expect(afterSword.json().changes).toEqual([{ label: 'Force 5 → 6', kind: 'stat', delta: 1 }]);
    expect(afterSword.json().scene.title).toBe('Le couloir des échos');

    const couloir = await getScene('Le couloir des échos');
    const lockedChoice = await getChoice(couloir.id, 'Forcer le passage écroulé à mains nues');
    const body = afterSword.json();
    const lockedDto = body.choices.find((c: { id: string }) => c.id === lockedChoice.id);
    expect(lockedDto).toMatchObject({ locked: true, conditionLabel: 'Force 7 requise' });

    const lockedAttempt = await choose(lockedChoice.id);
    expect(lockedAttempt.statusCode).toBe(422);
    expect(lockedAttempt.json().error.code).toBe('CHOICE_LOCKED');

    // Un choix qui part de la scène d'entrée n'est plus valable depuis le couloir.
    const foreignChoice = await getChoice(entree.id, 'Ignorer la statue et descendre directement l’escalier'.replace('’', "'"));
    const invalidAttempt = await choose(foreignChoice.id);
    expect(invalidAttempt.statusCode).toBe(422);
    expect(invalidAttempt.json().error.code).toBe('INVALID_CHOICE');
  });

  it("l'arrivée sur la scène de combat initialise le combat et vide les choix, choisir échoue alors en IN_COMBAT", async () => {
    await start();
    const entree = await getScene('Entrée de la crypte');
    const ignore = await getChoice(entree.id, 'Ignorer la statue et descendre directement l’escalier'.replace('’', "'"));
    await choose(ignore.id);

    const couloir = await getScene('Le couloir des échos');
    const toFight = await getChoice(couloir.id, "Poursuivre vers le grondement, l'arme au poing");
    const response = await choose(toFight.id);

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.scene.title).toBe('Antichambre de la Goule');
    expect(body.choices).toEqual([]);
    expect(body.combat).toMatchObject({ enemyHp: 8, enemyShield: 2, heroHp: 12, log: [] });
    expect(body.combat.enemy).toMatchObject({ name: 'Goule', attack: 5, hpMax: 8, shieldMax: 2 });

    const anyChoice = await getChoice(couloir.id, "Poursuivre vers le grondement, l'arme au poing");
    const duringCombat = await choose(anyChoice.id);
    expect(duringCombat.statusCode).toBe(422);
    expect(duringCombat.json().error.code).toBe('IN_COMBAT');
  });

  it("revenir sur une scène déjà visitée ne réapplique pas ses onEnterEffects", async () => {
    await start();
    const entree = await getScene('Entrée de la crypte');
    const couloir = await getScene('Le couloir des échos');
    const ignore = await getChoice(entree.id, 'Ignorer la statue et descendre directement l’escalier'.replace('’', "'"));
    await choose(ignore.id);

    const [backToEntree] = await db
      .insert(choices)
      .values({ fromSceneId: couloir.id, toSceneId: entree.id, label: 'Retour test', condition: null, effects: [] })
      .returning();

    const response = await choose(backToEntree.id);

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.scene.title).toBe('Entrée de la crypte');
    expect(body.changes).toEqual([]);
    const potion = await getItem('Potion de soin');
    const inventoryEntry = body.inventory.find((i: { id: string }) => i.id === potion.id);
    expect(inventoryEntry.qty).toBe(1);
  });

  it('atteindre une fin passe la partie en FINISHED, puis choisir échoue en GAME_OVER', async () => {
    await start();
    const entree = await getScene('Entrée de la crypte');
    const passageSecret = await getScene('La fuite par le passage secret');

    const [toEnding] = await db
      .insert(choices)
      .values({ fromSceneId: entree.id, toSceneId: passageSecret.id, label: 'Fin test', condition: null, effects: [] })
      .returning();

    const response = await choose(toEnding.id);
    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe('FINISHED');
    expect(response.json().choices).toEqual([]);

    const again = await choose(toEnding.id);
    expect(again.statusCode).toBe(422);
    expect(again.json().error.code).toBe('GAME_OVER');
  });

  it('un effet mortel passe la partie en DEAD sans déplacer le joueur', async () => {
    await start();
    const entree = await getScene('Entrée de la crypte');
    const couloir = await getScene('Le couloir des échos');
    const pv = await getStat('PV');

    const [deadly] = await db
      .insert(choices)
      .values({
        fromSceneId: entree.id,
        toSceneId: couloir.id,
        label: 'Piège mortel test',
        condition: null,
        effects: [{ type: 'stat', statId: pv.id, delta: -99 }],
      })
      .returning();

    const response = await choose(deadly.id);

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.status).toBe('DEAD');
    expect(body.scene.title).toBe('Entrée de la crypte');
    expect(body.changes).toEqual([{ label: 'PV 12 → 0', kind: 'stat', delta: -12 }]);
  });

  it('un nouveau start réinitialise une partie existante', async () => {
    await start();
    const entree = await getScene('Entrée de la crypte');
    const sword = await getChoice(entree.id, "Arracher l'épée rouillée des mains de la statue du roi");
    await choose(sword.id);

    const response = await start();

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.scene.title).toBe('Entrée de la crypte');
    const force = await getStat('Force');
    expect(body.stats.find((s: { id: string }) => s.id === force.id).value).toBe(5);
  });

  it('DELETE puis GET répondent 404 NO_SAVE', async () => {
    await start();

    const deleteResponse = await app.inject({ method: 'DELETE', url: `/play/${storyId}`, headers: authHeaders() });
    expect(deleteResponse.statusCode).toBe(204);

    const getResponse = await getState();
    expect(getResponse.statusCode).toBe(404);
    expect(getResponse.json().error.code).toBe('NO_SAVE');
  });

  it('GET /play/:storyId sans partie répond 404 NO_SAVE', async () => {
    const response = await getState();
    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe('NO_SAVE');
  });

  it('DELETE sans partie répond 404 NO_SAVE', async () => {
    const response = await app.inject({ method: 'DELETE', url: `/play/${storyId}`, headers: authHeaders() });
    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe('NO_SAVE');
  });

  it('GET /me/saves liste mes parties sur des histoires publiées', async () => {
    await start();

    const response = await app.inject({ method: 'GET', url: '/me/saves', headers: authHeaders() });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({ story: { id: storyId, title: 'La Crypte du Roi Oublié' }, status: 'IN_PROGRESS' });
    expect(body[0].updatedAt).toEqual(expect.any(String));
  });
});
