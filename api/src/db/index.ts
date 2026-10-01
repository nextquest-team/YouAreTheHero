import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '../config/env.js';
import * as schema from './schema/index.js';

const pool = new Pool({ connectionString: env.DATABASE_URL });

// `casing: 'snake_case'` : les clés camelCase du schéma TS deviennent snake_case en base.
export const db = drizzle(pool, { schema, casing: 'snake_case' });

export async function closeDb(): Promise<void> {
  await pool.end();
}
