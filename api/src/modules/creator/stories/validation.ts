import type { Condition, Effect } from '../../../engine/schemas.js';
import type { PublishIssue, StoryFullDto } from './schemas.js';

type Scene = StoryFullDto['scenes'][number];

/** Erreurs (bloquent la publication) et avertissements (affichés, sans bloquer). */
export type ValidationReport = { errors: PublishIssue[]; warnings: PublishIssue[] };

function issue(code: string, message: string, scene?: Scene): PublishIssue {
  return { code, message, sceneId: scene?.id ?? null };
}

const isCombat = (scene: Scene) => scene.enemyId !== null;

/**
 * Règles de publication de docs/conception.md (section 4, « Validation avant publication ») :
 * une règle par bloc, dans le même ordre. Fonction pure, testée sans base de données.
 */
export function validateStory(story: StoryFullDto): ValidationReport {
  const errors: PublishIssue[] = [];
  const warnings: PublishIssue[] = [];
  const { scenes } = story;

  // 1. Une scène de départ est définie.
  if (story.startSceneId === null) {
    errors.push(issue('NO_START_SCENE', 'Choisis la scène de départ'));
  }

  // 2. Au moins une scène de fin.
  if (!scenes.some((scene) => scene.isEnding)) {
    errors.push(issue('NO_ENDING', "L'histoire n'a aucune scène de fin"));
  }

  for (const scene of scenes) {
    // 3. Une scène qui n'est pas une fin a au moins un choix ou un combat.
    if (!scene.isEnding && !isCombat(scene) && scene.choices.length === 0) {
      errors.push(issue('DEAD_END', "Cette scène n'a ni choix ni combat", scene));
    }

    // 4. Pas de scène de combat dans une histoire sans combats.
    if (!story.hasCombat && isCombat(scene)) {
      errors.push(issue('COMBAT_DISABLED', "L'histoire est sans combats mais cette scène a un ennemi", scene));
    }

    // 5. Une scène de combat a une scène de victoire.
    if (isCombat(scene) && scene.winSceneId === null) {
      errors.push(issue('NO_WIN_SCENE', "Ce combat n'a pas de scène de victoire", scene));
    }

    // 6. Une scène ordinaire avec des choix en a au moins un sans condition (sinon le joueur peut être bloqué).
    if (
      !scene.isEnding &&
      !isCombat(scene) &&
      scene.choices.length > 0 &&
      scene.choices.every((choice) => choice.condition !== null)
    ) {
      errors.push(issue('NO_FREE_CHOICE', 'Tous les choix de cette scène ont une condition', scene));
    }

    // 7. Une scène de combat n'a pas de choix.
    if (isCombat(scene) && scene.choices.length > 0) {
      errors.push(issue('COMBAT_WITH_CHOICES', 'Une scène de combat ne peut pas avoir de choix', scene));
    }

    // 10. Une scène de fin n'a pas d'ennemi.
    if (scene.isEnding && isCombat(scene)) {
      errors.push(issue('ENDING_WITH_ENEMY', 'Une scène de fin ne peut pas avoir de combat', scene));
    }
  }

  // 5 (suite). Un combat a besoin d'une stat d'attaque et d'une stat de PV.
  if (scenes.some(isCombat) && (story.attackStatId === null || story.hpStatId === null)) {
    errors.push(issue('COMBAT_STATS_MISSING', "Choisis la stat d'attaque et la stat de PV du héros"));
  }

  // 8 et 9. La stat de PV est numérique, sans min au-dessus de 0, et commence au-dessus de 0.
  const hpStat = story.stats.find((stat) => stat.id === story.hpStatId);
  if (hpStat) {
    if (hpStat.type !== 'number' || (hpStat.min !== null && hpStat.min !== 0)) {
      errors.push(issue('HP_STAT_MIN', 'La stat de PV doit être un nombre avec un min de 0 ou sans min'));
    } else if (Number(hpStat.defaultValue) <= 0) {
      errors.push(issue('HP_STAT_DEFAULT', 'La stat de PV doit commencer au-dessus de 0'));
    }
  }

  // 11. Les stats et objets cités par une condition ou un effet existent, et les stats sont numériques.
  errors.push(...checkReferences(story));

  // 12. Avertissement : scènes qu'on ne peut pas atteindre depuis le départ.
  if (story.startSceneId !== null) {
    const reachable = reachableFrom(story.startSceneId, scenes);
    for (const scene of scenes) {
      if (!reachable.has(scene.id)) {
        warnings.push(issue('UNREACHABLE_SCENE', 'Aucun chemin ne mène à cette scène', scene));
      }
    }
  }

  return { errors, warnings };
}

function checkReferences(story: StoryFullDto): PublishIssue[] {
  const numberStats = new Set(story.stats.filter((stat) => stat.type === 'number').map((stat) => stat.id));
  const itemIds = new Set(story.items.map((item) => item.id));
  const broken = (ref: Condition | Effect) =>
    ref.type === 'stat' ? !numberStats.has(ref.statId) : !itemIds.has(ref.itemId);

  const found: PublishIssue[] = [];
  const report = (refs: (Condition | Effect)[], message: string, scene?: Scene) => {
    if (refs.some(broken)) {
      found.push(issue('INVALID_REFERENCE', message, scene));
    }
  };

  for (const scene of story.scenes) {
    report(scene.onEnterEffects, "Un effet d'arrivée cite une stat ou un objet invalide", scene);
    for (const choice of scene.choices) {
      const refs = choice.condition ? [choice.condition, ...choice.effects] : choice.effects;
      report(refs, `Le choix « ${choice.label} » cite une stat ou un objet invalide`, scene);
    }
  }
  for (const enemy of story.enemies) {
    report(enemy.defeatEffects, `Le butin de « ${enemy.name} » cite une stat ou un objet invalide`);
  }
  for (const item of story.items) {
    report(item.useEffects ?? [], `L'objet « ${item.name} » a un effet qui cite une stat ou un objet invalide`);
  }
  return found;
}

/** Parcours depuis la scène de départ, par les choix et par les issues des combats. */
function reachableFrom(startId: string, scenes: Scene[]): Set<string> {
  const byId = new Map(scenes.map((scene) => [scene.id, scene]));
  const seen = new Set<string>([startId]);
  const queue = [startId];
  while (queue.length > 0) {
    const scene = byId.get(queue.shift()!);
    if (!scene) {
      continue;
    }
    const next = [...scene.choices.map((choice) => choice.toSceneId), scene.winSceneId, scene.loseSceneId];
    for (const id of next) {
      if (id !== null && !seen.has(id)) {
        seen.add(id);
        queue.push(id);
      }
    }
  }
  return seen;
}
