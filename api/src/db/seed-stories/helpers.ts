import type { SeedChoice, SeedCondition, SeedEffect, SeedScene, SeedStat } from '../seed-data.js';

// Raccourcis d'écriture pour les longues histoires du seed : une scène, un choix ou un effet
// tient sur une ligne, les valeurs par défaut (pas de combat, pas d'image) sont implicites.

type SceneOptions = Partial<Omit<SeedScene, 'key' | 'title' | 'text'>>;

/** Scène ordinaire : sans combat, sans image et sans effet à l'arrivée, sauf mention contraire. */
export function scene(key: string, title: string, text: string, options: SceneOptions = {}): SeedScene {
  return {
    key,
    title,
    text,
    backgroundUrl: null,
    isEnding: false,
    enemyKey: null,
    winSceneKey: null,
    loseSceneKey: null,
    onEnterEffects: [],
    ...options,
  };
}

export function ending(key: string, title: string, text: string, options: SceneOptions = {}): SeedScene {
  return scene(key, title, text, { ...options, isEnding: true });
}

export function fight(
  key: string,
  title: string,
  text: string,
  combat: { enemy: string; win: string; lose: string },
  options: SceneOptions = {},
): SeedScene {
  return scene(key, title, text, { ...options, enemyKey: combat.enemy, winSceneKey: combat.win, loseSceneKey: combat.lose });
}

/**
 * Plusieurs scènes partagent souvent le même décor : on les regroupe par image
 * ({ '/uploads/decor.jpg': ['scene1', 'scene2'] }). Une clé inconnue fait échouer le seed.
 */
export function withBackdrops(scenes: SeedScene[], backdrops: Record<string, string[]>): SeedScene[] {
  const byKey = new Map<string, string>();
  for (const [url, keys] of Object.entries(backdrops)) {
    for (const key of keys) {
      if (!scenes.some((s) => s.key === key)) throw new Error(`Décor ${url} : scène inconnue « ${key} »`);
      byKey.set(key, url);
    }
  }
  return scenes.map((s) => ({ ...s, backgroundUrl: byKey.get(s.key) ?? s.backgroundUrl }));
}

export function choice(
  fromKey: string,
  toKey: string,
  label: string,
  options: { condition?: SeedCondition; effects?: SeedEffect[] } = {},
): SeedChoice {
  return { fromKey, toKey, label, condition: options.condition ?? null, effects: options.effects ?? [] };
}

export function numberStat(key: string, name: string, defaultValue: number, min: number | null, max: number | null): SeedStat {
  return { key, name, type: 'number', defaultValue: String(defaultValue), min, max };
}

export function textStat(key: string, name: string, defaultValue: string): SeedStat {
  return { key, name, type: 'text', defaultValue, min: null, max: null };
}

export const gain = (statKey: string, delta: number): SeedEffect => ({ type: 'stat', statKey, delta });
export const give = (itemKey: string, qty = 1): SeedEffect => ({ type: 'item', itemKey, qty });
export const atLeast = (statKey: string, value: number): SeedCondition => ({ type: 'stat', statKey, op: '>=', value });
export const atMost = (statKey: string, value: number): SeedCondition => ({ type: 'stat', statKey, op: '<=', value });
export const has = (itemKey: string): SeedCondition => ({ type: 'item', itemKey, op: 'has' });
export const lacks = (itemKey: string): SeedCondition => ({ type: 'item', itemKey, op: 'not_has' });
