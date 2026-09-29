import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp, type App } from '../src/app.js';
import { env } from '../src/config/env.js';
import { db } from '../src/db/index.js';
import { favorites, media, saves, scenes, stories, users } from '../src/db/schema/index.js';
import { removeUploadedFile } from '../src/lib/uploads.js';
import { createUser } from './helpers/auth.js';
import { resetDb } from './helpers/db.js';

describe('suppression d’une histoire ou d’un compte : les images suivent', () => {
  let app: App;
  const createdUrls: string[] = [];

  /** Dépose un faux fichier dans UPLOADS_DIR et renvoie son chemin /uploads/... */
  async function fakeImage(): Promise<string> {
    const filename = `${randomUUID()}.jpg`;
    await writeFile(path.join(env.UPLOADS_DIR, filename), Buffer.from([0xff, 0xd8, 0xff]));
    const url = `/uploads/${filename}`;
    createdUrls.push(url);
    return url;
  }

  /** Ajoute l'image à la médiathèque du créateur, comme le ferait POST /me/media. */
  async function fakeMedia(ownerId: string): Promise<string> {
    const url = await fakeImage();
    await db.insert(media).values({ ownerId, url });
    return url;
  }

  const onDisk = (url: string) => existsSync(path.join(env.UPLOADS_DIR, path.basename(url)));

  async function createStory(token: string, payload: Record<string, unknown>) {
    const response = await app.inject({
      method: 'POST',
      url: '/me/stories',
      headers: { authorization: `Bearer ${token}` },
      payload: { title: 'Le Donjon', genre: 'Fantastique', ...payload },
    });
    return response.json();
  }

  beforeAll(async () => {
    app = await buildApp({ logger: false });
    await app.ready();
  });

  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await Promise.all(createdUrls.map((url) => removeUploadedFile(url)));
    await app.close();
  });

  it('DELETE /me/stories/:id efface ses images, sauf celles qu’une autre histoire utilise encore', async () => {
    const { token, user } = await createUser(app, { role: 'CREATOR' });
    const cover = await fakeMedia(user.id);
    const shared = await fakeMedia(user.id);
    const story = await createStory(token, { title: 'Le Donjon', coverUrl: cover });
    const other = await createStory(token, { title: 'La Tour', coverUrl: shared });
    await db.insert(scenes).values({ storyId: story.id, title: 'Entrée', text: '…', backgroundUrl: shared });

    const response = await app.inject({
      method: 'DELETE',
      url: `/me/stories/${story.id}`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(204);
    expect(onDisk(cover)).toBe(false);
    expect(onDisk(shared)).toBe(true);
    const library = await db.select({ url: media.url }).from(media).where(eq(media.ownerId, user.id));
    expect(library.map((row) => row.url)).toEqual([shared]);
    expect((await db.select().from(stories).where(eq(stories.id, other.id))).length).toBe(1);
  });

  it('DELETE /me/stories/:id efface aussi les visages des héros de ses parties, sauf un avatar de profil', async () => {
    const creator = await createUser(app, { role: 'CREATOR' });
    const player = await createUser(app, { role: 'PLAYER' });
    const other = await createUser(app, { role: 'PLAYER' });
    const selfie = await fakeImage();
    const avatar = await fakeImage();
    await db.update(users).set({ avatarUrl: avatar }).where(eq(users.id, other.user.id));

    const story = await createStory(creator.token, {});
    const [scene] = await db.insert(scenes).values({ storyId: story.id, title: 'Entrée', text: '…' }).returning();
    await db.insert(saves).values([
      { userId: player.user.id, storyId: story.id, currentSceneId: scene.id, heroFaceUrl: selfie },
      { userId: other.user.id, storyId: story.id, currentSceneId: scene.id, heroFaceUrl: avatar },
    ]);

    await app.inject({
      method: 'DELETE',
      url: `/me/stories/${story.id}`,
      headers: { authorization: `Bearer ${creator.token}` },
    });

    expect(onDisk(selfie)).toBe(false);
    expect(onDisk(avatar)).toBe(true);
  });

  it('DELETE /auth/me supprime le compte du créateur, ses histoires, sa médiathèque et les fichiers', async () => {
    const { token, user } = await createUser(app, { role: 'CREATOR' });
    const cover = await fakeMedia(user.id);
    const unused = await fakeMedia(user.id);
    await createStory(token, { coverUrl: cover });

    const response = await app.inject({ method: 'DELETE', url: '/auth/me', headers: { authorization: `Bearer ${token}` } });

    expect(response.statusCode).toBe(204);
    expect(await db.select().from(users).where(eq(users.id, user.id))).toEqual([]);
    expect(await db.select().from(stories).where(eq(stories.authorId, user.id))).toEqual([]);
    expect(await db.select().from(media).where(eq(media.ownerId, user.id))).toEqual([]);
    expect(onDisk(cover)).toBe(false);
    expect(onDisk(unused)).toBe(false);
  });

  it('DELETE /auth/me supprime le joueur, son avatar, ses parties et leurs selfies, ses favoris', async () => {
    const creator = await createUser(app, { role: 'CREATOR' });
    const { token, user } = await createUser(app, { role: 'PLAYER' });
    const avatar = await fakeImage();
    const selfie = await fakeImage();
    await db.update(users).set({ avatarUrl: avatar }).where(eq(users.id, user.id));
    const story = await createStory(creator.token, {});
    const [scene] = await db.insert(scenes).values({ storyId: story.id, title: 'Entrée', text: '…' }).returning();
    await db.insert(saves).values({ userId: user.id, storyId: story.id, currentSceneId: scene.id, heroFaceUrl: selfie });
    await db.insert(favorites).values({ userId: user.id, storyId: story.id });

    const response = await app.inject({ method: 'DELETE', url: '/auth/me', headers: { authorization: `Bearer ${token}` } });

    expect(response.statusCode).toBe(204);
    expect(onDisk(avatar)).toBe(false);
    expect(onDisk(selfie)).toBe(false);
    expect(await db.select().from(saves).where(eq(saves.userId, user.id))).toEqual([]);
    expect(await db.select().from(favorites).where(eq(favorites.userId, user.id))).toEqual([]);
    // L'histoire du créateur, elle, reste en place.
    expect((await db.select().from(stories).where(eq(stories.id, story.id))).length).toBe(1);
  });

  it('après DELETE /auth/me, le token ne permet plus rien et l’email est libre', async () => {
    const email = `supprime-${randomUUID()}@demo.fr`;
    const { token } = await createUser(app, { role: 'PLAYER', email });

    await app.inject({ method: 'DELETE', url: '/auth/me', headers: { authorization: `Bearer ${token}` } });

    const me = await app.inject({ method: 'GET', url: '/auth/me', headers: { authorization: `Bearer ${token}` } });
    expect(me.statusCode).toBe(401);
    await expect(createUser(app, { role: 'PLAYER', email })).resolves.toBeDefined();
  });

  it('DELETE /auth/me sans token répond 401', async () => {
    const response = await app.inject({ method: 'DELETE', url: '/auth/me' });
    expect(response.statusCode).toBe(401);
  });
});
