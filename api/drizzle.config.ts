import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  // Les clés camelCase du schéma TS deviennent snake_case dans les migrations générées.
  casing: 'snake_case',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://hero:hero@localhost:5432/hero',
  },
});
