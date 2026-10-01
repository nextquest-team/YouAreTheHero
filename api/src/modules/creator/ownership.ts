import { and, eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { enemies, items, scenes, statDefinitions, stories } from '../../db/schema/index.js';
import { conflict, forbidden, notFound, unprocessable } from '../../lib/errors.js';

export type Story = typeof stories.$inferSelect;

type StoryScopedTable = typeof scenes | typeof statDefinitions | typeof enemies | typeof items;

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

/** Vérifie qu'une référence (scène, stat, objet, ennemi) appartient bien à l'histoire donnée, et la renvoie. */
export function assertInStory(
  table: typeof scenes,
  id: string,
  storyId: string,
  field: string,
): Promise<typeof scenes.$inferSelect>;
export function assertInStory(
  table: typeof statDefinitions,
  id: string,
  storyId: string,
  field: string,
): Promise<typeof statDefinitions.$inferSelect>;
export function assertInStory(
  table: typeof enemies,
  id: string,
  storyId: string,
  field: string,
): Promise<typeof enemies.$inferSelect>;
export function assertInStory(
  table: typeof items,
  id: string,
  storyId: string,
  field: string,
): Promise<typeof items.$inferSelect>;
export async function assertInStory(
  table: StoryScopedTable,
  id: string,
  storyId: string,
  field: string,
): Promise<Record<string, unknown>> {
  // Les 4 tables partagent la forme (id, storyId) : la sélection est correcte à l'exécution,
  // seul le typage générique de Drizzle ne s'y retrouve pas sur une union de tables.
  const [row] = await db
    .select()
    .from(table as typeof scenes)
    .where(and(eq(table.id, id), eq(table.storyId, storyId)));
  if (!row) {
    throw unprocessable('INVALID_REFERENCE', "La référence ne pointe pas vers une entité de cette histoire", {
      field,
    });
  }
  return row;
}
