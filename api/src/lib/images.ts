import { eq, inArray } from 'drizzle-orm';
import { db } from '../db/index.js';
import { enemies, items, media, saves, scenes, stories, users } from '../db/schema/index.js';
import { removeUploadedFile } from './uploads.js';

// Nettoyage des fichiers d'UPLOADS_DIR quand on supprime une histoire ou un compte : une image
// n'est effacée que si plus rien ne la cite en base (une autre histoire, un profil, une partie).

function urlsOf(rows: { url: string | null }[][]): string[] {
  return rows.flat().flatMap((row) => (row.url ? [row.url] : []));
}

/** Images des histoires : couverture, décors, objets, ennemis, et visages des héros de leurs parties. */
export async function collectStoryImages(storyIds: string[]): Promise<string[]> {
  if (storyIds.length === 0) {
    return [];
  }
  return urlsOf(
    await Promise.all([
      db.select({ url: stories.coverUrl }).from(stories).where(inArray(stories.id, storyIds)),
      db.select({ url: scenes.backgroundUrl }).from(scenes).where(inArray(scenes.storyId, storyIds)),
      db.select({ url: items.imageUrl }).from(items).where(inArray(items.storyId, storyIds)),
      db.select({ url: enemies.imageUrl }).from(enemies).where(inArray(enemies.storyId, storyIds)),
      db.select({ url: saves.heroFaceUrl }).from(saves).where(inArray(saves.storyId, storyIds)),
    ]),
  );
}

/** Toutes les images d'un compte : ses histoires, sa médiathèque, son visage de héros et ceux de ses parties. */
export async function collectUserImages(userId: string): Promise<string[]> {
  const storyRows = await db.select({ id: stories.id }).from(stories).where(eq(stories.authorId, userId));
  const [storyUrls, ...own] = await Promise.all([
    collectStoryImages(storyRows.map((row) => row.id)),
    db.select({ url: media.url }).from(media).where(eq(media.ownerId, userId)),
    db.select({ url: users.avatarUrl }).from(users).where(eq(users.id, userId)),
    db.select({ url: saves.heroFaceUrl }).from(saves).where(eq(saves.userId, userId)),
  ]);
  return [...storyUrls, ...urlsOf(own)];
}

async function findUsedUrls(urls: string[]): Promise<Set<string>> {
  const rows = await Promise.all([
    db.select({ url: stories.coverUrl }).from(stories).where(inArray(stories.coverUrl, urls)),
    db.select({ url: scenes.backgroundUrl }).from(scenes).where(inArray(scenes.backgroundUrl, urls)),
    db.select({ url: items.imageUrl }).from(items).where(inArray(items.imageUrl, urls)),
    db.select({ url: enemies.imageUrl }).from(enemies).where(inArray(enemies.imageUrl, urls)),
    db.select({ url: users.avatarUrl }).from(users).where(inArray(users.avatarUrl, urls)),
    db.select({ url: saves.heroFaceUrl }).from(saves).where(inArray(saves.heroFaceUrl, urls)),
  ]);
  return new Set(urlsOf(rows));
}

/**
 * À appeler après la suppression en base : retire de la médiathèque puis du disque chaque image
 * de `urls` que plus rien n'utilise. Les chemins hors /uploads/ sont ignorés.
 */
export async function purgeUnusedImages(urls: string[]): Promise<void> {
  const candidates = [...new Set(urls.filter((url) => url.startsWith('/uploads/')))];
  if (candidates.length === 0) {
    return;
  }
  const used = await findUsedUrls(candidates);
  const unused = candidates.filter((url) => !used.has(url));
  if (unused.length === 0) {
    return;
  }
  await db.delete(media).where(inArray(media.url, unused));
  for (const url of unused) {
    await removeUploadedFile(url);
  }
}
