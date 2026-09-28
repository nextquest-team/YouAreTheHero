import { randomUUID } from 'node:crypto';
import type { App } from '../../src/app.js';
import type { UserPublic } from '../../src/modules/auth/schemas.js';

/** Inscrit un utilisateur via POST /auth/register et retourne son token + sa forme publique. */
export async function createUser(
  app: App,
  options: { role: 'PLAYER' | 'CREATOR'; email?: string },
): Promise<{ token: string; user: UserPublic }> {
  const email = options.email ?? `${options.role.toLowerCase()}-${randomUUID()}@demo.fr`;

  const response = await app.inject({
    method: 'POST',
    url: '/auth/register',
    payload: {
      email,
      password: 'password123',
      displayName: 'Demo',
      role: options.role,
    },
  });

  if (response.statusCode !== 201) {
    throw new Error(`createUser: /auth/register a répondu ${response.statusCode} : ${response.body}`);
  }

  return response.json() as { token: string; user: UserPublic };
}
