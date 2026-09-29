import { cryptStory, lighthouseStory, tombStory, type SeedStory } from '../seed-data.js';
import { borealisStory } from './borealis.js';
import { kitchenStory } from './cuisine.js';
import { lepicStory } from './lepic.js';
import { lisbonStory } from './lisbonne.js';
import { piratesStory } from './pirates.js';

/** Toutes les histoires insérées par le seed, dans l'ordre d'insertion. */
export const seedStories: SeedStory[] = [
  cryptStory,
  lighthouseStory,
  tombStory,
  piratesStory,
  lepicStory,
  lisbonStory,
  borealisStory,
  kitchenStory,
];
