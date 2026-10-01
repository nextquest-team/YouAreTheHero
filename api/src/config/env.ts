import path from 'node:path';
import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL est requis'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET doit faire au moins 16 caractères'),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('0.0.0.0'),
  UPLOADS_DIR: z.string().default('uploads'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error(parsed.error.issues);
  throw new Error("Configuration invalide : vérifier les variables d'environnement.");
}

export const env = {
  ...parsed.data,
  // Chemin absolu quel que soit le cwd (dev, test, conteneur Docker).
  UPLOADS_DIR: path.resolve(process.cwd(), parsed.data.UPLOADS_DIR),
};
