import { argon2id, hash, verify } from 'argon2';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { users } from '../../db/schema/index.js';
import { conflict, HttpError } from '../../lib/errors.js';
import type { Role, UserPublic } from './schemas.js';

/** L'unicité et la connexion ignorent la casse : tout est stocké en minuscules. */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Projette une ligne `users` vers la forme publique : jamais passwordHash. */
function toPublic(user: typeof users.$inferSelect): UserPublic {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
  };
}

async function findById(id: string): Promise<typeof users.$inferSelect | null> {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user ?? null;
}

/**
 * Violation de contrainte unique Postgres (23505). Drizzle enveloppe l'erreur pg dans
 * `DrizzleQueryError` (`.cause` porte l'erreur d'origine) : on regarde les deux niveaux
 * pour rester robuste si un jour l'erreur n'est plus enveloppée.
 */
function isUniqueViolation(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const code = (error as { code?: unknown }).code;
  const causeCode = (error.cause as { code?: unknown } | undefined)?.code;
  return code === '23505' || causeCode === '23505';
}

/** Utilisé par le plugin d'auth : vérifie que le `sub` du token existe encore en base. */
export async function userExists(id: string): Promise<boolean> {
  return (await findById(id)) !== null;
}

export async function getPublicUser(id: string): Promise<UserPublic | null> {
  const user = await findById(id);
  return user ? toPublic(user) : null;
}

export async function register(input: {
  email: string;
  password: string;
  displayName: string;
  role: Role;
}): Promise<UserPublic> {
  const email = normalizeEmail(input.email);

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existing.length > 0) {
    throw conflict('EMAIL_TAKEN', 'Cet email est déjà utilisé');
  }

  const passwordHash = await hash(input.password, { type: argon2id });

  // Le pré-check ci-dessus ne protège pas d'une course : deux inscriptions concurrentes
  // sur le même email peuvent toutes deux le passer avant que l'une des deux insère.
  // La contrainte unique de la base tranche alors ; on convertit sa violation en 409.
  try {
    const [created] = await db
      .insert(users)
      .values({ email, passwordHash, displayName: input.displayName, role: input.role })
      .returning();

    return toPublic(created);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw conflict('EMAIL_TAKEN', 'Cet email est déjà utilisé');
    }
    throw error;
  }
}

export async function login(input: { email: string; password: string }): Promise<UserPublic> {
  const email = normalizeEmail(input.email);
  const [user] = await db.select().from(users).where(eq(users.email, email));

  // Même réponse que l'email n'existe pas ou que le mot de passe soit faux : on ne renseigne pas l'attaquant.
  if (!user || !(await verify(user.passwordHash, input.password))) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Identifiants invalides');
  }

  return toPublic(user);
}

export async function updateMe(
  userId: string,
  input: { displayName?: string; avatarUrl?: string | null },
): Promise<UserPublic> {
  const updates: Partial<typeof users.$inferInsert> = {};
  if (input.displayName !== undefined) {
    updates.displayName = input.displayName;
  }
  if (input.avatarUrl !== undefined) {
    updates.avatarUrl = input.avatarUrl;
  }

  if (Object.keys(updates).length === 0) {
    const user = await findById(userId);
    return toPublic(user!);
  }

  const [updated] = await db.update(users).set(updates).where(eq(users.id, userId)).returning();
  return toPublic(updated);
}
