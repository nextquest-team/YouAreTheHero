import { copyFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { argon2id, hash } from 'argon2';
import { eq, sql } from 'drizzle-orm';
import { env } from '../config/env.js';
import type { Condition, Effect } from '../engine/schemas.js';
import { db, closeDb } from './index.js';
import { choices, enemies, items, scenes, statDefinitions, stories, users } from './schema/index.js';
import { demoUsers, type SeedCondition, type SeedEffect, type SeedStory } from './seed-data.js';
import { seedStories } from './seed-stories/index.js';
import { ALL_TABLES } from './tables.js';

// Type de `tx` tel que fourni par db.transaction(async (tx) => ...) : distinct de `typeof db`
// (il manque $client), donc dérivé directement de la signature plutôt que redéclaré à la main.
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Résolu depuis ce fichier, comme migrate.ts : fonctionne en dev (src/db/seed.ts, seed-assets/ un
// niveau au-dessus) comme compilé dans l'image Docker (dist/db/seed.js, seed-assets/ copié à côté de dist/).
const seedAssetsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../seed-assets');

/** Copie chaque image du seed vers UPLOADS_DIR ; écrase si déjà présente (idempotent). */
async function copySeedAssets(): Promise<void> {
  await mkdir(env.UPLOADS_DIR, { recursive: true });
  const files = await readdir(seedAssetsDir);
  for (const file of files) {
    if (!file.endsWith('.png')) {
      continue;
    }
    await copyFile(path.join(seedAssetsDir, file), path.join(env.UPLOADS_DIR, file));
  }
}

/** Remplace les clés symboliques d'une condition par les vrais uuid insérés en base. */
function resolveCondition(
  condition: SeedCondition | null,
  statIds: Map<string, string>,
  itemIds: Map<string, string>,
): Condition | null {
  if (!condition) {
    return null;
  }
  if (condition.type === 'stat') {
    return { type: 'stat', statId: statIds.get(condition.statKey)!, op: condition.op, value: condition.value };
  }
  return { type: 'item', itemId: itemIds.get(condition.itemKey)!, op: condition.op };
}

/** Remplace les clés symboliques d'une liste d'effets par les vrais uuid insérés en base. */
function resolveEffects(effects: SeedEffect[], statIds: Map<string, string>, itemIds: Map<string, string>): Effect[] {
  return effects.map((effect) =>
    effect.type === 'stat'
      ? { type: 'stat' as const, statId: statIds.get(effect.statKey)!, delta: effect.delta }
      : { type: 'item' as const, itemId: itemIds.get(effect.itemKey)!, qty: effect.qty },
  );
}

/**
 * Insère une histoire complète pour `authorId`. Ordre imposé par les références des JSON
 * condition/effets : stats puis objets puis ennemi (leurs id doivent exister avant les scènes),
 * puis les scènes sans win/lose (elles se référencent entre elles), puis la mise à jour de
 * win/lose et des id de l'histoire, et enfin les choix.
 */
async function seedStory(tx: Tx, authorId: string, story: SeedStory): Promise<void> {
  const [createdStory] = await tx
    .insert(stories)
    .values({
      authorId,
      title: story.title,
      summary: story.summary,
      genre: story.genre,
      coverUrl: story.coverUrl,
      hasCombat: story.hasCombat,
      published: story.published,
      publishedAt: story.published ? new Date() : null,
    })
    .returning();

  const statIds = new Map<string, string>();
  for (const [index, stat] of story.stats.entries()) {
    const [row] = await tx
      .insert(statDefinitions)
      .values({
        storyId: createdStory.id,
        name: stat.name,
        type: stat.type,
        defaultValue: stat.defaultValue,
        min: stat.min,
        max: stat.max,
        sortOrder: index,
      })
      .returning();
    statIds.set(stat.key, row.id);
  }

  const itemIds = new Map<string, string>();
  for (const [index, item] of story.items.entries()) {
    // Les useEffects d'un objet référencent une stat déjà insérée juste au-dessus (ex. Potion -> PV).
    const useEffects = item.useEffects ? resolveEffects(item.useEffects, statIds, itemIds) : null;
    const [row] = await tx
      .insert(items)
      .values({
        storyId: createdStory.id,
        name: item.name,
        description: item.description,
        imageUrl: item.imageUrl,
        useEffects,
        sortOrder: index,
      })
      .returning();
    itemIds.set(item.key, row.id);
  }

  const enemyIds = new Map<string, string>();
  for (const [index, enemy] of story.enemies.entries()) {
    // Le butin (defeatEffects) référence les objets insérés juste au-dessus (ex. Goule -> Clé rouillée).
    const [row] = await tx
      .insert(enemies)
      .values({
        storyId: createdStory.id,
        name: enemy.name,
        imageUrl: enemy.imageUrl,
        attack: enemy.attack,
        hp: enemy.hp,
        shield: enemy.shield,
        extraStats: enemy.extraStats,
        defeatEffects: resolveEffects(enemy.defeatEffects, statIds, itemIds),
        sortOrder: index,
      })
      .returning();
    enemyIds.set(enemy.key, row.id);
  }

  const sceneIds = new Map<string, string>();
  for (const [index, scene] of story.scenes.entries()) {
    const [row] = await tx
      .insert(scenes)
      .values({
        storyId: createdStory.id,
        title: scene.title,
        text: scene.text,
        backgroundUrl: scene.backgroundUrl,
        isEnding: scene.isEnding,
        enemyId: scene.enemyKey ? enemyIds.get(scene.enemyKey)! : null,
        onEnterEffects: resolveEffects(scene.onEnterEffects, statIds, itemIds),
        sortOrder: index,
      })
      .returning();
    sceneIds.set(scene.key, row.id);
  }

  // Deuxième passe : win/lose ne peuvent être posés qu'une fois toutes les scènes créées.
  for (const scene of story.scenes) {
    if (!scene.winSceneKey && !scene.loseSceneKey) {
      continue;
    }
    await tx
      .update(scenes)
      .set({
        winSceneId: scene.winSceneKey ? sceneIds.get(scene.winSceneKey)! : null,
        loseSceneId: scene.loseSceneKey ? sceneIds.get(scene.loseSceneKey)! : null,
      })
      .where(eq(scenes.id, sceneIds.get(scene.key)!));
  }

  await tx
    .update(stories)
    .set({
      startSceneId: story.startSceneKey ? sceneIds.get(story.startSceneKey)! : null,
      attackStatId: story.attackStatKey ? statIds.get(story.attackStatKey)! : null,
      hpStatId: story.hpStatKey ? statIds.get(story.hpStatKey)! : null,
    })
    .where(eq(stories.id, createdStory.id));

  // sortOrder des choix : par scène d'origine, dans l'ordre où ils apparaissent ci-dessus.
  const choiceCounters = new Map<string, number>();
  for (const choice of story.choices) {
    const sortOrder = choiceCounters.get(choice.fromKey) ?? 0;
    choiceCounters.set(choice.fromKey, sortOrder + 1);
    await tx.insert(choices).values({
      fromSceneId: sceneIds.get(choice.fromKey)!,
      toSceneId: sceneIds.get(choice.toKey)!,
      label: choice.label,
      condition: resolveCondition(choice.condition, statIds, itemIds),
      effects: resolveEffects(choice.effects, statIds, itemIds),
      sortOrder,
    });
  }
}

/**
 * Vide toutes les tables puis réinsère le contenu de démo (voir seed-data.ts) : idempotente,
 * relancer ne laisse jamais de doublon. Copie aussi les images de seed-assets/ vers UPLOADS_DIR.
 */
export async function runSeed(): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.execute(sql.raw(`TRUNCATE TABLE ${ALL_TABLES.join(', ')} CASCADE`));

    const userIds = new Map<string, string>();
    for (const demoUser of demoUsers) {
      const passwordHash = await hash(demoUser.password, { type: argon2id });
      const [row] = await tx
        .insert(users)
        .values({ email: demoUser.email, passwordHash, displayName: demoUser.displayName, role: demoUser.role })
        .returning();
      userIds.set(demoUser.email, row.id);
    }

    const authorId = userIds.get('auteur@demo.fr')!;
    for (const story of seedStories) {
      await seedStory(tx, authorId, story);
    }
  });

  await copySeedAssets();
}

async function main(): Promise<void> {
  await runSeed();
  await closeDb();
  console.log('Seed terminé');
}

// N'exécute le seed que si ce fichier est le point d'entrée du process (tsx en dev, node en
// prod) : importer runSeed() depuis un test ne doit pas relancer le CLI.
const isMain = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
