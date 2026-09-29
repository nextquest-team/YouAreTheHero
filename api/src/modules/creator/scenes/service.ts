import { and, asc, eq, ne, or, sql } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { choices, enemies, scenes, stories } from '../../../db/schema/index.js';
import { conflict, notFound, unprocessable } from '../../../lib/errors.js';
import { toDto as choiceToDto } from '../choices/service.js';
import { assertInStory, assertOwner, type Story } from '../ownership.js';
import { assertEffectsInStory } from '../references.js';
import type { CreateSceneBody, SceneDto, SceneUsage, UpdateSceneBody } from './schemas.js';

export type Scene = typeof scenes.$inferSelect;
type Choice = typeof choices.$inferSelect;

export function toDto(scene: Scene, sceneChoices: Choice[]): SceneDto {
  return {
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
    choices: sceneChoices.map(choiceToDto),
  };
}

function listChoices(sceneId: string): Promise<Choice[]> {
  return db
    .select()
    .from(choices)
    .where(eq(choices.fromSceneId, sceneId))
    .orderBy(asc(choices.sortOrder), asc(choices.id));
}

/** Charge la scène et son histoire : 404 si la scène est absente, 403 si l'histoire est à un autre auteur. */
export async function loadOwned(sceneId: string, userId: string): Promise<{ scene: Scene; story: Story }> {
  const [scene] = await db.select().from(scenes).where(eq(scenes.id, sceneId));
  if (!scene) {
    throw notFound();
  }
  const story = await assertOwner(scene.storyId, userId);
  return { scene, story };
}

type References = Pick<UpdateSceneBody, 'enemyId' | 'winSceneId' | 'loseSceneId' | 'onEnterEffects'>;

/**
 * Chaque id non nul pointe une entité de CETTE histoire (422 INVALID_REFERENCE { field }).
 * Un ennemi n'est accepté que si l'histoire a des combats (422 COMBAT_DISABLED).
 */
async function validateReferences(story: Story, input: References): Promise<void> {
  if (input.enemyId !== undefined && input.enemyId !== null) {
    if (!story.hasCombat) {
      throw unprocessable('COMBAT_DISABLED', "L'histoire est sans combats : active les combats pour ajouter un ennemi", {
        field: 'enemyId',
      });
    }
    await assertInStory(enemies, input.enemyId, story.id, 'enemyId');
  }
  for (const field of ['winSceneId', 'loseSceneId'] as const) {
    const sceneId = input[field];
    if (sceneId !== undefined && sceneId !== null) {
      await assertInStory(scenes, sceneId, story.id, field);
    }
  }
  if (input.onEnterEffects !== undefined) {
    await assertEffectsInStory(story.id, input.onEnterEffects, 'onEnterEffects');
  }
}

export async function create(story: Story, input: CreateSceneBody): Promise<SceneDto> {
  await validateReferences(story, input);

  // Nouvelle scène en fin de liste.
  const [{ next }] = await db
    .select({ next: sql<number>`coalesce(max(${scenes.sortOrder}) + 1, 0)::int` })
    .from(scenes)
    .where(eq(scenes.storyId, story.id));

  const [created] = await db
    .insert(scenes)
    .values({
      storyId: story.id,
      title: input.title,
      text: input.text,
      backgroundUrl: input.backgroundUrl ?? null,
      isEnding: input.isEnding,
      enemyId: input.enemyId ?? null,
      winSceneId: input.winSceneId ?? null,
      loseSceneId: input.loseSceneId ?? null,
      onEnterEffects: input.onEnterEffects,
      sortOrder: next,
    })
    .returning();
  return toDto(created, []);
}

export async function update(scene: Scene, story: Story, input: UpdateSceneBody): Promise<SceneDto> {
  await validateReferences(story, input);

  const sceneChoices = await listChoices(scene.id);
  // Une scène de combat n'a pas de choix : le joueur part sur winSceneId ou loseSceneId.
  if (input.enemyId !== undefined && input.enemyId !== null && sceneChoices.length > 0) {
    throw unprocessable('SCENE_HAS_CHOICES', 'Supprime les choix de la scène avant de lui ajouter un ennemi', {
      field: 'enemyId',
    });
  }

  const updates: Partial<typeof scenes.$inferInsert> = {};
  if (input.title !== undefined) {
    updates.title = input.title;
  }
  if (input.text !== undefined) {
    updates.text = input.text;
  }
  if (input.backgroundUrl !== undefined) {
    updates.backgroundUrl = input.backgroundUrl;
  }
  if (input.isEnding !== undefined) {
    updates.isEnding = input.isEnding;
  }
  if (input.enemyId !== undefined) {
    updates.enemyId = input.enemyId;
  }
  if (input.winSceneId !== undefined) {
    updates.winSceneId = input.winSceneId;
  }
  if (input.loseSceneId !== undefined) {
    updates.loseSceneId = input.loseSceneId;
  }
  if (input.onEnterEffects !== undefined) {
    updates.onEnterEffects = input.onEnterEffects;
  }

  if (Object.keys(updates).length === 0) {
    return toDto(scene, sceneChoices);
  }

  const [updated] = await db.update(scenes).set(updates).where(eq(scenes.id, scene.id)).returning();
  return toDto(updated, sceneChoices);
}

/**
 * Ce qui mène encore à la scène depuis ailleurs : scène de départ de l'histoire, issue de combat
 * d'une autre scène, choix d'une autre scène. Ses propres choix (et une issue de combat qui
 * boucle sur elle-même) ne comptent pas : ils disparaissent avec elle.
 */
async function findUsages(scene: Scene): Promise<SceneUsage[]> {
  const [storyRows, sceneRows, choiceRows] = await Promise.all([
    db
      .select({ id: stories.id, label: stories.title })
      .from(stories)
      .where(eq(stories.startSceneId, scene.id)),
    db
      .select({ id: scenes.id, label: scenes.title })
      .from(scenes)
      .where(
        and(
          eq(scenes.storyId, scene.storyId),
          ne(scenes.id, scene.id),
          or(eq(scenes.winSceneId, scene.id), eq(scenes.loseSceneId, scene.id)),
        ),
      )
      .orderBy(asc(scenes.sortOrder), asc(scenes.id)),
    db
      .select({ id: choices.id, label: choices.label })
      .from(choices)
      .where(and(eq(choices.toSceneId, scene.id), ne(choices.fromSceneId, scene.id)))
      .orderBy(asc(choices.sortOrder), asc(choices.id)),
  ]);

  const storyId = scene.storyId;
  return [
    ...storyRows.map((row) => ({ kind: 'story' as const, storyId, ...row })),
    ...sceneRows.map((row) => ({ kind: 'scene' as const, storyId, ...row })),
    ...choiceRows.map((row) => ({ kind: 'choice' as const, storyId, ...row })),
  ];
}

/**
 * Refusé (409 SCENE_IN_USE { usedIn }) tant que quelque chose mène à la scène : la base
 * supprimerait sinon en silence les choix qui y mènent et viderait startSceneId, winSceneId
 * et loseSceneId. Les choix de la scène elle-même sont supprimés avec elle (cascade).
 */
export async function remove(scene: Scene): Promise<void> {
  const usedIn = await findUsages(scene);
  if (usedIn.length > 0) {
    throw conflict('SCENE_IN_USE', "D'autres éléments de l'histoire mènent encore à cette scène", { usedIn });
  }
  await db.delete(scenes).where(eq(scenes.id, scene.id));
}
