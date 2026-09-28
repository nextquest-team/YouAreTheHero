import { sql } from 'drizzle-orm';
import {
  type AnyPgColumn,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import type { Condition, Effect, ExtraStat } from '../../engine/schemas.js';
import { statTypeEnum } from './enums.js';
import { users } from './users.js';

// `scenes` et `statDefinitions` sont déclarées plus bas dans ce fichier : les références qui les
// visent depuis `stories` utilisent une fonction pour ne pas dépendre de l'ordre d'exécution.
export const stories = pgTable(
  'stories',
  {
    id: uuid().primaryKey().defaultRandom(),
    authorId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text().notNull(),
    summary: text().notNull().default(''),
    genre: text().notNull(),
    coverUrl: text(),
    // Histoire avec ou sans combats : sans combats, pas d'ennemi ni de scène de combat.
    hasCombat: boolean().notNull().default(false),
    startSceneId: uuid().references((): AnyPgColumn => scenes.id, { onDelete: 'set null' }),
    attackStatId: uuid().references((): AnyPgColumn => statDefinitions.id, { onDelete: 'set null' }),
    hpStatId: uuid().references((): AnyPgColumn => statDefinitions.id, { onDelete: 'set null' }),
    published: boolean().notNull().default(false),
    publishedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('stories_published_idx').on(table.published),
    index('stories_author_id_idx').on(table.authorId),
  ],
);

export const statDefinitions = pgTable('stat_definitions', {
  id: uuid().primaryKey().defaultRandom(),
  storyId: uuid()
    .notNull()
    .references(() => stories.id, { onDelete: 'cascade' }),
  name: text().notNull(),
  type: statTypeEnum().notNull(),
  // Texte, converti selon le type (number/text) par le service qui l'utilise.
  defaultValue: text().notNull(),
  min: integer(),
  max: integer(),
  sortOrder: integer().notNull().default(0),
});

export const enemies = pgTable('enemies', {
  id: uuid().primaryKey().defaultRandom(),
  storyId: uuid()
    .notNull()
    .references(() => stories.id, { onDelete: 'cascade' }),
  name: text().notNull(),
  imageUrl: text(),
  attack: integer().notNull(),
  hp: integer().notNull(),
  shield: integer().notNull().default(0),
  // Caractéristiques libres, juste affichées au joueur (le combat ne porte que sur attack/hp/shield).
  extraStats: jsonb()
    .notNull()
    .default(sql`'[]'::jsonb`)
    .$type<ExtraStat[]>(),
  // Butin remporté quand l'ennemi est vaincu (même format que les autres listes d'effets).
  defeatEffects: jsonb()
    .notNull()
    .default(sql`'[]'::jsonb`)
    .$type<Effect[]>(),
  sortOrder: integer().notNull().default(0),
});

export const items = pgTable('items', {
  id: uuid().primaryKey().defaultRandom(),
  storyId: uuid()
    .notNull()
    .references(() => stories.id, { onDelete: 'cascade' }),
  name: text().notNull(),
  description: text(),
  imageUrl: text(),
  // Renseigné : l'objet est un consommable (POST /play/:storyId/use).
  useEffects: jsonb().$type<Effect[]>(),
  sortOrder: integer().notNull().default(0),
});

export const scenes = pgTable('scenes', {
  id: uuid().primaryKey().defaultRandom(),
  storyId: uuid()
    .notNull()
    .references(() => stories.id, { onDelete: 'cascade' }),
  title: text().notNull(),
  text: text().notNull(),
  backgroundUrl: text(),
  isEnding: boolean().notNull().default(false),
  enemyId: uuid().references(() => enemies.id, { onDelete: 'set null' }),
  winSceneId: uuid().references((): AnyPgColumn => scenes.id, { onDelete: 'set null' }),
  loseSceneId: uuid().references((): AnyPgColumn => scenes.id, { onDelete: 'set null' }),
  onEnterEffects: jsonb()
    .notNull()
    .default(sql`'[]'::jsonb`)
    .$type<Effect[]>(),
  sortOrder: integer().notNull().default(0),
});

export const choices = pgTable('choices', {
  id: uuid().primaryKey().defaultRandom(),
  fromSceneId: uuid()
    .notNull()
    .references(() => scenes.id, { onDelete: 'cascade' }),
  toSceneId: uuid()
    .notNull()
    .references(() => scenes.id, { onDelete: 'cascade' }),
  label: text().notNull(),
  condition: jsonb().$type<Condition>(),
  effects: jsonb()
    .notNull()
    .default(sql`'[]'::jsonb`)
    .$type<Effect[]>(),
  sortOrder: integer().notNull().default(0),
});
