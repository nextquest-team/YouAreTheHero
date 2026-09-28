import { pgEnum } from 'drizzle-orm/pg-core';

/** Rôle d'un utilisateur : joueur ou créateur d'histoires. */
export const roleEnum = pgEnum('role', ['PLAYER', 'CREATOR']);

/** Type d'une caractéristique : numérique (jauge bornée) ou texte (ex. nom du héros). */
export const statTypeEnum = pgEnum('stat_type', ['number', 'text']);

/** État d'une partie sauvegardée. */
export const saveStatusEnum = pgEnum('save_status', ['IN_PROGRESS', 'FINISHED', 'DEAD']);
