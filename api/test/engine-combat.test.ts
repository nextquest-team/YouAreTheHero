import { describe, expect, it } from 'vitest';
import { resolveCombatTurn } from '../src/engine/combat.js';

/** Un dé truqué qui rejoue la même séquence de valeurs, en boucle. */
function fixedRolls(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

describe('resolveCombatTurn', () => {
  it('le héros gagne le tour : l’ennemi perd 2 PV quand il n’a plus de bouclier', () => {
    const result = resolveCombatTurn({
      heroAttackStat: 5,
      enemyName: 'Goule',
      enemyAttack: 5,
      enemyHp: 8,
      enemyShield: 0,
      roll: fixedRolls([6, 1]), // héros 5+6=11, ennemi 5+1=6
    });

    expect(result.enemyHp).toBe(6);
    expect(result.enemyShield).toBe(0);
    expect(result.heroDamage).toBe(0);
    expect(result.log).toBe('Tu fais 11, Goule 6 : Goule perd 2 PV');
  });

  it("l'ennemi gagne le tour : le héros perd 2 PV", () => {
    const result = resolveCombatTurn({
      heroAttackStat: 1,
      enemyName: 'Goule',
      enemyAttack: 5,
      enemyHp: 8,
      enemyShield: 0,
      roll: fixedRolls([1, 6]), // héros 1+1=2, ennemi 5+6=11
    });

    expect(result.enemyHp).toBe(8);
    expect(result.enemyShield).toBe(0);
    expect(result.heroDamage).toBe(2);
    expect(result.log).toBe('Tu fais 2, Goule 11 : tu perds 2 PV');
  });

  it('égalité : personne ne perd de PV', () => {
    const result = resolveCombatTurn({
      heroAttackStat: 5,
      enemyName: 'Goule',
      enemyAttack: 5,
      enemyHp: 8,
      enemyShield: 0,
      roll: fixedRolls([3, 3]), // 8 partout
    });

    expect(result.enemyHp).toBe(8);
    expect(result.enemyShield).toBe(0);
    expect(result.heroDamage).toBe(0);
    expect(result.log).toBe('Tu fais 8, Goule 8 : égalité, personne ne perd de PV');
  });

  it('un bouclier suffisant absorbe le coup en entier, sans toucher les PV', () => {
    const result = resolveCombatTurn({
      heroAttackStat: 5,
      enemyName: 'Goule',
      enemyAttack: 5,
      enemyHp: 8,
      enemyShield: 3,
      roll: fixedRolls([6, 1]), // héros gagne
    });

    expect(result.enemyShield).toBe(1);
    expect(result.enemyHp).toBe(8);
  });

  it('le bouclier ne se recharge pas : un deuxième coup consécutif finit de le vider et entame les PV', () => {
    const heroWins = fixedRolls([6, 1]);

    const first = resolveCombatTurn({
      heroAttackStat: 5,
      enemyName: 'Goule',
      enemyAttack: 5,
      enemyHp: 8,
      enemyShield: 3,
      roll: heroWins,
    });
    expect(first.enemyShield).toBe(1);
    expect(first.enemyHp).toBe(8);

    // Deuxième coup : chevauche le reste du bouclier (1) et les PV (1 perdu).
    const second = resolveCombatTurn({
      heroAttackStat: 5,
      enemyName: 'Goule',
      enemyAttack: 5,
      enemyHp: first.enemyHp,
      enemyShield: first.enemyShield,
      roll: heroWins,
    });
    expect(second.enemyShield).toBe(0);
    expect(second.enemyHp).toBe(7);
    expect(second.log).toBe('Tu fais 11, Goule 6 : le bouclier de Goule absorbe 1, Goule perd 1 PV');
  });

  it('bouclier déjà à 0 : les PV encaissent tous les dégâts', () => {
    const result = resolveCombatTurn({
      heroAttackStat: 5,
      enemyName: 'Goule',
      enemyAttack: 5,
      enemyHp: 8,
      enemyShield: 0,
      roll: fixedRolls([6, 1]),
    });

    expect(result.enemyShield).toBe(0);
    expect(result.enemyHp).toBe(6);
    expect(result.log).toBe('Tu fais 11, Goule 6 : Goule perd 2 PV');
  });

  it('les PV de l’ennemi ne descendent jamais sous 0', () => {
    const result = resolveCombatTurn({
      heroAttackStat: 5,
      enemyName: 'Goule',
      enemyAttack: 5,
      enemyHp: 1,
      enemyShield: 0,
      roll: fixedRolls([6, 1]),
    });

    expect(result.enemyHp).toBe(0);
  });
});
