import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users.js';

// Médiathèque du créateur : images ajoutées (photo ou galerie), communes à toutes ses histoires,
// pour illustrer couverture, décor, ennemi ou objet (voir docs/conception.md section 3).
export const media = pgTable(
  'media',
  {
    id: uuid().primaryKey().defaultRandom(),
    ownerId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    url: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('media_owner_id_idx').on(table.ownerId)],
);
