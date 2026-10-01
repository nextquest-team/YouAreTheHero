import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

// Même défaut que vitest.config.ts : la CI surcharge via DATABASE_URL.
const databaseUrl = process.env.DATABASE_URL ?? 'postgres://hero:hero@localhost:5432/hero_test';
const migrationsFolder = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../drizzle');

/** Applique les migrations sur la base de test avant que les fichiers de test ne s'exécutent. */
export default async function setup(): Promise<void> {
  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool, { casing: 'snake_case' });

  await migrate(db, { migrationsFolder });
  await pool.end();
}
