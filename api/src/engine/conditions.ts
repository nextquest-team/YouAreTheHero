import type { Condition } from './schemas.js';
import type { ItemDef, PlayState, StatDef } from './types.js';

/**
 * Une stat absente de l'état ou non numérique ne remplit jamais une condition : elle vaut
 * comme un simple échec plutôt qu'une erreur (voir docs/conception.md section 4).
 */
export function evaluateCondition(condition: Condition, state: PlayState): boolean {
  if (condition.type === 'stat') {
    const value = state.stats[condition.statId];
    if (typeof value !== 'number') {
      return false;
    }
    switch (condition.op) {
      case '>=':
        return value >= condition.value;
      case '<=':
        return value <= condition.value;
      case '==':
        return value === condition.value;
    }
  }

  const qty = state.inventory[condition.itemId] ?? 0;
  return condition.op === 'has' ? qty >= 1 : qty <= 0;
}

/** Libellé affiché au joueur pour un choix verrouillé : renvoyé tel quel au front. */
export function conditionLabel(condition: Condition, stats: StatDef[], items: ItemDef[]): string {
  if (condition.type === 'stat') {
    const name = stats.find((stat) => stat.id === condition.statId)?.name ?? '';
    switch (condition.op) {
      case '>=':
        return `${name} ${condition.value} requise`;
      case '<=':
        return `${name} ${condition.value} maximum`;
      case '==':
        return `${name} exactement ${condition.value}`;
    }
  }

  const name = items.find((item) => item.id === condition.itemId)?.name ?? '';
  return condition.op === 'has' ? `${name} requise` : `Sans ${name}`;
}
