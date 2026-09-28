import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { applyEffects, isDead } from '../src/engine/effects.js';
import type { ItemDef, PlayState, StatDef } from '../src/engine/types.js';

const pvId = randomUUID();
const nomId = randomUUID();
const potionId = randomUUID();
const cleId = randomUUID();

const stats: StatDef[] = [
  { id: pvId, name: 'PV', type: 'number', min: 0, max: 20 },
  { id: nomId, name: 'Nom', type: 'text', min: null, max: null },
];
const items: ItemDef[] = [
  { id: potionId, name: 'Potion de soin' },
  { id: cleId, name: 'Clé rouillée' },
];

function state(overrides: Partial<PlayState> = {}): PlayState {
  return { stats: {}, inventory: {}, history: [], ...overrides };
}

describe('applyEffects', () => {
  it('applique un delta de stat borné par max', () => {
    const { state: next, changes } = applyEffects(
      [{ type: 'stat', statId: pvId, delta: 3 }],
      state({ stats: { [pvId]: 19 } }),
      stats,
      items,
    );
    expect(next.stats[pvId]).toBe(20);
    expect(changes).toEqual([{ label: 'PV 19 → 20', kind: 'stat', delta: 1 }]);
  });

  it('applique un delta de stat borné par min', () => {
    const { state: next, changes } = applyEffects(
      [{ type: 'stat', statId: pvId, delta: -99 }],
      state({ stats: { [pvId]: 5 } }),
      stats,
      items,
    );
    expect(next.stats[pvId]).toBe(0);
    expect(changes).toEqual([{ label: 'PV 5 → 0', kind: 'stat', delta: -5 }]);
  });

  it('sans max défini, le delta positif n’est pas plafonné', () => {
    const statsNoMax: StatDef[] = [{ id: pvId, name: 'PV', type: 'number', min: 0, max: null }];
    const { state: next } = applyEffects([{ type: 'stat', statId: pvId, delta: 100 }], state({ stats: { [pvId]: 5 } }), statsNoMax, items);
    expect(next.stats[pvId]).toBe(105);
  });

  it('changes ne contient pas un effet sans conséquence (PV déjà au max)', () => {
    const { state: next, changes } = applyEffects(
      [{ type: 'stat', statId: pvId, delta: 6 }],
      state({ stats: { [pvId]: 20 } }),
      stats,
      items,
    );
    expect(next.stats[pvId]).toBe(20);
    expect(changes).toEqual([]);
  });

  it('stat de type text est ignorée', () => {
    const { state: next, changes } = applyEffects(
      [{ type: 'stat', statId: nomId, delta: 5 }],
      state({ stats: { [nomId]: 'Aventurier' } }),
      stats,
      items,
    );
    expect(next.stats[nomId]).toBe('Aventurier');
    expect(changes).toEqual([]);
  });

  it('ajoute un objet à l’inventaire : "+1 Clé rouillée"', () => {
    const { state: next, changes } = applyEffects([{ type: 'item', itemId: cleId, qty: 1 }], state(), stats, items);
    expect(next.inventory[cleId]).toBe(1);
    expect(changes).toEqual([{ label: '+1 Clé rouillée', kind: 'item', delta: 1 }]);
  });

  it('retire un objet : "-1 Potion de soin"', () => {
    const { state: next, changes } = applyEffects(
      [{ type: 'item', itemId: potionId, qty: -1 }],
      state({ inventory: { [potionId]: 2 } }),
      stats,
      items,
    );
    expect(next.inventory[potionId]).toBe(1);
    expect(changes).toEqual([{ label: '-1 Potion de soin', kind: 'item', delta: -1 }]);
  });

  it('un objet qui tombe à 0 disparaît de l’inventaire', () => {
    const { state: next } = applyEffects([{ type: 'item', itemId: potionId, qty: -1 }], state({ inventory: { [potionId]: 1 } }), stats, items);
    expect(Object.prototype.hasOwnProperty.call(next.inventory, potionId)).toBe(false);
  });

  it('la quantité d’un objet ne descend jamais sous 0', () => {
    const { state: next, changes } = applyEffects(
      [{ type: 'item', itemId: potionId, qty: -5 }],
      state({ inventory: { [potionId]: 1 } }),
      stats,
      items,
    );
    expect(next.inventory[potionId]).toBeUndefined();
    expect(changes).toEqual([{ label: '-1 Potion de soin', kind: 'item', delta: -1 }]);
  });

  it('un objet déjà absent que l’on retire ne produit aucun changement', () => {
    const { changes } = applyEffects([{ type: 'item', itemId: potionId, qty: -1 }], state(), stats, items);
    expect(changes).toEqual([]);
  });

  it('n’altère pas l’état reçu (immuable)', () => {
    const initial = state({ stats: { [pvId]: 5 }, inventory: { [cleId]: 1 } });
    applyEffects([{ type: 'stat', statId: pvId, delta: 1 }], initial, stats, items);
    expect(initial.stats[pvId]).toBe(5);
  });
});

describe('isDead', () => {
  it('vrai si la stat de PV est à 0 ou moins', () => {
    expect(isDead(state({ stats: { [pvId]: 0 } }), pvId)).toBe(true);
    expect(isDead(state({ stats: { [pvId]: -3 } }), pvId)).toBe(true);
  });

  it('faux si la stat de PV est positive', () => {
    expect(isDead(state({ stats: { [pvId]: 1 } }), pvId)).toBe(false);
  });

  it('faux si hpStatId est null', () => {
    expect(isDead(state({ stats: { [pvId]: 0 } }), null)).toBe(false);
  });
});
