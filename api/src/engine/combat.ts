// Un tour de combat au tour par tour (docs/conception.md point 6) : fonction pure, le dé est
// injecté (`roll`) pour rendre les tests reproductibles. Le service décide du dé par défaut.

export interface CombatTurnInput {
  /** Valeur actuelle de la stat d'attaque du héros (story.attack_stat_id). */
  heroAttackStat: number;
  enemyName: string;
  enemyAttack: number;
  enemyHp: number;
  enemyShield: number;
  /** Un jet de dé à 6 faces (1 à 6), appelé une fois pour le héros et une fois pour l'ennemi. */
  roll: () => number;
}

export interface CombatTurnResult {
  enemyHp: number;
  enemyShield: number;
  /** Dégâts subis par le héros ce tour-ci : 0 ou 2. Au service de les appliquer à la stat PV,
   * qui reste la seule source de vérité pour les PV du héros (bornée par son min/max). */
  heroDamage: number;
  /** Ligne de log en français, à ajouter à `combat.log`. */
  log: string;
}

const DAMAGE = 2;

/**
 * Résout un tour : stat d'attaque du héros + 1d6 contre attack de l'ennemi + 1d6, le plus faible
 * perd 2 PV, égalité => personne ne perd rien. Le bouclier de l'ennemi absorbe les dégâts avant
 * ses PV et ne se recharge jamais : un coup peut donc à la fois vider le reste du bouclier et
 * entamer les PV (ex. bouclier à 1, coup de 2 : bouclier à 0 et 1 PV perdu).
 */
export function resolveCombatTurn(input: CombatTurnInput): CombatTurnResult {
  const heroScore = input.heroAttackStat + input.roll();
  const enemyScore = input.enemyAttack + input.roll();
  const { enemyName } = input;

  if (heroScore > enemyScore) {
    const absorbed = Math.min(input.enemyShield, DAMAGE);
    const enemyShield = input.enemyShield - absorbed;
    const hpLost = DAMAGE - absorbed;
    const enemyHp = Math.max(0, input.enemyHp - hpLost);

    let log: string;
    if (hpLost === 0) {
      log = `Tu fais ${heroScore}, ${enemyName} ${enemyScore} : le bouclier de ${enemyName} absorbe le coup`;
    } else if (absorbed === 0) {
      log = `Tu fais ${heroScore}, ${enemyName} ${enemyScore} : ${enemyName} perd ${hpLost} PV`;
    } else {
      log = `Tu fais ${heroScore}, ${enemyName} ${enemyScore} : le bouclier de ${enemyName} absorbe ${absorbed}, ${enemyName} perd ${hpLost} PV`;
    }

    return { enemyHp, enemyShield, heroDamage: 0, log };
  }

  if (enemyScore > heroScore) {
    return {
      enemyHp: input.enemyHp,
      enemyShield: input.enemyShield,
      heroDamage: DAMAGE,
      log: `Tu fais ${heroScore}, ${enemyName} ${enemyScore} : tu perds ${DAMAGE} PV`,
    };
  }

  return {
    enemyHp: input.enemyHp,
    enemyShield: input.enemyShield,
    heroDamage: 0,
    log: `Tu fais ${heroScore}, ${enemyName} ${enemyScore} : égalité, personne ne perd de PV`,
  };
}
