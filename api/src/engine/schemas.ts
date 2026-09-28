import { z } from 'zod';

// Conditions et effets typés, réutilisés par choices.condition/effects,
// scenes.on_enter_effects et items.use_effects (voir docs/conception.md section 3).

const statConditionSchema = z.object({
  type: z.literal('stat'),
  statId: z.uuid(),
  op: z.enum(['>=', '<=', '==']),
  value: z.number(),
});

const itemConditionSchema = z.object({
  type: z.literal('item'),
  itemId: z.uuid(),
  op: z.enum(['has', 'not_has']),
});

export const conditionSchema = z.discriminatedUnion('type', [statConditionSchema, itemConditionSchema]);
export type Condition = z.infer<typeof conditionSchema>;

const statEffectSchema = z.object({
  type: z.literal('stat'),
  statId: z.uuid(),
  delta: z.int(),
});

const itemEffectSchema = z.object({
  type: z.literal('item'),
  // Une quantité négative retire l'objet de l'inventaire.
  itemId: z.uuid(),
  qty: z.int(),
});

export const effectSchema = z.discriminatedUnion('type', [statEffectSchema, itemEffectSchema]);
export type Effect = z.infer<typeof effectSchema>;

export const effectsSchema = z.array(effectSchema);

// Caractéristique libre d'un ennemi (ex. « Élément » / « Ténèbres ») : purement affichée au
// joueur, sans effet sur le combat (voir docs/conception.md section 3).
export const extraStatSchema = z.object({
  name: z.string().min(1),
  value: z.string(),
});
export type ExtraStat = z.infer<typeof extraStatSchema>;

export const extraStatsSchema = z.array(extraStatSchema);

export const combatStateSchema = z.object({
  enemyId: z.uuid(),
  enemyHp: z.int(),
  enemyShield: z.number().int().min(0),
  log: z.array(z.string()),
});
export type CombatState = z.infer<typeof combatStateSchema>;

// Les stats d'une partie : { statId: valeur }, valeur selon le type de la stat (number/text).
export type SaveStats = Record<string, number | string>;

// L'inventaire d'une partie : { itemId: quantité }.
export type Inventory = Record<string, number>;
