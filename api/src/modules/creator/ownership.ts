import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { stories } from '../../db/schema/index.js';
import { conflict, forbidden, notFound } from '../../lib/errors.js';

export type Story = typeof stories.$inferSelect;

/** Charge l'histoire et vérifie qu'elle appartient à `userId` (404 si absente, 403 si autre auteur). */
export async function assertOwner(storyId: string, userId: string): Promise<Story> {
  const [story] = await db.select().from(stories).where(eq(stories.id, storyId));
  if (!story) {
    throw notFound();
  }
  if (story.authorId !== userId) {
    throw forbidden();
  }
  return story;
}

/** Bloque l'édition d'une histoire publiée : 409 STORY_PUBLISHED tant qu'elle n'a pas été dépubliée. */
export function assertEditable(story: Story): void {
  if (story.published) {
    throw conflict('STORY_PUBLISHED', "L'histoire est publiée : il faut la dépublier avant de la modifier");
  }
}
