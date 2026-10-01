import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { combatStateSchema, conditionSchema, effectSchema, extraStatsSchema } from '../src/engine/schemas.js';

describe('conditionSchema', () => {
  it('accepte une condition de stat valide', () => {
    const result = conditionSchema.safeParse({
      type: 'stat',
      statId: randomUUID(),
      op: '>=',
      value: 5,
    });

    expect(result.success).toBe(true);
  });

  it("refuse un opérateur de stat inconnu ('>' n'existe pas)", () => {
    const result = conditionSchema.safeParse({
      type: 'stat',
      statId: randomUUID(),
      op: '>',
      value: 5,
    });

    expect(result.success).toBe(false);
  });

  it("accepte une condition d'objet 'has' valide", () => {
    const result = conditionSchema.safeParse({
      type: 'item',
      itemId: randomUUID(),
      op: 'has',
    });

    expect(result.success).toBe(true);
  });
});

describe('effectSchema', () => {
  it('accepte un effet objet avec une quantité négative (retire l’objet)', () => {
    const result = effectSchema.safeParse({
      type: 'item',
      itemId: randomUUID(),
      qty: -1,
    });

    expect(result.success).toBe(true);
  });

  it('refuse un effet sans champ type', () => {
    const result = effectSchema.safeParse({
      statId: randomUUID(),
      delta: 1,
    });

    expect(result.success).toBe(false);
  });
});

describe('combatStateSchema', () => {
  it('refuse un objet sans enemyShield', () => {
    const result = combatStateSchema.safeParse({
      enemyId: randomUUID(),
      enemyHp: 8,
      log: [],
    });

    expect(result.success).toBe(false);
  });

  it('accepte un état de combat complet avec enemyShield', () => {
    const result = combatStateSchema.safeParse({
      enemyId: randomUUID(),
      enemyHp: 8,
      enemyShield: 3,
      log: [],
    });

    expect(result.success).toBe(true);
  });
});

describe('extraStatsSchema', () => {
  it('accepte une liste de caractéristiques libres valide', () => {
    const result = extraStatsSchema.safeParse([{ name: 'Rapidité', value: '3' }]);

    expect(result.success).toBe(true);
  });

  it('refuse une caractéristique sans nom', () => {
    const result = extraStatsSchema.safeParse([{ name: '', value: '3' }]);

    expect(result.success).toBe(false);
  });
});
