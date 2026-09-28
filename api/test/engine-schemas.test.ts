import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { conditionSchema, effectSchema } from '../src/engine/schemas.js';

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
