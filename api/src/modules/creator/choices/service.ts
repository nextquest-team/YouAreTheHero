import { eq, sql } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { choices, scenes } from '../../../db/schema/index.js';
import { notFound, unprocessable } from '../../../lib/errors.js';
import { assertInStory, assertOwner, type Story } from '../ownership.js';
import { assertConditionInStory, assertEffectsInStory } from '../references.js';
import type { ChoiceDto, CreateChoiceBody, UpdateChoiceBody } from './schemas.js';

export type Choice = typeof choices.$inferSelect;
type Scene = typeof scenes.$inferSelect;

export function toDto(choice: Choice): ChoiceDto {
  return {
    id: choice.id,
    toSceneId: choice.toSceneId,
    label: choice.label,
    condition: choice.condition ?? null,
    effects: choice.effects,
    sortOrder: choice.sortOrder,
  };
}

/** Charge la scène de départ du choix et son histoire : 404 si la scène est absente, 403 si autre auteur. */
export async function loadOwnedScene(sceneId: string, userId: string): Promise<{ scene: Scene; story: Story }> {
  const [scene] = await db.select().from(scenes).where(eq(scenes.id, sceneId));
  if (!scene) {
    throw notFound();
  }
  const story = await assertOwner(scene.storyId, userId);
  return { scene, story };
}

/** Charge le choix, sa scène et son histoire : 404 si le choix est absent, 403 si autre auteur. */
export async function loadOwned(choiceId: string, userId: string): Promise<{ choice: Choice; story: Story }> {
  const [row] = await db
    .select({ choice: choices, storyId: scenes.storyId })
    .from(choices)
    .innerJoin(scenes, eq(choices.fromSceneId, scenes.id))
    .where(eq(choices.id, choiceId));
  if (!row) {
    throw notFound();
  }
  const story = await assertOwner(row.storyId, userId);
  return { choice: row.choice, story };
}

/** La scène d'arrivée, la condition et les effets citent des entités de CETTE histoire. */
async function validateReferences(storyId: string, input: UpdateChoiceBody): Promise<void> {
  if (input.toSceneId !== undefined) {
    await assertInStory(scenes, input.toSceneId, storyId, 'toSceneId');
  }
  if (input.condition !== undefined && input.condition !== null) {
    await assertConditionInStory(storyId, input.condition, 'condition');
  }
  if (input.effects !== undefined) {
    await assertEffectsInStory(storyId, input.effects, 'effects');
  }
}

export async function create(scene: Scene, input: CreateChoiceBody): Promise<ChoiceDto> {
  // Une scène de combat n'a pas de choix : le joueur part sur winSceneId ou loseSceneId.
  if (scene.enemyId !== null) {
    throw unprocessable('COMBAT_SCENE', "Une scène de combat n'a pas de choix : retire l'ennemi pour en ajouter");
  }
  await validateReferences(scene.storyId, input);

  // Nouveau choix en fin de liste de la scène.
  const [{ next }] = await db
    .select({ next: sql<number>`coalesce(max(${choices.sortOrder}) + 1, 0)::int` })
    .from(choices)
    .where(eq(choices.fromSceneId, scene.id));

  const [created] = await db
    .insert(choices)
    .values({
      fromSceneId: scene.id,
      toSceneId: input.toSceneId,
      label: input.label,
      condition: input.condition ?? null,
      effects: input.effects,
      sortOrder: next,
    })
    .returning();
  return toDto(created);
}

export async function update(choice: Choice, story: Story, input: UpdateChoiceBody): Promise<ChoiceDto> {
  await validateReferences(story.id, input);

  const updates: Partial<typeof choices.$inferInsert> = {};
  if (input.toSceneId !== undefined) {
    updates.toSceneId = input.toSceneId;
  }
  if (input.label !== undefined) {
    updates.label = input.label;
  }
  if (input.condition !== undefined) {
    updates.condition = input.condition;
  }
  if (input.effects !== undefined) {
    updates.effects = input.effects;
  }

  if (Object.keys(updates).length === 0) {
    return toDto(choice);
  }

  const [updated] = await db.update(choices).set(updates).where(eq(choices.id, choice.id)).returning();
  return toDto(updated);
}

export async function remove(choice: Choice): Promise<void> {
  await db.delete(choices).where(eq(choices.id, choice.id));
}
