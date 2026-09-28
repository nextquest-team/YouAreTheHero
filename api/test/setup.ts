import { afterAll } from 'vitest';
import { closeDb } from '../src/db/index.js';

// setupFiles s'exécute dans chaque worker (contrairement à globalSetup/globalTeardown, qui
// tournent dans le process principal) : c'est là qu'il faut fermer le pool Postgres du module
// src/db/index.ts pour ne pas laisser de connexion ouverte en fin de suite.
afterAll(async () => {
  await closeDb();
});
