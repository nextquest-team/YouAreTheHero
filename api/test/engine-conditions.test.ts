import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { conditionLabel, evaluateCondition } from '../src/engine/conditions.js';
import type { ItemDef, PlayState, StatDef } from '../src/engine/types.js';

const forceId = randomUUID();
const cleId = randomUUID();

const stats: StatDef[] = [{ id: forceId, name: 'Force', type: 'number', min: 0, max: 20 }];
const items: ItemDef[] = [{ id: cleId, name: 'Clé rouillée' }];

function state(overrides: Partial<PlayState> = {}): PlayState {
  return { stats: {}, inventory: {}, history: [], ...overrides };
}

describe('evaluateCondition', () => {
  it('stat >= remplie', () => {
    expect(evaluateCondition({ type: 'stat', statId: forceId, op: '>=', value: 5 }, state({ stats: { [forceId]: 5 } }))).toBe(true);
    expect(evaluateCondition({ type: 'stat', statId: forceId, op: '>=', value: 5 }, state({ stats: { [forceId]: 4 } }))).toBe(false);
  });

  it('stat <= remplie', () => {
    expect(evaluateCondition({ type: 'stat', statId: forceId, op: '<=', value: 3 }, state({ stats: { [forceId]: 3 } }))).toBe(true);
    expect(evaluateCondition({ type: 'stat', statId: forceId, op: '<=', value: 3 }, state({ stats: { [forceId]: 4 } }))).toBe(false);
  });

  it('stat == remplie', () => {
    expect(evaluateCondition({ type: 'stat', statId: forceId, op: '==', value: 5 }, state({ stats: { [forceId]: 5 } }))).toBe(true);
    expect(evaluateCondition({ type: 'stat', statId: forceId, op: '==', value: 5 }, state({ stats: { [forceId]: 6 } }))).toBe(false);
  });

  it('item has : quantité >= 1', () => {
    expect(evaluateCondition({ type: 'item', itemId: cleId, op: 'has' }, state({ inventory: { [cleId]: 1 } }))).toBe(true);
    expect(evaluateCondition({ type: 'item', itemId: cleId, op: 'has' }, state({ inventory: {} }))).toBe(false);
  });

  it('item not_has : absent ou 0', () => {
    expect(evaluateCondition({ type: 'item', itemId: cleId, op: 'not_has' }, state({ inventory: {} }))).toBe(true);
    expect(evaluateCondition({ type: 'item', itemId: cleId, op: 'not_has' }, state({ inventory: { [cleId]: 0 } }))).toBe(true);
    expect(evaluateCondition({ type: 'item', itemId: cleId, op: 'not_has' }, state({ inventory: { [cleId]: 1 } }))).toBe(false);
  });

  it('stat absente : condition non remplie', () => {
    expect(evaluateCondition({ type: 'stat', statId: forceId, op: '>=', value: 0 }, state())).toBe(false);
  });

  it('stat non numérique (texte) : condition non remplie', () => {
    expect(evaluateCondition({ type: 'stat', statId: forceId, op: '>=', value: 0 }, state({ stats: { [forceId]: 'Aventurier' } }))).toBe(false);
  });
});

describe('conditionLabel', () => {
  it('stat >= : "Force 7 requise"', () => {
    expect(conditionLabel({ type: 'stat', statId: forceId, op: '>=', value: 7 }, stats, items)).toBe('Force 7 requise');
  });

  it('stat <= : "Force 3 maximum"', () => {
    expect(conditionLabel({ type: 'stat', statId: forceId, op: '<=', value: 3 }, stats, items)).toBe('Force 3 maximum');
  });

  it('stat == : "Force exactement 5"', () => {
    expect(conditionLabel({ type: 'stat', statId: forceId, op: '==', value: 5 }, stats, items)).toBe('Force exactement 5');
  });

  it('item has : "Clé rouillée requise"', () => {
    expect(conditionLabel({ type: 'item', itemId: cleId, op: 'has' }, stats, items)).toBe('Clé rouillée requise');
  });

  it('item not_has : "Sans Clé rouillée"', () => {
    expect(conditionLabel({ type: 'item', itemId: cleId, op: 'not_has' }, stats, items)).toBe('Sans Clé rouillée');
  });
});
