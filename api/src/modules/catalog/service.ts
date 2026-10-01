import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { favorites, reviews, saves, statDefinitions, stories, users } from '../../db/schema/index.js';
import { notFound } from '../../lib/errors.js';
import type { ListStoriesQuery, StoryCardDto, StoryDetailDto } from './schemas.js';

/** Échappe les caractères spéciaux d'un motif ILIKE avant de l'entourer de `%`. */
function escapeLikePattern(value: string): string {
  return value.replace(/[%_\\]/g, (match) => `\\${match}`);
}

type StoryRow = {
  id: string;
  title: string;
  summary: string;
  genre: string;
  coverUrl: string | null;
  hasCombat: boolean;
  authorId: string;
  authorDisplayName: string;
};

async function getAvgRatings(storyIds: string[]): Promise<Map<string, number>> {
  if (storyIds.length === 0) {
    return new Map();
  }
  const rows = await db
    .select({ storyId: reviews.storyId, avg: sql<string>`round(avg(${reviews.rating})::numeric, 1)` })
    .from(reviews)
    .where(inArray(reviews.storyId, storyIds))
    .groupBy(reviews.storyId);
  return new Map(rows.map((row) => [row.storyId, Number(row.avg)]));
}

async function getFavoriteStoryIds(userId: string, storyIds: string[]): Promise<Set<string>> {
  if (storyIds.length === 0) {
    return new Set();
  }
  const rows = await db
    .select({ storyId: favorites.storyId })
    .from(favorites)
    .where(and(eq(favorites.userId, userId), inArray(favorites.storyId, storyIds)));
  return new Set(rows.map((row) => row.storyId));
}

export async function toCards(rows: StoryRow[], userId: string): Promise<StoryCardDto[]> {
  const storyIds = rows.map((row) => row.id);
  const [avgRatings, favoriteIds] = await Promise.all([getAvgRatings(storyIds), getFavoriteStoryIds(userId, storyIds)]);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    summary: row.summary,
    genre: row.genre,
    coverUrl: row.coverUrl,
    hasCombat: row.hasCombat,
    author: { id: row.authorId, displayName: row.authorDisplayName },
    avgRating: avgRatings.get(row.id) ?? null,
    isFavorite: favoriteIds.has(row.id),
  }));
}

export const storyRowColumns = {
  id: stories.id,
  title: stories.title,
  summary: stories.summary,
  genre: stories.genre,
  coverUrl: stories.coverUrl,
  hasCombat: stories.hasCombat,
  authorId: users.id,
  authorDisplayName: users.displayName,
};

export async function listPublished(userId: string, filters: ListStoriesQuery): Promise<StoryCardDto[]> {
  const conditions = [eq(stories.published, true)];

  const q = filters.q?.trim();
  if (q) {
    const pattern = `%${escapeLikePattern(q)}%`;
    conditions.push(sql`(${stories.title} ILIKE ${pattern} OR ${stories.summary} ILIKE ${pattern})`);
  }

  const genre = filters.genre?.trim();
  if (genre) {
    conditions.push(sql`lower(${stories.genre}) = lower(${genre})`);
  }

  if (filters.authorId) {
    conditions.push(eq(stories.authorId, filters.authorId));
  }

  const rows = await db
    .select(storyRowColumns)
    .from(stories)
    .innerJoin(users, eq(stories.authorId, users.id))
    .where(and(...conditions))
    .orderBy(desc(stories.publishedAt));

  return toCards(rows, userId);
}

export async function getPublishedDetail(id: string, userId: string): Promise<StoryDetailDto> {
  const [row] = await db
    .select(storyRowColumns)
    .from(stories)
    .innerJoin(users, eq(stories.authorId, users.id))
    .where(and(eq(stories.id, id), eq(stories.published, true)));

  if (!row) {
    throw notFound();
  }

  const [card] = await toCards([row], userId);

  const statRows = await db
    .select()
    .from(statDefinitions)
    .where(eq(statDefinitions.storyId, id))
    .orderBy(asc(statDefinitions.sortOrder), asc(statDefinitions.id));

  const [save] = await db
    .select({ status: saves.status, updatedAt: saves.updatedAt })
    .from(saves)
    .where(and(eq(saves.userId, userId), eq(saves.storyId, id)));

  return {
    ...card,
    stats: statRows.map((stat) => ({
      id: stat.id,
      name: stat.name,
      type: stat.type,
      defaultValue: stat.defaultValue,
      min: stat.min,
      max: stat.max,
    })),
    mySave: save ? { status: save.status, updatedAt: save.updatedAt.toISOString() } : null,
  };
}

export async function listGenres(): Promise<string[]> {
  // Le tri se fait en mémoire : `ORDER BY lower(genre)` échoue en SQL avec `SELECT DISTINCT`
  // puisque l'expression de tri doit alors figurer dans la liste des colonnes sélectionnées.
  const rows = await db.selectDistinct({ genre: stories.genre }).from(stories).where(eq(stories.published, true));
  return rows.map((row) => row.genre).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
}
