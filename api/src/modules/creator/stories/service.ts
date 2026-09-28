import { and, asc, desc, eq, inArray, isNotNull } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { choices, enemies, items, scenes, statDefinitions, stories } from '../../../db/schema/index.js';
import { unprocessable } from '../../../lib/errors.js';
import { assertInStory, type Story } from '../ownership.js';
import type { CreateStoryBody, StoryDto, StoryFullDto, UpdateStoryBody } from './schemas.js';

function toDto(story: Story): StoryDto {
  return {
    id: story.id,
    title: story.title,
    summary: story.summary,
    genre: story.genre,
    coverUrl: story.coverUrl,
    hasCombat: story.hasCombat,
    startSceneId: story.startSceneId,
    attackStatId: story.attackStatId,
    hpStatId: story.hpStatId,
    published: story.published,
    publishedAt: story.publishedAt ? story.publishedAt.toISOString() : null,
    createdAt: story.createdAt.toISOString(),
    updatedAt: story.updatedAt.toISOString(),
  };
}

export async function listMine(userId: string): Promise<StoryDto[]> {
  const rows = await db.select().from(stories).where(eq(stories.authorId, userId)).orderBy(desc(stories.updatedAt));
  return rows.map(toDto);
}

export async function create(userId: string, input: CreateStoryBody): Promise<StoryDto> {
  const [created] = await db
    .insert(stories)
    .values({
      authorId: userId,
      title: input.title,
      summary: input.summary,
      genre: input.genre,
      coverUrl: input.coverUrl ?? null,
      hasCombat: input.hasCombat,
    })
    .returning();
  return toDto(created);
}

/**
 * Assemble l'histoire complète par quelques requêtes simples (une par table) plutôt qu'une
 * grosse requête relationnelle : plus facile à recopier pour les autres modules de A.
 */
export async function getFull(story: Story): Promise<StoryFullDto> {
  const [statRows, enemyRows, itemRows, sceneRows] = await Promise.all([
    db
      .select()
      .from(statDefinitions)
      .where(eq(statDefinitions.storyId, story.id))
      .orderBy(asc(statDefinitions.sortOrder), asc(statDefinitions.id)),
    db.select().from(enemies).where(eq(enemies.storyId, story.id)).orderBy(asc(enemies.sortOrder), asc(enemies.id)),
    db.select().from(items).where(eq(items.storyId, story.id)).orderBy(asc(items.sortOrder), asc(items.id)),
    db.select().from(scenes).where(eq(scenes.storyId, story.id)).orderBy(asc(scenes.sortOrder), asc(scenes.id)),
  ]);

  const sceneIds = sceneRows.map((scene) => scene.id);
  const choiceRows =
    sceneIds.length > 0
      ? await db
          .select()
          .from(choices)
          .where(inArray(choices.fromSceneId, sceneIds))
          .orderBy(asc(choices.sortOrder), asc(choices.id))
      : [];

  const choicesByScene = new Map<string, typeof choiceRows>();
  for (const choice of choiceRows) {
    const list = choicesByScene.get(choice.fromSceneId) ?? [];
    list.push(choice);
    choicesByScene.set(choice.fromSceneId, list);
  }

  return {
    ...toDto(story),
    stats: statRows.map((stat) => ({
      id: stat.id,
      name: stat.name,
      type: stat.type,
      defaultValue: stat.defaultValue,
      min: stat.min,
      max: stat.max,
      sortOrder: stat.sortOrder,
    })),
    enemies: enemyRows.map((enemy) => ({
      id: enemy.id,
      name: enemy.name,
      imageUrl: enemy.imageUrl,
      attack: enemy.attack,
      hp: enemy.hp,
      shield: enemy.shield,
      extraStats: enemy.extraStats,
      defeatEffects: enemy.defeatEffects,
      sortOrder: enemy.sortOrder,
    })),
    items: itemRows.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      imageUrl: item.imageUrl,
      useEffects: item.useEffects ?? null,
      sortOrder: item.sortOrder,
    })),
    scenes: sceneRows.map((scene) => ({
      id: scene.id,
      title: scene.title,
      text: scene.text,
      backgroundUrl: scene.backgroundUrl,
      isEnding: scene.isEnding,
      enemyId: scene.enemyId,
      winSceneId: scene.winSceneId,
      loseSceneId: scene.loseSceneId,
      onEnterEffects: scene.onEnterEffects,
      sortOrder: scene.sortOrder,
      choices: (choicesByScene.get(scene.id) ?? []).map((choice) => ({
        id: choice.id,
        toSceneId: choice.toSceneId,
        label: choice.label,
        condition: choice.condition ?? null,
        effects: choice.effects,
        sortOrder: choice.sortOrder,
      })),
    })),
  };
}

/**
 * Un id non nul doit référencer une entité de CETTE histoire ; attackStatId/hpStatId doivent
 * en plus pointer une stat de type `number`. 422 INVALID_REFERENCE avec le champ fautif sinon.
 */
async function validateReferences(storyId: string, input: UpdateStoryBody): Promise<void> {
  if (input.startSceneId !== undefined && input.startSceneId !== null) {
    await assertInStory(scenes, input.startSceneId, storyId, 'startSceneId');
  }

  for (const field of ['attackStatId', 'hpStatId'] as const) {
    const statId = input[field];
    if (statId === undefined || statId === null) {
      continue;
    }
    const stat = await assertInStory(statDefinitions, statId, storyId, field);
    if (stat.type !== 'number') {
      throw unprocessable('INVALID_REFERENCE', 'La stat référencée doit être une stat numérique de cette histoire', {
        field,
      });
    }
  }
}

/** Repasser en sans-combats est refusé tant qu'une scène de l'histoire a encore un ennemi. */
async function validateHasCombat(storyId: string, input: UpdateStoryBody): Promise<void> {
  if (input.hasCombat !== false) {
    return;
  }
  const rows = await db
    .select({ id: scenes.id })
    .from(scenes)
    .where(and(eq(scenes.storyId, storyId), isNotNull(scenes.enemyId)));
  if (rows.length > 0) {
    throw unprocessable('HAS_COMBAT_SCENES', "Des scènes de l'histoire ont encore un ennemi", {
      sceneIds: rows.map((row) => row.id),
    });
  }
}

export async function update(story: Story, input: UpdateStoryBody): Promise<StoryDto> {
  await validateReferences(story.id, input);
  await validateHasCombat(story.id, input);

  const updates: Partial<typeof stories.$inferInsert> = {};
  if (input.title !== undefined) {
    updates.title = input.title;
  }
  if (input.summary !== undefined) {
    updates.summary = input.summary;
  }
  if (input.genre !== undefined) {
    updates.genre = input.genre;
  }
  if (input.coverUrl !== undefined) {
    updates.coverUrl = input.coverUrl;
  }
  if (input.hasCombat !== undefined) {
    updates.hasCombat = input.hasCombat;
  }
  if (input.startSceneId !== undefined) {
    updates.startSceneId = input.startSceneId;
  }
  if (input.attackStatId !== undefined) {
    updates.attackStatId = input.attackStatId;
  }
  if (input.hpStatId !== undefined) {
    updates.hpStatId = input.hpStatId;
  }

  if (Object.keys(updates).length === 0) {
    return toDto(story);
  }

  const [updated] = await db.update(stories).set(updates).where(eq(stories.id, story.id)).returning();
  return toDto(updated);
}

export async function remove(storyId: string): Promise<void> {
  await db.delete(stories).where(eq(stories.id, storyId));
}
