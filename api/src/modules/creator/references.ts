import { items, statDefinitions } from '../../db/schema/index.js';
import type { Condition, Effect } from '../../engine/schemas.js';
import { unprocessable } from '../../lib/errors.js';
import { assertInStory } from './ownership.js';

/**
 * Vérifie une stat ou un objet cité par une condition ou un effet : il appartient à l'histoire,
 * et une stat est de type `number` (seules les stats numériques servent au jeu).
 * 422 INVALID_REFERENCE avec `field` (ex. `effects[1].statId`) sinon.
 */
async function assertReference(storyId: string, reference: Condition | Effect, path: string): Promise<void> {
  if (reference.type === 'item') {
    await assertInStory(items, reference.itemId, storyId, `${path}.itemId`);
    return;
  }
  const field = `${path}.statId`;
  const stat = await assertInStory(statDefinitions, reference.statId, storyId, field);
  if (stat.type !== 'number') {
    throw unprocessable('INVALID_REFERENCE', 'La stat citée doit être une stat numérique de cette histoire', {
      field,
    });
  }
}

/** Vérifie chaque effet d'une liste (`field` : nom du champ du corps, ex. `onEnterEffects`). */
export async function assertEffectsInStory(storyId: string, effects: Effect[], field: string): Promise<void> {
  for (const [index, effect] of effects.entries()) {
    await assertReference(storyId, effect, `${field}[${index}]`);
  }
}

/** Vérifie la stat ou l'objet cité par une condition de choix. */
export async function assertConditionInStory(storyId: string, condition: Condition, field: string): Promise<void> {
  await assertReference(storyId, condition, field);
}
