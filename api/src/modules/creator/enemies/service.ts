import { asc, eq, sql } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { enemies, scenes } from '../../../db/schema/index.js';
import { conflict, notFound } from '../../../lib/errors.js';
import { assertOwner, type Story } from '../ownership.js';
import { assertEffectsInStory } from '../references.js';
import type { CreateEnemyBody, EnemyDto, UpdateEnemyBody } from './schemas.js';

export type Enemy = typeof enemies.$inferSelect;

export function toDto(enemy: Enemy): EnemyDto {
  return {
    id: enemy.id,
    name: enemy.name,
    imageUrl: enemy.imageUrl,
    attack: enemy.attack,
    hp: enemy.hp,
    shield: enemy.shield,
    extraStats: enemy.extraStats,
    defeatEffects: enemy.defeatEffects,
    sortOrder: enemy.sortOrder,
  };
}

/** Charge l'ennemi et son histoire : 404 si l'ennemi est absent, 403 si l'histoire est à un autre auteur. */
export async function loadOwned(enemyId: string, userId: string): Promise<{ enemy: Enemy; story: Story }> {
  const [enemy] = await db.select().from(enemies).where(eq(enemies.id, enemyId));
  if (!enemy) {
    throw notFound();
  }
  const story = await assertOwner(enemy.storyId, userId);
  return { enemy, story };
}

export async function create(story: Story, input: CreateEnemyBody): Promise<EnemyDto> {
  await assertEffectsInStory(story.id, input.defeatEffects, 'defeatEffects');

  // Nouvel ennemi en fin de liste.
  const [{ next }] = await db
    .select({ next: sql<number>`coalesce(max(${enemies.sortOrder}) + 1, 0)::int` })
    .from(enemies)
    .where(eq(enemies.storyId, story.id));

  const [created] = await db
    .insert(enemies)
    .values({
      storyId: story.id,
      name: input.name,
      imageUrl: input.imageUrl ?? null,
      attack: input.attack,
      hp: input.hp,
      shield: input.shield,
      extraStats: input.extraStats,
      defeatEffects: input.defeatEffects,
      sortOrder: next,
    })
    .returning();
  return toDto(created);
}

export async function update(enemy: Enemy, input: UpdateEnemyBody): Promise<EnemyDto> {
  if (input.defeatEffects !== undefined) {
    await assertEffectsInStory(enemy.storyId, input.defeatEffects, 'defeatEffects');
  }

  const updates: Partial<typeof enemies.$inferInsert> = {};
  if (input.name !== undefined) {
    updates.name = input.name;
  }
  if (input.imageUrl !== undefined) {
    updates.imageUrl = input.imageUrl;
  }
  if (input.attack !== undefined) {
    updates.attack = input.attack;
  }
  if (input.hp !== undefined) {
    updates.hp = input.hp;
  }
  if (input.shield !== undefined) {
    updates.shield = input.shield;
  }
  if (input.extraStats !== undefined) {
    updates.extraStats = input.extraStats;
  }
  if (input.defeatEffects !== undefined) {
    updates.defeatEffects = input.defeatEffects;
  }

  if (Object.keys(updates).length === 0) {
    return toDto(enemy);
  }

  const [updated] = await db.update(enemies).set(updates).where(eq(enemies.id, enemy.id)).returning();
  return toDto(updated);
}

/**
 * Refusé (409 ENEMY_IN_USE { usedIn }) tant qu'une scène combat cet ennemi : la base remettrait
 * sinon `enemy_id` à NULL en silence, et la scène de combat deviendrait une impasse sans choix.
 */
export async function remove(enemy: Enemy): Promise<void> {
  const rows = await db
    .select({ id: scenes.id, label: scenes.title })
    .from(scenes)
    .where(eq(scenes.enemyId, enemy.id))
    .orderBy(asc(scenes.sortOrder), asc(scenes.id));
  if (rows.length > 0) {
    const usedIn = rows.map((row) => ({ kind: 'scene' as const, storyId: enemy.storyId, ...row }));
    throw conflict('ENEMY_IN_USE', "L'ennemi est encore combattu dans des scènes", { usedIn });
  }
  await db.delete(enemies).where(eq(enemies.id, enemy.id));
}
