import { sql } from 'drizzle-orm';
import { db } from '../../src/db/index.js';
import { ALL_TABLES } from '../../src/db/tables.js';

/** Vide toutes les tables entre deux tests. */
export async function resetDb(): Promise<void> {
  await db.execute(sql.raw(`TRUNCATE TABLE ${ALL_TABLES.join(', ')} CASCADE`));
}
