import { eq, sql } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { items } from '../../../db/schema/index.js';
import { conflict, notFound } from '../../../lib/errors.js';
import { assertOwner, type Story } from '../ownership.js';
import { assertEffectsInStory } from '../references.js';
import { findReferenceUsages } from '../usages.js';
import type { CreateItemBody, ItemDto, UpdateItemBody } from './schemas.js';

export type Item = typeof items.$inferSelect;

export function toDto(item: Item): ItemDto {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    imageUrl: item.imageUrl,
    useEffects: item.useEffects ?? null,
    sortOrder: item.sortOrder,
  };
}

/** Une description vide revient à ne pas en avoir. */
function normalizeDescription(description: string | null): string | null {
  return description === null || description === '' ? null : description;
}

/** Charge l'objet et son histoire : 404 si l'objet est absent, 403 si l'histoire est à un autre auteur. */
export async function loadOwned(itemId: string, userId: string): Promise<{ item: Item; story: Story }> {
  const [item] = await db.select().from(items).where(eq(items.id, itemId));
  if (!item) {
    throw notFound();
  }
  const story = await assertOwner(item.storyId, userId);
  return { item, story };
}

export async function create(story: Story, input: CreateItemBody): Promise<ItemDto> {
  const useEffects = input.useEffects ?? null;
  if (useEffects !== null) {
    await assertEffectsInStory(story.id, useEffects, 'useEffects');
  }

  // Nouvel objet en fin de liste.
  const [{ next }] = await db
    .select({ next: sql<number>`coalesce(max(${items.sortOrder}) + 1, 0)::int` })
    .from(items)
    .where(eq(items.storyId, story.id));

  const [created] = await db
    .insert(items)
    .values({
      storyId: story.id,
      name: input.name,
      description: normalizeDescription(input.description ?? null),
      imageUrl: input.imageUrl ?? null,
      useEffects,
      sortOrder: next,
    })
    .returning();
  return toDto(created);
}

export async function update(item: Item, input: UpdateItemBody): Promise<ItemDto> {
  if (input.useEffects !== undefined && input.useEffects !== null) {
    await assertEffectsInStory(item.storyId, input.useEffects, 'useEffects');
  }

  const updates: Partial<typeof items.$inferInsert> = {};
  if (input.name !== undefined) {
    updates.name = input.name;
  }
  if (input.description !== undefined) {
    updates.description = normalizeDescription(input.description);
  }
  if (input.imageUrl !== undefined) {
    updates.imageUrl = input.imageUrl;
  }
  if (input.useEffects !== undefined) {
    updates.useEffects = input.useEffects;
  }

  if (Object.keys(updates).length === 0) {
    return toDto(item);
  }

  const [updated] = await db.update(items).set(updates).where(eq(items.id, item.id)).returning();
  return toDto(updated);
}

/**
 * Refusé (409 ITEM_IN_USE { usedIn }) tant que l'objet est cité dans une condition ou un effet :
 * choix, effets d'arrivée des scènes, butin des ennemis, effets d'un autre objet. Ses propres
 * effets d'utilisation ne comptent pas : ils disparaissent avec lui.
 */
export async function remove(item: Item): Promise<void> {
  const usedIn = (await findReferenceUsages(item.storyId, { itemId: item.id })).filter(
    (usage) => !(usage.kind === 'item' && usage.id === item.id),
  );
  if (usedIn.length > 0) {
    throw conflict('ITEM_IN_USE', "L'objet est encore utilisé dans des conditions ou des effets", { usedIn });
  }
  await db.delete(items).where(eq(items.id, item.id));
}
