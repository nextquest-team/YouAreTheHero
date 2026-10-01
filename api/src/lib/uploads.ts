import { randomUUID } from 'node:crypto';
import { unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { FastifyRequest } from 'fastify';
import { env } from '../config/env.js';
import { HttpError, unprocessable } from './errors.js';

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

// On se fie aux premiers octets du fichier plutôt qu'au Content-Type envoyé par le client.
const SIGNATURES = [
  { ext: 'jpg', bytes: [0xff, 0xd8, 0xff] },
  { ext: 'png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
] as const;

function detectExtension(buffer: Buffer): string | null {
  const match = SIGNATURES.find((signature) => signature.bytes.every((byte, index) => buffer[index] === byte));
  return match?.ext ?? null;
}

/**
 * Lit le champ multipart "file", vérifie que c'est un JPEG ou un PNG de 5 Mo au plus,
 * l'écrit dans UPLOADS_DIR sous un nom aléatoire et renvoie son chemin relatif "/uploads/...".
 */
export async function saveUploadedImage(request: FastifyRequest): Promise<string> {
  const file = await request.file();
  if (!file || file.fieldname !== 'file') {
    throw unprocessable('FILE_REQUIRED', 'Le champ multipart "file" est requis');
  }

  // toBuffer() lève une erreur 413 si la limite fileSize de @fastify/multipart est dépassée.
  const buffer = await file.toBuffer();
  const ext = detectExtension(buffer);
  if (!ext) {
    throw new HttpError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Seules les images JPEG et PNG sont acceptées');
  }

  const filename = `${randomUUID()}.${ext}`;
  await writeFile(path.join(env.UPLOADS_DIR, filename), buffer);
  return `/uploads/${filename}`;
}

/** Supprime le fichier derrière un chemin "/uploads/..." ; un fichier déjà absent n'est pas une erreur. */
export async function removeUploadedFile(url: string): Promise<void> {
  const filename = path.basename(url);
  try {
    await unlink(path.join(env.UPLOADS_DIR, filename));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}
