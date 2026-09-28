import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { choices, enemies, items, scenes, statDefinitions, stories, users } from '../../db/schema/index.js';
import { saves } from '../../db/schema/play.js';
import { conditionLabel, evaluateCondition } from '../../engine/conditions.js';
import { applyEffects, isDead } from '../../engine/effects.js';
import type { CombatState, SaveStats } from '../../engine/schemas.js';
import type { Change, ItemDef, PlayState, StatDef } from '../../engine/types.js';
import { notFound, unprocessable } from '../../lib/errors.js';
import type { ChooseBody, GameStateDto, SaveSummaryDto, StartBody } from './schemas.js';

// Type de `tx` tel que fourni par db.transaction(async (tx) => ...) (voir src/db/seed.ts).
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbOrTx = typeof db | Tx;

type SceneRow = typeof scenes.$inferSelect;
type ChoiceRow = typeof choices.$inferSelect;
type StatRow = typeof statDefinitions.$inferSelect;
type ItemRow = typeof items.$inferSelect;
type EnemyRow = typeof enemies.$inferSelect;
type SaveRow = typeof saves.$inferSelect;
type SaveStatus = SaveRow['status'];

/** Tout ce qu'il faut, chargé une fois, pour faire avancer une partie sur une histoire donnée. */
interface StoryContext {
  hpStatId: string | null;
  statRows: StatRow[];
  stats: StatDef[];
  itemRows: ItemRow[];
  items: ItemDef[];
  scenesById: Map<string, SceneRow>;
  choicesByScene: Map<string, ChoiceRow[]>;
  enemiesById: Map<string, EnemyRow>;
}

async function loadStoryContext(executor: DbOrTx, storyId: string, hpStatId: string | null): Promise<StoryContext> {
  const [statRows, itemRows, sceneRows, enemyRows] = await Promise.all([
    executor
      .select()
      .from(statDefinitions)
      .where(eq(statDefinitions.storyId, storyId))
      .orderBy(asc(statDefinitions.sortOrder), asc(statDefinitions.id)),
    executor.select().from(items).where(eq(items.storyId, storyId)).orderBy(asc(items.sortOrder), asc(items.id)),
    executor.select().from(scenes).where(eq(scenes.storyId, storyId)),
    executor.select().from(enemies).where(eq(enemies.storyId, storyId)),
  ]);

  const sceneIds = sceneRows.map((scene) => scene.id);
  const choiceRows =
    sceneIds.length > 0
      ? await executor
          .select()
          .from(choices)
          .where(inArray(choices.fromSceneId, sceneIds))
          .orderBy(asc(choices.sortOrder), asc(choices.id))
      : [];

  const choicesByScene = new Map<string, ChoiceRow[]>();
  for (const choice of choiceRows) {
    const list = choicesByScene.get(choice.fromSceneId) ?? [];
    list.push(choice);
    choicesByScene.set(choice.fromSceneId, list);
  }

  return {
    hpStatId,
    statRows,
    stats: statRows.map((stat) => ({ id: stat.id, name: stat.name, type: stat.type, min: stat.min, max: stat.max })),
    itemRows,
    items: itemRows.map((item) => ({ id: item.id, name: item.name })),
    scenesById: new Map(sceneRows.map((scene) => [scene.id, scene])),
    choicesByScene,
    enemiesById: new Map(enemyRows.map((enemy) => [enemy.id, enemy])),
  };
}

interface ArrivalResult {
  state: PlayState;
  status: SaveStatus;
  combat: CombatState | null;
  changes: Change[];
}

/**
 * « Arrivée sur la scène » (docs/conception.md section 4) : une seule fonction,
 * appelée par start et choose (et plus tard le combat) à chaque déplacement du joueur.
 */
export function arriveOnScene(sceneId: string, state: PlayState, ctx: StoryContext): ArrivalResult {
  const scene = ctx.scenesById.get(sceneId)!;
  const isFirstVisit = !state.history.includes(sceneId);
  let nextState: PlayState = { ...state, history: [...state.history, sceneId] };
  let changes: Change[] = [];

  if (isFirstVisit) {
    const applied = applyEffects(scene.onEnterEffects, nextState, ctx.stats, ctx.items);
    nextState = applied.state;
    changes = applied.changes;
    if (isDead(nextState, ctx.hpStatId)) {
      return { state: nextState, status: 'DEAD', combat: null, changes };
    }
  }

  if (scene.isEnding) {
    return { state: nextState, status: 'FINISHED', combat: null, changes };
  }

  if (scene.enemyId) {
    const enemy = ctx.enemiesById.get(scene.enemyId)!;
    const combat: CombatState = { enemyId: scene.enemyId, enemyHp: enemy.hp, enemyShield: enemy.shield, log: [] };
    return { state: nextState, status: 'IN_PROGRESS', combat, changes };
  }

  return { state: nextState, status: 'IN_PROGRESS', combat: null, changes };
}

function buildGameState(ctx: StoryContext, save: SaveRow, changes: Change[]): GameStateDto {
  const scene = ctx.scenesById.get(save.currentSceneId)!;
  const state: PlayState = { stats: save.stats, inventory: save.inventory, history: save.history };

  const showChoices = save.status === 'IN_PROGRESS' && !save.combat;
  const sceneChoices = showChoices ? (ctx.choicesByScene.get(scene.id) ?? []) : [];
  const choicesDto = sceneChoices.map((choice) => ({
    id: choice.id,
    label: choice.label,
    locked: choice.condition !== null && !evaluateCondition(choice.condition, state),
    conditionLabel: choice.condition ? conditionLabel(choice.condition, ctx.stats, ctx.items) : null,
  }));

  const statsDto = ctx.statRows.map((stat) => ({
    id: stat.id,
    name: stat.name,
    type: stat.type,
    value: save.stats[stat.id] ?? (stat.type === 'number' ? 0 : ''),
    min: stat.min,
    max: stat.max,
  }));

  const inventoryDto = ctx.itemRows
    .filter((item) => (save.inventory[item.id] ?? 0) > 0)
    .map((item) => ({
      id: item.id,
      name: item.name,
      imageUrl: item.imageUrl,
      description: item.description,
      qty: save.inventory[item.id],
      usable: (item.useEffects?.length ?? 0) > 0,
    }));

  let combatDto: GameStateDto['combat'] = null;
  if (save.combat) {
    const enemy = ctx.enemiesById.get(save.combat.enemyId)!;
    const heroHpValue = ctx.hpStatId ? save.stats[ctx.hpStatId] : undefined;
    combatDto = {
      enemy: {
        name: enemy.name,
        imageUrl: enemy.imageUrl,
        attack: enemy.attack,
        hpMax: enemy.hp,
        shieldMax: enemy.shield,
        extraStats: enemy.extraStats,
      },
      enemyHp: save.combat.enemyHp,
      enemyShield: save.combat.enemyShield,
      heroHp: typeof heroHpValue === 'number' ? heroHpValue : 0,
      log: save.combat.log,
    };
  }

  return {
    storyId: save.storyId,
    status: save.status,
    scene: { id: scene.id, title: scene.title, text: scene.text, backgroundUrl: scene.backgroundUrl, isEnding: scene.isEnding },
    choices: choicesDto,
    stats: statsDto,
    hpStatId: ctx.hpStatId,
    heroFaceUrl: save.heroFaceUrl,
    inventory: inventoryDto,
    changes,
    combat: combatDto,
  };
}

function noSave(): never {
  throw notFound('Aucune partie sur cette histoire', 'NO_SAVE');
}

export async function start(userId: string, storyId: string, input: StartBody): Promise<GameStateDto> {
  return db.transaction(async (tx) => {
    const [story] = await tx.select().from(stories).where(eq(stories.id, storyId));
    if (!story || !story.published || !story.startSceneId) {
      throw notFound();
    }

    const ctx = await loadStoryContext(tx, storyId, story.hpStatId);

    const [user] = await tx.select({ avatarUrl: users.avatarUrl }).from(users).where(eq(users.id, userId));
    const heroFaceUrl = input.heroFaceUrl ?? user?.avatarUrl ?? null;

    const initialStats: SaveStats = {};
    for (const stat of ctx.statRows) {
      if (stat.type === 'number') {
        const parsed = Number.parseInt(stat.defaultValue, 10);
        initialStats[stat.id] = Number.isNaN(parsed) ? 0 : parsed;
      } else {
        const provided = input.textStats?.[stat.id];
        initialStats[stat.id] = provided && provided.length > 0 && provided.length <= 50 ? provided : stat.defaultValue;
      }
    }

    const initialState: PlayState = { stats: initialStats, inventory: {}, history: [] };
    const arrival = arriveOnScene(story.startSceneId, initialState, ctx);

    const values = {
      userId,
      storyId,
      currentSceneId: story.startSceneId,
      stats: arrival.state.stats,
      heroFaceUrl,
      history: arrival.state.history,
      inventory: arrival.state.inventory,
      combat: arrival.combat,
      status: arrival.status,
    };

    const [saved] = await tx
      .insert(saves)
      .values(values)
      .onConflictDoUpdate({ target: [saves.userId, saves.storyId], set: values })
      .returning();

    return buildGameState(ctx, saved, arrival.changes);
  });
}

export async function getState(userId: string, storyId: string): Promise<GameStateDto> {
  const [save] = await db.select().from(saves).where(and(eq(saves.userId, userId), eq(saves.storyId, storyId)));
  if (!save) {
    noSave();
  }

  const [story] = await db.select({ hpStatId: stories.hpStatId }).from(stories).where(eq(stories.id, storyId));
  const ctx = await loadStoryContext(db, storyId, story?.hpStatId ?? null);
  return buildGameState(ctx, save, []);
}

export async function choose(userId: string, storyId: string, body: ChooseBody): Promise<GameStateDto> {
  return db.transaction(async (tx) => {
    const [save] = await tx
      .select()
      .from(saves)
      .where(and(eq(saves.userId, userId), eq(saves.storyId, storyId)))
      .for('update');
    if (!save) {
      noSave();
    }
    if (save.status !== 'IN_PROGRESS') {
      throw unprocessable('GAME_OVER', 'La partie est terminée');
    }
    if (save.combat) {
      throw unprocessable('IN_COMBAT', 'Un combat est en cours');
    }

    const [choiceRow] = await tx.select().from(choices).where(eq(choices.id, body.choiceId));
    if (!choiceRow || choiceRow.fromSceneId !== save.currentSceneId) {
      throw unprocessable('INVALID_CHOICE', 'Ce choix ne part pas de la scène courante');
    }

    const [story] = await tx.select({ hpStatId: stories.hpStatId }).from(stories).where(eq(stories.id, storyId));
    const ctx = await loadStoryContext(tx, storyId, story?.hpStatId ?? null);

    let state: PlayState = { stats: save.stats, inventory: save.inventory, history: save.history };

    if (choiceRow.condition && !evaluateCondition(choiceRow.condition, state)) {
      throw unprocessable('CHOICE_LOCKED', "La condition de ce choix n'est pas remplie");
    }

    const applied = applyEffects(choiceRow.effects, state, ctx.stats, ctx.items);
    state = applied.state;
    let changes = applied.changes;

    let currentSceneId = save.currentSceneId;
    let status: SaveStatus = save.status;
    let combat: CombatState | null = null;

    if (isDead(state, ctx.hpStatId)) {
      status = 'DEAD';
    } else {
      const arrival = arriveOnScene(choiceRow.toSceneId, state, ctx);
      state = arrival.state;
      status = arrival.status;
      combat = arrival.combat;
      changes = [...changes, ...arrival.changes];
      currentSceneId = choiceRow.toSceneId;
    }

    const [updated] = await tx
      .update(saves)
      .set({ currentSceneId, stats: state.stats, inventory: state.inventory, history: state.history, combat, status })
      .where(eq(saves.id, save.id))
      .returning();

    return buildGameState(ctx, updated, changes);
  });
}

export async function abandon(userId: string, storyId: string): Promise<void> {
  const deleted = await db
    .delete(saves)
    .where(and(eq(saves.userId, userId), eq(saves.storyId, storyId)))
    .returning({ id: saves.id });
  if (deleted.length === 0) {
    noSave();
  }
}

export async function listMySaves(userId: string): Promise<SaveSummaryDto[]> {
  const rows = await db
    .select({
      storyId: stories.id,
      title: stories.title,
      coverUrl: stories.coverUrl,
      status: saves.status,
      updatedAt: saves.updatedAt,
    })
    .from(saves)
    .innerJoin(stories, eq(saves.storyId, stories.id))
    .where(and(eq(saves.userId, userId), eq(stories.published, true)))
    .orderBy(desc(saves.updatedAt));

  return rows.map((row) => ({
    story: { id: row.storyId, title: row.title, coverUrl: row.coverUrl },
    status: row.status,
    updatedAt: row.updatedAt.toISOString(),
  }));
}
