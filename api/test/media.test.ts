import { access } from 'node:fs/promises';
import path from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp, type App } from '../src/app.js';
import { env } from '../src/config/env.js';
import { db } from '../src/db/index.js';
import { scenes, stories } from '../src/db/schema/index.js';
import { MAX_UPLOAD_BYTES, removeUploadedFile } from '../src/lib/uploads.js';
import { createUser } from './helpers/auth.js';
import { resetDb } from './helpers/db.js';

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);

/** Construit un corps multipart/form-data à un seul fichier, pour app.inject. */
function multipart(content: Buffer, options: { field?: string; filename?: string; type?: string } = {}) {
  const boundary = '----hero-test-boundary';
  const head = Buffer.from(
    `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="${options.field ?? 'file'}"; filename="${options.filename ?? 'image.jpg'}"\r\n` +
      `Content-Type: ${options.type ?? 'image/jpeg'}\r\n\r\n`,
  );
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
  return {
    payload: Buffer.concat([head, content, tail]),
    headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
  };
}

async function fileExists(url: string): Promise<boolean> {
  try {
    await access(path.join(env.UPLOADS_DIR, path.basename(url)));
    return true;
  } catch {
    return false;
  }
}

describe('POST /uploads et médiathèque /me/media', () => {
  let app: App;
  const createdUrls: string[] = [];

  async function upload(url: string, token: string, content: Buffer, options?: Parameters<typeof multipart>[1]) {
    const body = multipart(content, options);
    const response = await app.inject({
      method: 'POST',
      url,
      headers: { ...body.headers, authorization: `Bearer ${token}` },
      payload: body.payload,
    });
    if (response.statusCode === 201) {
      createdUrls.push(response.json().url);
    }
    return response;
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

  it('POST /uploads sans token répond 401', async () => {
    const body = multipart(JPEG);
    const response = await app.inject({ method: 'POST', url: '/uploads', ...body });

    expect(response.statusCode).toBe(401);
  });

  it('POST /uploads accepte un JPEG d’un joueur et renvoie un chemin /uploads/ servi en statique', async () => {
    const { token } = await createUser(app, { role: 'PLAYER' });

    const response = await upload('/uploads', token, JPEG);

    expect(response.statusCode).toBe(201);
    const { url } = response.json();
    expect(url).toMatch(/^\/uploads\/[\w-]+\.jpg$/);

    const served = await app.inject({ method: 'GET', url });
    expect(served.statusCode).toBe(200);
  });

  it('POST /uploads détecte un PNG par son contenu', async () => {
    const { token } = await createUser(app, { role: 'PLAYER' });

    const response = await upload('/uploads', token, PNG, { filename: 'photo.png', type: 'image/png' });

    expect(response.statusCode).toBe(201);
    expect(response.json().url).toMatch(/\.png$/);
  });

  it('POST /uploads refuse un fichier qui n’est pas une image, même déguisé en JPEG (415)', async () => {
    const { token } = await createUser(app, { role: 'PLAYER' });

    const response = await upload('/uploads', token, Buffer.from('<script>alert(1)</script>'));

    expect(response.statusCode).toBe(415);
    expect(response.json().error.code).toBe('UNSUPPORTED_MEDIA_TYPE');
  });

  it('POST /uploads refuse une image de plus de 5 Mo (413)', async () => {
    const { token } = await createUser(app, { role: 'PLAYER' });
    const tooBig = Buffer.concat([JPEG, Buffer.alloc(MAX_UPLOAD_BYTES)]);

    const response = await upload('/uploads', token, tooBig);

    expect(response.statusCode).toBe(413);
  });

  it('POST /uploads sans champ "file" répond 422 FILE_REQUIRED', async () => {
    const { token } = await createUser(app, { role: 'PLAYER' });

    const response = await upload('/uploads', token, JPEG, { field: 'image' });

    expect(response.statusCode).toBe(422);
    expect(response.json().error.code).toBe('FILE_REQUIRED');
  });

  it('/me/media est réservé aux créateurs (403 pour un joueur)', async () => {
    const { token } = await createUser(app, { role: 'PLAYER' });

    const response = await app.inject({
      method: 'GET',
      url: '/me/media',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(403);
  });

  it('POST puis GET /me/media : le créateur ne voit que ses images, les plus récentes d’abord', async () => {
    const alice = await createUser(app, { role: 'CREATOR' });
    const bob = await createUser(app, { role: 'CREATOR' });

    const first = (await upload('/me/media', alice.token, JPEG)).json();
    const second = await upload('/me/media', alice.token, PNG, { filename: 'b.png', type: 'image/png' });
    await upload('/me/media', bob.token, JPEG);

    expect(second.statusCode).toBe(201);
    expect(second.json()).toMatchObject({ id: expect.any(String), url: expect.stringMatching(/^\/uploads\//) });

    const response = await app.inject({
      method: 'GET',
      url: '/me/media',
      headers: { authorization: `Bearer ${alice.token}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().map((row: { id: string }) => row.id)).toEqual([second.json().id, first.id]);
  });

  it('DELETE /me/media/:id d’un autre créateur répond 403', async () => {
    const alice = await createUser(app, { role: 'CREATOR' });
    const bob = await createUser(app, { role: 'CREATOR' });
    const image = (await upload('/me/media', alice.token, JPEG)).json();

    const response = await app.inject({
      method: 'DELETE',
      url: `/me/media/${image.id}`,
      headers: { authorization: `Bearer ${bob.token}` },
    });

    expect(response.statusCode).toBe(403);
  });

  it('DELETE /me/media/:id répond 409 IMAGE_IN_USE avec usedIn si l’image illustre une histoire', async () => {
    const { token, user } = await createUser(app, { role: 'CREATOR' });
    const image = (await upload('/me/media', token, JPEG)).json();

    const [story] = await db
      .insert(stories)
      .values({ authorId: user.id, title: 'La Crypte', genre: 'Fantasy', coverUrl: image.url })
      .returning();
    const [scene] = await db
      .insert(scenes)
      .values({ storyId: story.id, title: 'Entrée', text: '...', backgroundUrl: image.url })
      .returning();

    const response = await app.inject({
      method: 'DELETE',
      url: `/me/media/${image.id}`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(409);
    const { error } = response.json();
    expect(error.code).toBe('IMAGE_IN_USE');
    expect(error.usedIn).toEqual(
      expect.arrayContaining([
        { kind: 'story', id: story.id, storyId: story.id, label: 'La Crypte' },
        { kind: 'scene', id: scene.id, storyId: story.id, label: 'Entrée' },
      ]),
    );
    expect(await fileExists(image.url)).toBe(true);
  });

  it('DELETE /me/media/:id supprime la ligne et le fichier quand l’image n’est plus utilisée', async () => {
    const { token } = await createUser(app, { role: 'CREATOR' });
    const image = (await upload('/me/media', token, JPEG)).json();

    const response = await app.inject({
      method: 'DELETE',
      url: `/me/media/${image.id}`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(204);
    expect(await fileExists(image.url)).toBe(false);

    const list = await app.inject({ method: 'GET', url: '/me/media', headers: { authorization: `Bearer ${token}` } });
    expect(list.json()).toEqual([]);
  });
});
