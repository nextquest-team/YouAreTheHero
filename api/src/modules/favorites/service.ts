import { and, desc, eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { favorites, stories, users } from '../../db/schema/index.js';
import { notFound } from '../../lib/errors.js';
import type { StoryCardDto } from '../catalog/schemas.js';
import { storyRowColumns, toCards } from '../catalog/service.js';

async function assertPublished(storyId: string): Promise<void> {
  const [story] = await db
    .select({ id: stories.id })
    .from(stories)
    .where(and(eq(stories.id, storyId), eq(stories.published, true)));
  if (!story) {
    throw notFound();
  }
}

export async function add(userId: string, storyId: string): Promise<void> {
  await assertPublished(storyId);
  await db.insert(favorites).values({ userId, storyId }).onConflictDoNothing();
}

export async function remove(userId: string, storyId: string): Promise<void> {
  await assertPublished(storyId);
  await db.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.storyId, storyId)));
}

/** Mes favoris encore publiés, le plus récemment ajouté en premier. */
export async function listMine(userId: string): Promise<StoryCardDto[]> {
  const rows = await db
    .select(storyRowColumns)
    .from(favorites)
    .innerJoin(stories, eq(favorites.storyId, stories.id))
    .innerJoin(users, eq(stories.authorId, users.id))
    .where(and(eq(favorites.userId, userId), eq(stories.published, true)))
    .orderBy(desc(favorites.createdAt));

  return toCards(rows, userId);
}
