import { sql } from 'drizzle-orm';
import { db } from '../../src/db/index.js';

// Ordre indifférent : TRUNCATE ... CASCADE embarque les tables dépendantes.
const TABLES = [
  'saves',
  'favorites',
  'reviews',
  'choices',
  'scenes',
  'items',
  'enemies',
  'stat_definitions',
  'stories',
  'users',
] as const;

/** Vide toutes les tables entre deux tests. */
export async function resetDb(): Promise<void> {
  await db.execute(sql.raw(`TRUNCATE TABLE ${TABLES.join(', ')} CASCADE`));
}
