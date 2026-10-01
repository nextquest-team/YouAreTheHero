import { z } from 'zod';

// Chemin d'upload : un nom de fichier simple dans /uploads/, sans sous-dossier ni `..`.
export const uploadPathSchema = z.string().regex(/^\/uploads\/[\w.-]+$/);
