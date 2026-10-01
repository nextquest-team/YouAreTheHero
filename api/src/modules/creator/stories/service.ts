import { and, asc, desc, eq, inArray, isNotNull } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { choices, enemies, items, scenes, statDefinitions, stories } from '../../../db/schema/index.js';
import { conflict, isUniqueViolation, unprocessable } from '../../../lib/errors.js';
import { collectStoryImages, purgeUnusedImages } from '../../../lib/images.js';
import { toDto as enemyToDto } from '../enemies/service.js';
import { toDto as itemToDto } from '../items/service.js';
import { assertInStory, type Story } from '../ownership.js';
import { toDto as sceneToDto } from '../scenes/service.js';
import { toDto as statToDto } from '../stats/service.js';
import type { CreateStoryBody, PublishResultDto, StoryDto, StoryFullDto, UpdateStoryBody } from './schemas.js';
import { validateStory } from './validation.js';

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

/** L'index unique (auteur, titre sans casse) tranche : on convertit sa violation en 409 TITLE_TAKEN. */
async function withUniqueTitle<T>(write: () => Promise<T>): Promise<T> {
  try {
    return await write();
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw conflict('TITLE_TAKEN', 'Tu as déjà une histoire avec ce titre');
    }
    throw error;
  }
}

export async function listMine(userId: string): Promise<StoryDto[]> {
  const rows = await db.select().from(stories).where(eq(stories.authorId, userId)).orderBy(desc(stories.updatedAt));
  return rows.map(toDto);
}

export async function create(userId: string, input: CreateStoryBody): Promise<StoryDto> {
  const [created] = await withUniqueTitle(() =>
    db
      .insert(stories)
      .values({
        authorId: userId,
        title: input.title,
        summary: input.summary,
        genre: input.genre,
        coverUrl: input.coverUrl ?? null,
        hasCombat: input.hasCombat,
      })
      .returning(),
  );
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
    stats: statRows.map(statToDto),
    enemies: enemyRows.map(enemyToDto),
    items: itemRows.map(itemToDto),
    scenes: sceneRows.map((scene) => sceneToDto(scene, choicesByScene.get(scene.id) ?? [])),
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

  const [updated] = await withUniqueTitle(() =>
    db.update(stories).set(updates).where(eq(stories.id, story.id)).returning(),
  );
  return toDto(updated);
}

/**
 * Supprime l'histoire (scènes, objets, parties... suivent en cascade), puis ses images :
 * couverture, décors, objets, ennemis et visages des héros de ses parties, sauf celles
 * qu'une autre histoire ou un profil utilise encore.
 */
export async function remove(storyId: string): Promise<void> {
  const urls = await collectStoryImages([storyId]);
  await db.delete(stories).where(eq(stories.id, storyId));
  await purgeUnusedImages(urls);
}

/**
 * Publie l'histoire si elle passe la validation : sinon 422 STORY_INVALID avec { errors, warnings }.
 * Les avertissements (scènes inaccessibles) n'empêchent pas la publication et sont renvoyés.
 */
export async function publish(story: Story): Promise<PublishResultDto> {
  const { errors, warnings } = validateStory(await getFull(story));
  if (errors.length > 0) {
    throw unprocessable('STORY_INVALID', "L'histoire ne peut pas encore être publiée", { errors, warnings });
  }
  if (story.published) {
    return { ...toDto(story), warnings };
  }
  const [updated] = await db
    .update(stories)
    .set({ published: true, publishedAt: new Date() })
    .where(eq(stories.id, story.id))
    .returning();
  return { ...toDto(updated), warnings };
}

/** Repasse l'histoire en brouillon pour pouvoir la modifier. Les parties en cours sont conservées. */
export async function unpublish(story: Story): Promise<StoryDto> {
  if (!story.published) {
    return toDto(story);
  }
  const [updated] = await db
    .update(stories)
    .set({ published: false, publishedAt: null })
    .where(eq(stories.id, story.id))
    .returning();
  return toDto(updated);
}
