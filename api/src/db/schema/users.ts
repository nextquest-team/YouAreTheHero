import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { roleEnum } from './enums.js';

export const users = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  // Stocké en minuscules par le service d'auth : l'unicité se fait sur cette forme normalisée.
  email: text().notNull().unique(),
  passwordHash: text().notNull(),
  displayName: text().notNull(),
  role: roleEnum().notNull(),
  // Selfie du héros par défaut, repris dans chaque partie ; nul tant qu'il n'a pas été pris.
  avatarUrl: text(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
