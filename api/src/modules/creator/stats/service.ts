import { eq, sql } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { statDefinitions } from '../../../db/schema/index.js';
import { conflict, notFound, unprocessable } from '../../../lib/errors.js';
import { assertOwner, type Story } from '../ownership.js';
import { findReferenceUsages } from '../usages.js';
import type { CreateStatBody, StatDto, UpdateStatBody } from './schemas.js';

export type Stat = typeof statDefinitions.$inferSelect;

type StatValues = Pick<Stat, 'type' | 'defaultValue' | 'min' | 'max'>;

// Longueur max d'un texte saisi par le joueur, alignée sur les textStats du moteur.
const TEXT_MAX_LENGTH = 50;

export function toDto(stat: Stat): StatDto {
  return {
    id: stat.id,
    name: stat.name,
    type: stat.type,
    defaultValue: stat.defaultValue,
    min: stat.min,
    max: stat.max,
    sortOrder: stat.sortOrder,
  };
}

function invalid(field: string, message: string) {
  return unprocessable('INVALID_STAT', message, { field });
}

/**
 * Une stat `number` a une valeur par défaut entière, comprise entre min et max quand ils sont
 * définis. Une stat `text` n'a ni min ni max, et son texte par défaut fait 50 caractères au plus.
 */
function validateValues(values: StatValues): void {
  if (values.type === 'text') {
    if (values.min !== null || values.max !== null) {
      throw invalid(values.min !== null ? 'min' : 'max', "Une stat texte n'a pas de min ni de max");
    }
    if (values.defaultValue.length > TEXT_MAX_LENGTH) {
      throw invalid('defaultValue', `Le texte par défaut fait ${TEXT_MAX_LENGTH} caractères au plus`);
    }
    return;
  }

  if (!/^-?\d+$/.test(values.defaultValue)) {
    throw invalid('defaultValue', 'La valeur par défaut doit être un nombre entier');
  }
  const value = Number(values.defaultValue);
  if (values.min !== null && values.max !== null && values.min > values.max) {
    throw invalid('min', 'Le min doit être inférieur ou égal au max');
  }
  if (values.min !== null && value < values.min) {
    throw invalid('defaultValue', 'La valeur par défaut est inférieure au min');
  }
  if (values.max !== null && value > values.max) {
    throw invalid('defaultValue', 'La valeur par défaut est supérieure au max');
  }
}

/** Charge la stat et son histoire : 404 si la stat est absente, 403 si l'histoire est à un autre auteur. */
export async function loadOwned(statId: string, userId: string): Promise<{ stat: Stat; story: Story }> {
  const [stat] = await db.select().from(statDefinitions).where(eq(statDefinitions.id, statId));
  if (!stat) {
    throw notFound();
  }
  const story = await assertOwner(stat.storyId, userId);
  return { stat, story };
}

/** 409 STAT_IN_USE avec la liste des endroits qui citent encore la stat. */
async function assertUnused(stat: Stat, message: string): Promise<void> {
  const usedIn = await findReferenceUsages(stat.storyId, { statId: stat.id });
  if (usedIn.length > 0) {
    throw conflict('STAT_IN_USE', message, { usedIn });
  }
}

export async function create(story: Story, input: CreateStatBody): Promise<StatDto> {
  const values: StatValues = {
    type: input.type,
    defaultValue: input.defaultValue,
    min: input.min ?? null,
    max: input.max ?? null,
  };
  validateValues(values);

  // Nouvelle stat en fin de liste.
  const [{ next }] = await db
    .select({ next: sql<number>`coalesce(max(${statDefinitions.sortOrder}) + 1, 0)::int` })
    .from(statDefinitions)
    .where(eq(statDefinitions.storyId, story.id));

  const [created] = await db
    .insert(statDefinitions)
    .values({ storyId: story.id, name: input.name, ...values, sortOrder: next })
    .returning();
  return toDto(created);
}

export async function update(stat: Stat, story: Story, input: UpdateStatBody): Promise<StatDto> {
  const becomesText = stat.type === 'number' && input.type === 'text';

  const values: StatValues = {
    type: input.type ?? stat.type,
    defaultValue: input.defaultValue ?? stat.defaultValue,
    // Passer en texte efface les bornes, sauf si le client en renvoie (422 dans ce cas).
    min: input.min !== undefined ? input.min : becomesText ? null : stat.min,
    max: input.max !== undefined ? input.max : becomesText ? null : stat.max,
  };
  validateValues(values);

  // Conditions, effets et combat n'utilisent que des stats numériques.
  if (becomesText) {
    for (const field of ['attackStatId', 'hpStatId'] as const) {
      if (story[field] === stat.id) {
        throw invalid('type', `La stat sert de ${field === 'hpStatId' ? 'PV' : "stat d'attaque"} : elle doit rester numérique`);
      }
    }
    await assertUnused(stat, 'La stat est utilisée dans des conditions ou des effets : elle doit rester numérique');
  }

  const [updated] = await db
    .update(statDefinitions)
    .set({ ...values, ...(input.name !== undefined && { name: input.name }) })
    .where(eq(statDefinitions.id, stat.id))
    .returning();
  return toDto(updated);
}

/** Refusé tant que la stat est citée ; sinon la base remet attackStatId / hpStatId à NULL. */
export async function remove(stat: Stat): Promise<void> {
  await assertUnused(stat, 'La stat est encore utilisée dans des conditions ou des effets');
  await db.delete(statDefinitions).where(eq(statDefinitions.id, stat.id));
}
