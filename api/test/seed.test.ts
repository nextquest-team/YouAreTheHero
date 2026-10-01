import { existsSync } from 'node:fs';
import path from 'node:path';
import { eq, inArray } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';
import { buildApp, type App } from '../src/app.js';
import { env } from '../src/config/env.js';
import { db } from '../src/db/index.js';
import { choices, enemies, items, scenes, statDefinitions, stories, users } from '../src/db/schema/index.js';
import { runSeed } from '../src/db/seed.js';
import { seedStories } from '../src/db/seed-stories/index.js';
import type { Condition, Effect } from '../src/engine/schemas.js';

describe('seed de démo', () => {
  let app: App;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
    await app.ready();

    // Lancé deux fois de suite : runSeed() doit être idempotente (vide puis réinsère).
    await runSeed();
    await runSeed();
  });

  it('crée exactement 2 utilisateurs et toutes les histoires du seed', async () => {
    const allUsers = await db.select().from(users);
    const allStories = await db.select().from(stories);
    expect(allUsers).toHaveLength(2);
    expect(allStories).toHaveLength(seedStories.length);
  });

  it('permet de se connecter avec le compte joueur de démo', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'joueur@demo.fr', password: 'demo1234' },
    });
    expect(response.statusCode).toBe(200);
  });

  it('permet de se connecter avec le compte auteur de démo', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'auteur@demo.fr', password: 'demo1234' },
    });
    expect(response.statusCode).toBe(200);
  });

  it("copie les images du seed dans UPLOADS_DIR", () => {
    expect(existsSync(path.join(env.UPLOADS_DIR, 'crypte-couverture.png'))).toBe(true);
  });

  it('toute image référencée par le seed existe dans UPLOADS_DIR', () => {
    const urls = seedStories.flatMap((story) => [
      story.coverUrl,
      ...story.scenes.map((s) => s.backgroundUrl),
      ...story.items.map((i) => i.imageUrl),
      ...story.enemies.map((e) => e.imageUrl),
    ]);
    const missing = urls
      .filter((url): url is string => url !== null)
      .filter((url) => !existsSync(path.join(env.UPLOADS_DIR, url.replace('/uploads/', ''))));
    expect(missing).toEqual([]);
  });

  it('le butin de la Goule donne +1 Clé', async () => {
    const [crypt] = await db.select().from(stories).where(eq(stories.title, 'La Crypte du Roi Oublié'));
    const [goule] = await db.select().from(enemies).where(eq(enemies.storyId, crypt.id));
    const cryptItems = await db.select().from(items).where(eq(items.storyId, crypt.id));
    const cle = cryptItems.find((item) => item.name === 'Clé rouillée')!;

    expect(goule.defeatEffects).toEqual([{ type: 'item', itemId: cle.id, qty: 1 }]);
  });

  it("les histoires sans combats n'ont aucune scène avec ennemi", async () => {
    const peacefulStories = await db.select().from(stories).where(eq(stories.hasCombat, false));
    expect(peacefulStories.length).toBe(seedStories.filter((story) => !story.hasCombat).length);

    for (const peaceful of peacefulStories) {
      const peacefulScenes = await db.select().from(scenes).where(eq(scenes.storyId, peaceful.id));
      for (const scene of peacefulScenes) {
        expect(scene.enemyId).toBeNull();
      }
    }
  });

  it('le brouillon du Tombeau passe la validation de publication', async () => {
    const login = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'auteur@demo.fr', password: 'demo1234' },
    });
    const [tomb] = await db.select().from(stories).where(eq(stories.title, 'Le Tombeau de la Reine Grise'));
    expect(tomb.published).toBe(false);

    const response = await app.inject({
      method: 'POST',
      url: `/me/stories/${tomb.id}/publish`,
      headers: { authorization: `Bearer ${login.json().token}` },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().warnings).toEqual([]);

    // Remis en brouillon, comme dans le seed.
    await db.update(stories).set({ published: false, publishedAt: null }).where(eq(stories.id, tomb.id));
  });

  it('toute histoire qui a une scène de combat a hasCombat = true', async () => {
    const allStories = await db.select().from(stories);
    for (const currentStory of allStories) {
      const storyScenes = await db.select().from(scenes).where(eq(scenes.storyId, currentStory.id));
      const hasCombatScene = storyScenes.some((scene) => scene.enemyId !== null);
      if (hasCombatScene) {
        expect(currentStory.hasCombat).toBe(true);
      }
    }
  });

  const publishedTitles = seedStories.filter((story) => story.published).map((story) => story.title);

  describe.each(publishedTitles)("« %s » respecte les règles de validation avant publication (docs/conception.md §4)", (title) => {
    let story: typeof stories.$inferSelect;
    let allStats: (typeof statDefinitions.$inferSelect)[];
    let allItems: (typeof items.$inferSelect)[];
    let allScenes: (typeof scenes.$inferSelect)[];
    let allChoices: (typeof choices.$inferSelect)[];

    beforeAll(async () => {
      [story] = await db.select().from(stories).where(eq(stories.title, title));
      allStats = await db.select().from(statDefinitions).where(eq(statDefinitions.storyId, story.id));
      allItems = await db.select().from(items).where(eq(items.storyId, story.id));
      allScenes = await db.select().from(scenes).where(eq(scenes.storyId, story.id));
      const sceneIds = allScenes.map((scene) => scene.id);
      allChoices =
        sceneIds.length > 0 ? await db.select().from(choices).where(inArray(choices.fromSceneId, sceneIds)) : [];
    });

    it('a une scène de départ définie', () => {
      expect(story.startSceneId).not.toBeNull();
    });

    it('a au moins une scène de fin', () => {
      expect(allScenes.some((scene) => scene.isEnding)).toBe(true);
    });

    it("toute scène qui n'est pas une fin a au moins un choix ou un combat", () => {
      for (const scene of allScenes.filter((scene) => !scene.isEnding)) {
        const hasChoices = allChoices.some((choice) => choice.fromSceneId === scene.id);
        const isCombat = scene.enemyId !== null;
        expect(hasChoices || isCombat).toBe(true);
      }
    });

    it("toute scène de combat a une scène de victoire, et l'histoire a une stat d'attaque et une stat de PV", () => {
      const combatScenes = allScenes.filter((scene) => scene.enemyId !== null);
      if (!story.hasCombat) {
        expect(combatScenes).toHaveLength(0);
        return;
      }
      expect(combatScenes.length).toBeGreaterThan(0);
      for (const scene of combatScenes) {
        expect(scene.winSceneId).not.toBeNull();
      }
      expect(story.attackStatId).not.toBeNull();
      expect(story.hpStatId).not.toBeNull();
    });

    it("toute scène qui n'est ni une fin ni un combat a au moins un choix sans condition", () => {
      for (const scene of allScenes.filter((scene) => !scene.isEnding && scene.enemyId === null)) {
        const sceneChoices = allChoices.filter((choice) => choice.fromSceneId === scene.id);
        expect(sceneChoices.some((choice) => choice.condition === null)).toBe(true);
      }
    });

    it("aucune scène de combat n'a de choix", () => {
      const combatSceneIds = new Set(allScenes.filter((scene) => scene.enemyId !== null).map((scene) => scene.id));
      for (const choice of allChoices) {
        expect(combatSceneIds.has(choice.fromSceneId)).toBe(false);
      }
    });

    it('la stat PV est de type number, avec un min de 0 (ou pas de min) et une valeur par défaut supérieure à 0', () => {
      if (!story.hasCombat) {
        return;
      }
      const hpStat = allStats.find((stat) => stat.id === story.hpStatId);
      expect(hpStat).toBeDefined();
      expect(hpStat!.type).toBe('number');
      expect(hpStat!.min === null || hpStat!.min === 0).toBe(true);
      expect(Number(hpStat!.defaultValue)).toBeGreaterThan(0);
    });

    it("aucune scène de fin n'a d'ennemi", () => {
      for (const scene of allScenes.filter((scene) => scene.isEnding)) {
        expect(scene.enemyId).toBeNull();
      }
    });

    it('tout statId et itemId cité dans une condition ou un effet existe dans l’histoire, et les stats citées sont de type number', () => {
      const statIds = new Set(allStats.map((stat) => stat.id));
      const numberStatIds = new Set(allStats.filter((stat) => stat.type === 'number').map((stat) => stat.id));
      const itemIds = new Set(allItems.map((item) => item.id));

      function checkCondition(condition: Condition | null): void {
        if (!condition) {
          return;
        }
        if (condition.type === 'stat') {
          expect(statIds.has(condition.statId)).toBe(true);
          expect(numberStatIds.has(condition.statId)).toBe(true);
        } else {
          expect(itemIds.has(condition.itemId)).toBe(true);
        }
      }

      function checkEffect(effect: Effect): void {
        if (effect.type === 'stat') {
          expect(statIds.has(effect.statId)).toBe(true);
          expect(numberStatIds.has(effect.statId)).toBe(true);
        } else {
          expect(itemIds.has(effect.itemId)).toBe(true);
        }
      }

      for (const choice of allChoices) {
        checkCondition(choice.condition);
        for (const effect of choice.effects) {
          checkEffect(effect);
        }
      }
      for (const scene of allScenes) {
        for (const effect of scene.onEnterEffects) {
          checkEffect(effect);
        }
      }
      for (const item of allItems) {
        for (const effect of item.useEffects ?? []) {
          checkEffect(effect);
        }
      }
    });

    it("aucune scène n'est inaccessible depuis le départ", () => {
      const adjacency = new Map<string, string[]>();
      for (const scene of allScenes) {
        adjacency.set(scene.id, []);
      }
      for (const choice of allChoices) {
        adjacency.get(choice.fromSceneId)?.push(choice.toSceneId);
      }
      for (const scene of allScenes) {
        if (scene.winSceneId) {
          adjacency.get(scene.id)?.push(scene.winSceneId);
        }
        if (scene.loseSceneId) {
          adjacency.get(scene.id)?.push(scene.loseSceneId);
        }
      }

      const visited = new Set<string>();
      const queue = story.startSceneId ? [story.startSceneId] : [];
      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) {
          continue;
        }
        visited.add(current);
        for (const next of adjacency.get(current) ?? []) {
          queue.push(next);
        }
      }

      expect(visited.size).toBe(allScenes.length);
    });
  });
});
