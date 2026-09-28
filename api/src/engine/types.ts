import type { Inventory, SaveStats } from './schemas.js';

// Formes utilisées par le moteur pur : de simples projections des définitions de l'histoire
// (stats, objets), sans dépendre des tables Drizzle qui les portent en base.

export interface StatDef {
  id: string;
  name: string;
  type: 'number' | 'text';
  min: number | null;
  max: number | null;
}

export interface ItemDef {
  id: string;
  name: string;
}

export interface PlayState {
  stats: SaveStats;
  inventory: Inventory;
  history: string[];
}

export interface Change {
  label: string;
  kind: 'stat' | 'item';
  delta: number;
}
