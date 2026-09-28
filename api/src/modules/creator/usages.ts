import { and, eq, sql, type SQLWrapper } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../db/index.js';
import { choices, enemies, items, scenes } from '../../db/schema/index.js';

// Endroit où une stat ou un objet est encore cité, renvoyé dans les 409 { usedIn }.
export const referenceUsageSchema = z.object({
  kind: z.enum(['choice', 'scene', 'item', 'enemy']),
  id: z.uuid(),
  storyId: z.uuid(),
  label: z.string(),
});
export type ReferenceUsage = z.infer<typeof referenceUsageSchema>;

type Reference = { statId: string } | { itemId: string };

/**
 * Cherche une stat ou un objet dans tous les JSON d'une histoire : condition et effets des choix,
 * effets d'entrée des scènes, effets à l'usage des objets, butin des ennemis. Le JSON n'étant
 * protégé par aucune clé étrangère, c'est ce contrôle qui évite une référence cassée.
 */
export async function findReferenceUsages(storyId: string, reference: Reference): Promise<ReferenceUsage[]> {
  // `@>` (contient) : une liste d'effets contient un effet qui cite cet id, ou la condition le cite.
  const inList = (column: SQLWrapper) => sql`${column} @> ${JSON.stringify([reference])}::jsonb`;
  const inObject = sql`${choices.condition} @> ${JSON.stringify(reference)}::jsonb`;

  const [choiceRows, sceneRows, itemRows, enemyRows] = await Promise.all([
    db
      .select({ id: choices.id, label: choices.label })
      .from(choices)
      .innerJoin(scenes, eq(choices.fromSceneId, scenes.id))
      .where(and(eq(scenes.storyId, storyId), sql`(${inObject} OR ${inList(choices.effects)})`)),
    db
      .select({ id: scenes.id, label: scenes.title })
      .from(scenes)
      .where(and(eq(scenes.storyId, storyId), inList(scenes.onEnterEffects))),
    db
      .select({ id: items.id, label: items.name })
      .from(items)
      .where(and(eq(items.storyId, storyId), inList(items.useEffects))),
    db
      .select({ id: enemies.id, label: enemies.name })
      .from(enemies)
      .where(and(eq(enemies.storyId, storyId), inList(enemies.defeatEffects))),
  ]);

  return [
    ...choiceRows.map((row) => ({ kind: 'choice' as const, storyId, ...row })),
    ...sceneRows.map((row) => ({ kind: 'scene' as const, storyId, ...row })),
    ...itemRows.map((row) => ({ kind: 'item' as const, storyId, ...row })),
    ...enemyRows.map((row) => ({ kind: 'enemy' as const, storyId, ...row })),
  ];
}
