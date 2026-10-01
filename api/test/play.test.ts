import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp, type App } from '../src/app.js';
import { db } from '../src/db/index.js';
import { choices, items, scenes, statDefinitions, stories } from '../src/db/schema/index.js';
import { runSeed } from '../src/db/seed.js';
import { createUser } from './helpers/auth.js';

/** Un dé truqué qui rejoue la même séquence de valeurs, en boucle (voir engine-combat.test.ts). */
function fixedRolls(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

// Force du héros (5) + ce jet contre l'attaque de la Goule (5) + ce jet : le héros gagne toujours
// le tour avec ces deux séquences, l'ennemi gagne toujours avec les deux autres.
const HERO_WINS = () => fixedRolls([6, 1]);
const ENEMY_WINS = () => fixedRolls([1, 6]);

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
    // Chaque test choisit son propre dé s'il joue un combat ; par défaut, un vrai dé aléatoire.
    app.roll = () => Math.floor(Math.random() * 6) + 1;

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

  function attack() {
    return app.inject({ method: 'POST', url: `/play/${storyId}/combat`, headers: authHeaders(), payload: { action: 'attack' } });
  }

  function useItem(itemId: string) {
    return app.inject({ method: 'POST', url: `/play/${storyId}/use`, headers: authHeaders(), payload: { itemId } });
  }

  function updateHero(heroFaceUrl: string | null) {
    return app.inject({ method: 'PATCH', url: `/play/${storyId}/hero`, headers: authHeaders(), payload: { heroFaceUrl } });
  }

  /** Démarre une partie et rejoint l'antichambre de la Goule, où le combat s'initialise. */
  async function reachCombat() {
    await start();
    const entree = await getScene('Entrée de la crypte');
    const ignore = await getChoice(entree.id, "Ignorer la statue et descendre directement l'escalier");
    await choose(ignore.id);
    const couloir = await getScene('Le couloir des échos');
    const toFight = await getChoice(couloir.id, "Poursuivre vers le grondement, l'arme au poing");
    return choose(toFight.id);
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

  it('textStats de plus de 50 caractères répond 422', async () => {
    const nomStat = await getStat('Nom');

    const response = await start({ textStats: { [nomStat.id]: 'A'.repeat(51) } });

    expect(response.statusCode).toBe(422);
  });

  it('start sur une histoire non publiée répond 404', async () => {
    const [draft] = await db.select().from(stories).where(eq(stories.published, false));

    const response = await app.inject({
      method: 'POST',
      url: `/play/${draft.id}/start`,
      headers: authHeaders(),
      payload: {},
    });

    expect(response.statusCode).toBe(404);
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
    expect(lockedDto).toMatchObject({ locked: true, conditionLabel: 'Force ≥ 7' });

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

  describe('combat', () => {
    it('POST /combat hors combat répond 422 NOT_IN_COMBAT', async () => {
      await start();

      const response = await attack();

      expect(response.statusCode).toBe(422);
      expect(response.json().error.code).toBe('NOT_IN_COMBAT');
    });

    it('un combat gagné applique le butin dans changes et l’inventaire, puis mène à la scène de victoire', async () => {
      const entering = await reachCombat();
      expect(entering.json().combat).toMatchObject({ enemyHp: 8, enemyShield: 2 });

      app.roll = HERO_WINS();

      // Bouclier 2 : le premier coup l'absorbe entièrement, puis 4 coups de 2 PV vident les 8 PV.
      let response = await attack();
      for (let i = 0; i < 4; i += 1) {
        expect(response.statusCode).toBe(200);
        expect(response.json().status).toBe('IN_PROGRESS');
        response = await attack();
      }

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.status).toBe('IN_PROGRESS');
      expect(body.scene.title).toBe('Le repaire vidé');
      expect(body.combat).toBeNull();

      const cle = await getItem('Clé rouillée');
      expect(body.changes).toContainEqual({ label: '+1 Clé rouillée', kind: 'item', delta: 1 });
      const inventoryEntry = body.inventory.find((i: { id: string }) => i.id === cle.id);
      expect(inventoryEntry).toMatchObject({ qty: 1 });

      // La clé n'a pas de use_effects : elle n'est pas utilisable.
      const useResponse = await useItem(cle.id);
      expect(useResponse.statusCode).toBe(422);
      expect(useResponse.json().error.code).toBe('ITEM_NOT_USABLE');
    });

    it('une défaite avec scène de défaite garde le héros à 1 PV', async () => {
      await reachCombat();
      app.roll = ENEMY_WINS();

      // PV 12, 2 perdus par coup : 6 coups pour tomber à 0.
      let response = await attack();
      for (let i = 0; i < 5; i += 1) {
        expect(response.statusCode).toBe(200);
        expect(response.json().status).toBe('IN_PROGRESS');
        response = await attack();
      }

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.status).toBe('FINISHED');
      expect(body.scene.title).toBe('Vaincu par la Goule');
      expect(body.combat).toBeNull();
      const pv = await getStat('PV');
      expect(body.stats.find((s: { id: string }) => s.id === pv.id).value).toBe(1);
    });

    it('une défaite sans scène de défaite passe la partie en DEAD', async () => {
      await start();
      const couloir = await getScene('Le couloir des échos');
      const antichambre = await getScene('Antichambre de la Goule');

      const [arene] = await db
        .insert(scenes)
        .values({
          storyId,
          title: 'Arène sans pitié',
          text: 'Scène de test sans scène de défaite.',
          isEnding: false,
          enemyId: antichambre.enemyId,
          onEnterEffects: [],
        })
        .returning();
      const [toArene] = await db
        .insert(choices)
        .values({ fromSceneId: couloir.id, toSceneId: arene.id, label: 'Vers une arène sans pitié', condition: null, effects: [] })
        .returning();

      const entree = await getScene('Entrée de la crypte');
      const toIgnore = await getChoice(entree.id, "Ignorer la statue et descendre directement l'escalier");
      await choose(toIgnore.id);
      await choose(toArene.id);

      app.roll = ENEMY_WINS();
      let response = await attack();
      for (let i = 0; i < 5; i += 1) {
        expect(response.statusCode).toBe(200);
        response = await attack();
      }

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.status).toBe('DEAD');
      expect(body.combat).toBeNull();
    });
  });

  describe('utiliser un objet', () => {
    it('hors combat, la potion soigne et se consomme', async () => {
      await start();
      const potion = await getItem('Potion de soin');

      const response = await useItem(potion.id);

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.changes).toContainEqual(expect.objectContaining({ kind: 'stat', delta: 6 }));
      expect(body.changes).toContainEqual({ label: '-1 Potion de soin', kind: 'item', delta: -1 });
      expect(body.inventory.find((i: { id: string }) => i.id === potion.id)).toBeUndefined();
    });

    it('pendant un combat, la potion soigne sans y mettre fin', async () => {
      const entering = await reachCombat();
      expect(entering.json().combat.heroHp).toBe(12);
      app.roll = ENEMY_WINS();
      await attack();
      await attack();

      const potion = await getItem('Potion de soin');
      const response = await useItem(potion.id);

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.status).toBe('IN_PROGRESS');
      expect(body.combat).not.toBeNull();
      expect(body.combat.heroHp).toBe(14);
    });

    it('POST /use répond ITEM_NOT_OWNED puis ITEM_NOT_USABLE', async () => {
      await start();
      const cle = await getItem('Clé rouillée');

      const notOwned = await useItem(cle.id);
      expect(notOwned.statusCode).toBe(422);
      expect(notOwned.json().error.code).toBe('ITEM_NOT_OWNED');
    });
  });

  describe('PATCH /play/:storyId/hero', () => {
    it('met à jour heroFaceUrl et le renvoie dans le GameState', async () => {
      await start();

      const response = await updateHero('/uploads/selfie-test.png');

      expect(response.statusCode).toBe(200);
      expect(response.json().heroFaceUrl).toBe('/uploads/selfie-test.png');

      const reset = await updateHero(null);
      expect(reset.json().heroFaceUrl).toBeNull();
    });

    it('sans partie répond 404 NO_SAVE', async () => {
      const response = await updateHero('/uploads/selfie-test.png');
      expect(response.statusCode).toBe(404);
      expect(response.json().error.code).toBe('NO_SAVE');
    });
  });

  it('les routes de combat, d’usage et de selfie sont réservées aux PLAYER (403 pour un CREATOR)', async () => {
    const { token: creatorToken } = await createUser(app, { role: 'CREATOR' });
    const headers = { authorization: `Bearer ${creatorToken}` };

    const combatResponse = await app.inject({ method: 'POST', url: `/play/${storyId}/combat`, headers, payload: { action: 'attack' } });
    expect(combatResponse.statusCode).toBe(403);

    const useResponse = await app.inject({ method: 'POST', url: `/play/${storyId}/use`, headers, payload: { itemId: randomUUID() } });
    expect(useResponse.statusCode).toBe(403);

    const heroResponse = await app.inject({ method: 'PATCH', url: `/play/${storyId}/hero`, headers, payload: { heroFaceUrl: null } });
    expect(heroResponse.statusCode).toBe(403);
  });
});
