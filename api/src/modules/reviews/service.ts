import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { reviews, saves, stories, users } from '../../db/schema/index.js';
import { HttpError, notFound } from '../../lib/errors.js';
import type { CreateReviewBody, ReviewDto, ReviewListDto } from './schemas.js';

async function assertPublished(storyId: string): Promise<void> {
  const [story] = await db
    .select({ id: stories.id })
    .from(stories)
    .where(and(eq(stories.id, storyId), eq(stories.published, true)));
  if (!story) {
    throw notFound();
  }
}

async function hasFinished(userId: string, storyId: string): Promise<boolean> {
  const [save] = await db
    .select({ id: saves.id })
    .from(saves)
    .where(and(eq(saves.userId, userId), eq(saves.storyId, storyId), eq(saves.status, 'FINISHED')));
  return Boolean(save);
}

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  authorId: string;
  authorDisplayName: string;
};

function toDto(row: ReviewRow): ReviewDto {
  return {
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    author: { id: row.authorId, displayName: row.authorDisplayName },
    createdAt: row.createdAt.toISOString(),
  };
}

const reviewColumns = {
  id: reviews.id,
  rating: reviews.rating,
  comment: reviews.comment,
  createdAt: reviews.createdAt,
  authorId: users.id,
  authorDisplayName: users.displayName,
};

export async function list(storyId: string, userId: string): Promise<ReviewListDto> {
  await assertPublished(storyId);

  const rows = await db
    .select(reviewColumns)
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.storyId, storyId))
    .orderBy(desc(reviews.createdAt));

  const [mine] = await db
    .select(reviewColumns)
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(and(eq(reviews.storyId, storyId), eq(reviews.userId, userId)));

  const [stats] = await db
    .select({ avg: sql<string | null>`round(avg(${reviews.rating})::numeric, 1)` })
    .from(reviews)
    .where(eq(reviews.storyId, storyId));

  return {
    avgRating: stats?.avg == null ? null : Number(stats.avg),
    count: rows.length,
    mine: mine ? toDto(mine) : null,
    canReview: await hasFinished(userId, storyId),
    reviews: rows.map(toDto),
  };
}

/** Crée mon avis, ou remplace l'ancien : `created` vaut true à la première publication. */
export async function upsert(
  storyId: string,
  userId: string,
  body: CreateReviewBody,
): Promise<{ review: ReviewDto; created: boolean }> {
  await assertPublished(storyId);

  if (!(await hasFinished(userId, storyId))) {
    throw new HttpError(403, 'STORY_NOT_FINISHED', 'Termine cette histoire avant de donner ton avis');
  }

  const comment = body.comment ? body.comment : null;
  const [existing] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(and(eq(reviews.storyId, storyId), eq(reviews.userId, userId)));

  const values = { rating: body.rating, comment, createdAt: new Date() };
  const [saved] = existing
    ? await db.update(reviews).set(values).where(eq(reviews.id, existing.id)).returning({ id: reviews.id })
    : await db.insert(reviews).values({ userId, storyId, ...values }).returning({ id: reviews.id });

  const [row] = await db
    .select(reviewColumns)
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.id, saved.id));

  return { review: toDto(row), created: !existing };
}
