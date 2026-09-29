import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import type { StoryFullDto } from '../src/modules/creator/stories/schemas.js';
import { validateStory } from '../src/modules/creator/stories/validation.js';

type Scene = StoryFullDto['scenes'][number];
type Choice = Scene['choices'][number];

const HP = randomUUID();
const ATTACK = randomUUID();
const KEY = randomUUID();
const START = randomUUID();
const FIGHT = randomUUID();
const END = randomUUID();
const GOBLIN = randomUUID();

function choice(toSceneId: string, overrides: Partial<Choice> = {}): Choice {
  return { id: randomUUID(), toSceneId, label: 'Avancer', condition: null, effects: [], sortOrder: 0, ...overrides };
}

function scene(id: string, overrides: Partial<Scene> = {}): Scene {
  return {
    id,
    title: 'Scène',
    text: '',
    backgroundUrl: null,
    isEnding: false,
    enemyId: null,
    winSceneId: null,
    loseSceneId: null,
    onEnterEffects: [],
    sortOrder: 0,
    choices: [],
    ...overrides,
  };
}

/** Histoire valide : départ → combat contre un gobelin → fin. Chaque test en casse une règle. */
function validStory(): StoryFullDto {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    title: 'La Crypte',
    summary: '',
    genre: 'Fantasy',
    coverUrl: null,
    hasCombat: true,
    startSceneId: START,
    attackStatId: ATTACK,
    hpStatId: HP,
    published: false,
    publishedAt: null,
    createdAt: now,
    updatedAt: now,
    stats: [
      { id: HP, name: 'PV', type: 'number', defaultValue: '20', min: 0, max: 20, sortOrder: 0 },
      { id: ATTACK, name: 'Force', type: 'number', defaultValue: '5', min: 0, max: 10, sortOrder: 1 },
    ],
    enemies: [
      { id: GOBLIN, name: 'Gobelin', imageUrl: null, attack: 4, hp: 6, shield: 0, extraStats: [], defeatEffects: [], sortOrder: 0 },
    ],
    items: [{ id: KEY, name: 'Clé', description: null, imageUrl: null, useEffects: null, sortOrder: 0 }],
    scenes: [
      scene(START, { choices: [choice(FIGHT)] }),
      scene(FIGHT, { enemyId: GOBLIN, winSceneId: END }),
      scene(END, { isEnding: true }),
    ],
  };
}

function sceneById(story: StoryFullDto, id: string): Scene {
  return story.scenes.find((s) => s.id === id)!;
}

const errorCodes = (story: StoryFullDto) => validateStory(story).errors.map((error) => error.code);

describe('validation avant publication', () => {
  it("accepte une histoire complète, sans erreur ni avertissement", () => {
    expect(validateStory(validStory())).toEqual({ errors: [], warnings: [] });
  });

  it('1. exige une scène de départ', () => {
    const story = validStory();
    story.startSceneId = null;
    expect(errorCodes(story)).toContain('NO_START_SCENE');
  });

  it('2. exige au moins une scène de fin', () => {
    const story = validStory();
    sceneById(story, END).isEnding = false;
    sceneById(story, END).choices = [choice(START)];
    expect(errorCodes(story)).toEqual(['NO_ENDING']);
  });

  it("3. refuse une scène sans choix ni combat qui n'est pas une fin", () => {
    const story = validStory();
    sceneById(story, START).choices = [];
    const { errors } = validateStory(story);
    expect(errors).toContainEqual(expect.objectContaining({ code: 'DEAD_END', sceneId: START }));
  });

  it("4. refuse une scène de combat dans une histoire sans combats", () => {
    const story = validStory();
    story.hasCombat = false;
    expect(errorCodes(story)).toEqual(['COMBAT_DISABLED']);
  });

  it("4. une histoire sans combats n'a pas besoin de stat d'attaque ni de PV", () => {
    const story = validStory();
    story.hasCombat = false;
    story.attackStatId = null;
    story.hpStatId = null;
    sceneById(story, FIGHT).enemyId = null;
    sceneById(story, FIGHT).choices = [choice(END)];
    expect(validateStory(story).errors).toEqual([]);
  });

  it('5. exige une scène de victoire pour un combat', () => {
    const story = validStory();
    sceneById(story, FIGHT).winSceneId = null;
    expect(errorCodes(story)).toContain('NO_WIN_SCENE');
  });

  it("5. exige une stat d'attaque et une stat de PV dès qu'il y a un combat", () => {
    const story = validStory();
    story.attackStatId = null;
    expect(errorCodes(story)).toEqual(['COMBAT_STATS_MISSING']);
  });

  it('6. exige au moins un choix sans condition sur une scène ordinaire', () => {
    const story = validStory();
    sceneById(story, START).choices = [
      choice(FIGHT, { condition: { type: 'item', itemId: KEY, op: 'has' } }),
    ];
    expect(errorCodes(story)).toEqual(['NO_FREE_CHOICE']);
  });

  it("7. refuse des choix sur une scène de combat", () => {
    const story = validStory();
    sceneById(story, FIGHT).choices = [choice(END)];
    expect(errorCodes(story)).toEqual(['COMBAT_WITH_CHOICES']);
  });

  it('8. refuse une stat de PV avec un min au-dessus de 0', () => {
    const story = validStory();
    story.stats[0].min = 1;
    expect(errorCodes(story)).toEqual(['HP_STAT_MIN']);
  });

  it('8. accepte une stat de PV sans min', () => {
    const story = validStory();
    story.stats[0].min = null;
    expect(errorCodes(story)).toEqual([]);
  });

  it('9. refuse une stat de PV qui commence à 0', () => {
    const story = validStory();
    story.stats[0].defaultValue = '0';
    expect(errorCodes(story)).toEqual(['HP_STAT_DEFAULT']);
  });

  it("10. refuse un ennemi sur une scène de fin", () => {
    const story = validStory();
    sceneById(story, END).enemyId = GOBLIN;
    sceneById(story, END).winSceneId = END;
    expect(errorCodes(story)).toContain('ENDING_WITH_ENEMY');
  });

  it("11. refuse une condition sur un objet qui n'existe pas", () => {
    const story = validStory();
    sceneById(story, START).choices.push(
      choice(END, { condition: { type: 'item', itemId: randomUUID(), op: 'has' } }),
    );
    expect(errorCodes(story)).toEqual(['INVALID_REFERENCE']);
  });

  it('11. refuse un effet sur une stat texte', () => {
    const story = validStory();
    const name = randomUUID();
    story.stats.push({ id: name, name: 'Nom', type: 'text', defaultValue: '', min: null, max: null, sortOrder: 2 });
    sceneById(story, START).onEnterEffects = [{ type: 'stat', statId: name, delta: 1 }];
    expect(errorCodes(story)).toEqual(['INVALID_REFERENCE']);
  });

  it("11. vérifie aussi le butin des ennemis et les effets des objets", () => {
    const story = validStory();
    story.enemies[0].defeatEffects = [{ type: 'item', itemId: randomUUID(), qty: 1 }];
    story.items[0].useEffects = [{ type: 'stat', statId: randomUUID(), delta: 2 }];
    expect(errorCodes(story)).toEqual(['INVALID_REFERENCE', 'INVALID_REFERENCE']);
  });

  it("12. signale une scène inaccessible par un avertissement, sans erreur", () => {
    const story = validStory();
    const lost = randomUUID();
    story.scenes.push(scene(lost, { isEnding: true }));
    const { errors, warnings } = validateStory(story);
    expect(errors).toEqual([]);
    expect(warnings).toEqual([expect.objectContaining({ code: 'UNREACHABLE_SCENE', sceneId: lost })]);
  });

  it("12. une scène atteinte seulement par la défaite d'un combat n'est pas inaccessible", () => {
    const story = validStory();
    const defeat = randomUUID();
    story.scenes.push(scene(defeat, { isEnding: true }));
    sceneById(story, FIGHT).loseSceneId = defeat;
    expect(validateStory(story).warnings).toEqual([]);
  });
});
