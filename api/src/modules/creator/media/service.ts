import { and, desc, eq } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { enemies, items, media, scenes, stories } from '../../../db/schema/index.js';
import { conflict, forbidden, notFound } from '../../../lib/errors.js';
import { removeUploadedFile } from '../../../lib/uploads.js';
import type { MediaDto, MediaUsage } from './schemas.js';

type Media = typeof media.$inferSelect;

function toDto(row: Media): MediaDto {
  return {
    id: row.id,
    url: row.url,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listMine(userId: string): Promise<MediaDto[]> {
  const rows = await db.select().from(media).where(eq(media.ownerId, userId)).orderBy(desc(media.createdAt));
  return rows.map(toDto);
}

export async function create(userId: string, url: string): Promise<MediaDto> {
  const [created] = await db.insert(media).values({ ownerId: userId, url }).returning();
  return toDto(created);
}

/** Charge l'image et vérifie qu'elle appartient à `userId` (404 si absente, 403 si autre créateur). */
export async function assertMediaOwner(mediaId: string, userId: string): Promise<Media> {
  const [row] = await db.select().from(media).where(eq(media.id, mediaId));
  if (!row) {
    throw notFound();
  }
  if (row.ownerId !== userId) {
    throw forbidden();
  }
  return row;
}

/** Cherche l'image dans les histoires du créateur : couverture, décor de scène, ennemi, objet. */
async function findUsages(userId: string, url: string): Promise<MediaUsage[]> {
  const [storyRows, sceneRows, enemyRows, itemRows] = await Promise.all([
    db
      .select({ id: stories.id, storyId: stories.id, label: stories.title })
      .from(stories)
      .where(and(eq(stories.authorId, userId), eq(stories.coverUrl, url))),
    db
      .select({ id: scenes.id, storyId: scenes.storyId, label: scenes.title })
      .from(scenes)
      .innerJoin(stories, eq(scenes.storyId, stories.id))
      .where(and(eq(stories.authorId, userId), eq(scenes.backgroundUrl, url))),
    db
      .select({ id: enemies.id, storyId: enemies.storyId, label: enemies.name })
      .from(enemies)
      .innerJoin(stories, eq(enemies.storyId, stories.id))
      .where(and(eq(stories.authorId, userId), eq(enemies.imageUrl, url))),
    db
      .select({ id: items.id, storyId: items.storyId, label: items.name })
      .from(items)
      .innerJoin(stories, eq(items.storyId, stories.id))
      .where(and(eq(stories.authorId, userId), eq(items.imageUrl, url))),
  ]);

  return [
    ...storyRows.map((row) => ({ kind: 'story' as const, ...row })),
    ...sceneRows.map((row) => ({ kind: 'scene' as const, ...row })),
    ...enemyRows.map((row) => ({ kind: 'enemy' as const, ...row })),
    ...itemRows.map((row) => ({ kind: 'item' as const, ...row })),
  ];
}

/** 409 IMAGE_IN_USE { usedIn } tant que l'image illustre encore quelque chose, sinon supprime ligne et fichier. */
export async function remove(row: Media): Promise<void> {
  const usedIn = await findUsages(row.ownerId, row.url);
  if (usedIn.length > 0) {
    throw conflict('IMAGE_IN_USE', "L'image est encore utilisée dans une de tes histoires", { usedIn });
  }
  await db.delete(media).where(eq(media.id, row.id));
  await removeUploadedFile(row.url);
}
