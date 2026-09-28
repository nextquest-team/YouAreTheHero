import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { env } from '../config/env.js';

// Résolu relativement à ce fichier : fonctionne en dev (src/db/migrate.ts, drizzle/ deux niveaux
// au-dessus) comme compilé dans l'image Docker (dist/db/migrate.js, drizzle/ copié à côté de dist/).
const migrationsFolder = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../drizzle');

async function main(): Promise<void> {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const db = drizzle(pool, { casing: 'snake_case' });

  await migrate(db, { migrationsFolder });
  await pool.end();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
