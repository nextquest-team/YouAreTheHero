import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../src/db/index.js';
import { choices, enemies, favorites, items, saves, scenes, statDefinitions, stories } from '../src/db/schema/index.js';
import { users } from '../src/db/schema/users.js';
import { resetDb } from './helpers/db.js';

/** Crée un utilisateur et retourne son id. */
async function createUser(role: 'PLAYER' | 'CREATOR' = 'CREATOR') {
  const [user] = await db
    .insert(users)
    .values({
      email: `${role.toLowerCase()}-${crypto.randomUUID()}@demo.fr`,
      passwordHash: 'hash',
      displayName: 'Demo',
      role,
    })
    .returning();
  return user;
}

/** Crée une histoire minimale appartenant à `authorId`. */
async function createStory(authorId: string) {
  const [story] = await db
    .insert(stories)
    .values({ authorId, title: 'Titre', genre: 'Fantastique' })
    .returning();
  return story;
}

describe('schéma Drizzle : suppressions en cascade / SET NULL', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('supprimer une histoire supprime ses stats, ennemis, objets, scènes, choix et saves', async () => {
    const author = await createUser('CREATOR');
    const player = await createUser('PLAYER');
    const story = await createStory(author.id);

    const [stat] = await db
      .insert(statDefinitions)
      .values({ storyId: story.id, name: 'Force', type: 'number', defaultValue: '5' })
      .returning();
    const [enemy] = await db
      .insert(enemies)
      .values({ storyId: story.id, name: 'Gobelin', attack: 2, hp: 5 })
      .returning();
    const [item] = await db
      .insert(items)
      .values({ storyId: story.id, name: 'Clé' })
      .returning();
    const [sceneA] = await db
      .insert(scenes)
      .values({ storyId: story.id, title: 'Scène A', text: 'texte' })
      .returning();
    const [sceneB] = await db
      .insert(scenes)
      .values({ storyId: story.id, title: 'Scène B', text: 'texte' })
      .returning();
    const [choice] = await db
      .insert(choices)
      .values({ fromSceneId: sceneA.id, toSceneId: sceneB.id, label: 'Avancer' })
      .returning();
    const [save] = await db
      .insert(saves)
      .values({ userId: player.id, storyId: story.id, currentSceneId: sceneA.id })
      .returning();

    await db.delete(stories).where(eq(stories.id, story.id));

    expect(await db.select().from(statDefinitions).where(eq(statDefinitions.id, stat.id))).toHaveLength(0);
    expect(await db.select().from(enemies).where(eq(enemies.id, enemy.id))).toHaveLength(0);
    expect(await db.select().from(items).where(eq(items.id, item.id))).toHaveLength(0);
    expect(await db.select().from(scenes).where(eq(scenes.id, sceneA.id))).toHaveLength(0);
    expect(await db.select().from(choices).where(eq(choices.id, choice.id))).toHaveLength(0);
    expect(await db.select().from(saves).where(eq(saves.id, save.id))).toHaveLength(0);
  });

  it('supprimer une scène supprime les choix qui y mènent et remet start_scene_id / win_scene_id à null', async () => {
    const author = await createUser('CREATOR');
    const story = await createStory(author.id);

    const [target] = await db
      .insert(scenes)
      .values({ storyId: story.id, title: 'Cible', text: 'texte' })
      .returning();
    const [other] = await db
      .insert(scenes)
      .values({ storyId: story.id, title: 'Autre', text: 'texte', winSceneId: target.id })
      .returning();
    const [choiceIn] = await db
      .insert(choices)
      .values({ fromSceneId: other.id, toSceneId: target.id, label: 'Vers la cible' })
      .returning();

    await db.update(stories).set({ startSceneId: target.id }).where(eq(stories.id, story.id));

    await db.delete(scenes).where(eq(scenes.id, target.id));

    expect(await db.select().from(choices).where(eq(choices.id, choiceIn.id))).toHaveLength(0);

    const [updatedStory] = await db.select().from(stories).where(eq(stories.id, story.id));
    expect(updatedStory.startSceneId).toBeNull();

    const [updatedOther] = await db.select().from(scenes).where(eq(scenes.id, other.id));
    expect(updatedOther.winSceneId).toBeNull();
  });

  it('supprimer un ennemi remet enemy_id à null sur ses scènes', async () => {
    const author = await createUser('CREATOR');
    const story = await createStory(author.id);
    const [enemy] = await db
      .insert(enemies)
      .values({ storyId: story.id, name: 'Gobelin', attack: 2, hp: 5 })
      .returning();
    const [scene] = await db
      .insert(scenes)
      .values({ storyId: story.id, title: 'Combat', text: 'texte', enemyId: enemy.id })
      .returning();

    await db.delete(enemies).where(eq(enemies.id, enemy.id));

    const [updatedScene] = await db.select().from(scenes).where(eq(scenes.id, scene.id));
    expect(updatedScene.enemyId).toBeNull();
  });

  it('supprimer une stat remet hp_stat_id à null sur son histoire', async () => {
    const author = await createUser('CREATOR');
    const story = await createStory(author.id);
    const [stat] = await db
      .insert(statDefinitions)
      .values({ storyId: story.id, name: 'PV', type: 'number', defaultValue: '10' })
      .returning();

    await db.update(stories).set({ hpStatId: stat.id }).where(eq(stories.id, story.id));

    await db.delete(statDefinitions).where(eq(statDefinitions.id, stat.id));

    const [updatedStory] = await db.select().from(stories).where(eq(stories.id, story.id));
    expect(updatedStory.hpStatId).toBeNull();
  });

  it('deux saves pour le même (user, story) violent la contrainte d’unicité', async () => {
    const author = await createUser('CREATOR');
    const player = await createUser('PLAYER');
    const story = await createStory(author.id);
    const [scene] = await db
      .insert(scenes)
      .values({ storyId: story.id, title: 'Scène', text: 'texte' })
      .returning();

    await db.insert(saves).values({ userId: player.id, storyId: story.id, currentSceneId: scene.id });

    await expect(
      db.insert(saves).values({ userId: player.id, storyId: story.id, currentSceneId: scene.id }),
    ).rejects.toThrow();
  });

  it('une note (rating) hors de 1 à 5 est refusée par la contrainte check', async () => {
    const author = await createUser('CREATOR');
    const player = await createUser('PLAYER');
    const story = await createStory(author.id);

    await expect(
      db.execute(
        `insert into reviews (user_id, story_id, rating) values ('${player.id}', '${story.id}', 6)`,
      ),
    ).rejects.toThrow();
  });

  it('favorites a bien une clé primaire composite (user_id, story_id)', async () => {
    const author = await createUser('CREATOR');
    const player = await createUser('PLAYER');
    const story = await createStory(author.id);

    await db.insert(favorites).values({ userId: player.id, storyId: story.id });

    await expect(db.insert(favorites).values({ userId: player.id, storyId: story.id })).rejects.toThrow();
  });
});
