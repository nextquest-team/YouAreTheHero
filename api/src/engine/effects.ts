import type { Effect } from './schemas.js';
import type { Change, ItemDef, PlayState, StatDef } from './types.js';

function clamp(value: number, min: number | null, max: number | null): number {
  let result = value;
  if (min !== null) {
    result = Math.max(result, min);
  }
  if (max !== null) {
    result = Math.min(result, max);
  }
  return result;
}

/**
 * Applique une liste d'effets typés à un état de partie, immuable : renvoie un nouvel état et
 * la liste des changements réellement produits (delta effectif non nul).
 */
export function applyEffects(
  effects: Effect[],
  state: PlayState,
  stats: StatDef[],
  items: ItemDef[],
): { state: PlayState; changes: Change[] } {
  let nextStats = state.stats;
  let nextInventory = state.inventory;
  const changes: Change[] = [];

  for (const effect of effects) {
    if (effect.type === 'stat') {
      const stat = stats.find((s) => s.id === effect.statId);
      if (!stat || stat.type !== 'number') {
        continue;
      }
      const current = nextStats[effect.statId];
      const currentValue = typeof current === 'number' ? current : 0;
      const nextValue = clamp(currentValue + effect.delta, stat.min, stat.max);
      const delta = nextValue - currentValue;
      if (delta === 0) {
        continue;
      }
      nextStats = { ...nextStats, [effect.statId]: nextValue };
      changes.push({ label: `${stat.name} ${currentValue} → ${nextValue}`, kind: 'stat', delta });
    } else {
      const item = items.find((i) => i.id === effect.itemId);
      if (!item) {
        continue;
      }
      const currentQty = nextInventory[effect.itemId] ?? 0;
      const nextQty = Math.max(0, currentQty + effect.qty);
      const delta = nextQty - currentQty;
      if (delta === 0) {
        continue;
      }
      if (nextQty === 0) {
        const { [effect.itemId]: _removed, ...rest } = nextInventory;
        nextInventory = rest;
      } else {
        nextInventory = { ...nextInventory, [effect.itemId]: nextQty };
      }
      const sign = delta > 0 ? '+' : '-';
      changes.push({ label: `${sign}${Math.abs(delta)} ${item.name}`, kind: 'item', delta });
    }
  }

  return { state: { ...state, stats: nextStats, inventory: nextInventory }, changes };
}

/** Le héros meurt quand la stat de PV de l'histoire (si elle existe) tombe à 0 ou moins. */
export function isDead(state: PlayState, hpStatId: string | null): boolean {
  if (!hpStatId) {
    return false;
  }
  const value = state.stats[hpStatId];
  return typeof value === 'number' && value <= 0;
}
