import { sql } from 'drizzle-orm';
import { check, integer, jsonb, pgTable, primaryKey, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import type { CombatState, Inventory, SaveStats } from '../../engine/schemas.js';
import { saveStatusEnum } from './enums.js';
import { scenes, stories } from './stories.js';
import { users } from './users.js';

export const saves = pgTable(
  'saves',
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    storyId: uuid()
      .notNull()
      .references(() => stories.id, { onDelete: 'cascade' }),
    // Par sécurité : la scène courante ne devrait jamais disparaître sous une partie en cours.
    currentSceneId: uuid()
      .notNull()
      .references(() => scenes.id, { onDelete: 'cascade' }),
    stats: jsonb()
      .notNull()
      .default(sql`'{}'::jsonb`)
      .$type<SaveStats>(),
    heroFaceUrl: text(),
    // Ids des scènes visitées, dans l'ordre : sert à n'appliquer on_enter_effects qu'une fois.
    history: jsonb()
      .notNull()
      .default(sql`'[]'::jsonb`)
      .$type<string[]>(),
    inventory: jsonb()
      .notNull()
      .default(sql`'{}'::jsonb`)
      .$type<Inventory>(),
    combat: jsonb().$type<CombatState>(),
    status: saveStatusEnum().notNull().default('IN_PROGRESS'),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [unique('saves_user_id_story_id_unique').on(table.userId, table.storyId)],
);

export const favorites = pgTable(
  'favorites',
  {
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    storyId: uuid()
      .notNull()
      .references(() => stories.id, { onDelete: 'cascade' }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.storyId] })],
);

export const reviews = pgTable(
  'reviews',
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    storyId: uuid()
      .notNull()
      .references(() => stories.id, { onDelete: 'cascade' }),
    rating: integer().notNull(),
    comment: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('reviews_user_id_story_id_unique').on(table.userId, table.storyId),
    check('reviews_rating_between_1_and_5', sql`${table.rating} >= 1 AND ${table.rating} <= 5`),
  ],
);
