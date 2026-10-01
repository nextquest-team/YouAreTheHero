import { defineConfig } from 'vitest/config';

// La CI fournit ses propres valeurs ; en local on retombe sur la base de test par défaut.
const DATABASE_URL = process.env.DATABASE_URL ?? 'postgres://hero:hero@localhost:5432/hero_test';
const JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret-at-least-16-chars';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    fileParallelism: false,
    globalSetup: ['./test/global-setup.ts'],
    setupFiles: ['./test/setup.ts'],
    env: {
      DATABASE_URL,
      JWT_SECRET,
    },
  },
});
