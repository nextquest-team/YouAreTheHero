// Données du seed de démo : deux comptes et deux histoires
// de l'auteur, une publiée et jouable, une brouillon. Les conditions/effets référencent leurs
// stats/objets/ennemis par une clé symbolique (ex. « force », « cle ») plutôt que par un uuid :
// seed.ts les résout vers les vrais id une fois les lignes insérées (voir docs/conception.md §3).

export type StatType = 'number' | 'text';

export interface DemoUser {
  email: string;
  password: string;
  displayName: string;
  role: 'PLAYER' | 'CREATOR';
}

export interface SeedStat {
  key: string;
  name: string;
  type: StatType;
  defaultValue: string;
  min: number | null;
  max: number | null;
}

export interface SeedExtraStat {
  name: string;
  value: string;
}

export interface SeedEnemy {
  key: string;
  name: string;
  imageUrl: string | null;
  attack: number;
  hp: number;
  shield: number;
  extraStats: SeedExtraStat[];
  defeatEffects: SeedEffect[];
}

export type SeedCondition =
  | { type: 'stat'; statKey: string; op: '>=' | '<=' | '=='; value: number }
  | { type: 'item'; itemKey: string; op: 'has' | 'not_has' };

export type SeedEffect =
  | { type: 'stat'; statKey: string; delta: number }
  | { type: 'item'; itemKey: string; qty: number };

export interface SeedItem {
  key: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  useEffects: SeedEffect[] | null;
}

export interface SeedChoice {
  fromKey: string;
  toKey: string;
  label: string;
  condition: SeedCondition | null;
  effects: SeedEffect[];
}

export interface SeedScene {
  key: string;
  title: string;
  text: string;
  backgroundUrl: string | null;
  isEnding: boolean;
  enemyKey: string | null;
  winSceneKey: string | null;
  loseSceneKey: string | null;
  onEnterEffects: SeedEffect[];
}

export interface SeedStory {
  title: string;
  summary: string;
  genre: string;
  coverUrl: string | null;
  published: boolean;
  hasCombat: boolean;
  stats: SeedStat[];
  attackStatKey: string | null;
  hpStatKey: string | null;
  enemies: SeedEnemy[];
  items: SeedItem[];
  scenes: SeedScene[];
  startSceneKey: string | null;
  choices: SeedChoice[];
}

export const demoUsers: DemoUser[] = [
  { email: 'joueur@demo.fr', password: 'demo1234', displayName: 'Joueur Démo', role: 'PLAYER' },
  { email: 'auteur@demo.fr', password: 'demo1234', displayName: 'Auteur Démo', role: 'CREATOR' },
];

/**
 * Histoire publiée et jouable : sert de terrain de jeu au moteur (B) pendant que l'éditeur (A)
 * n'est pas encore prêt. Respecte toutes les règles de validation avant publication (section 4
 * de docs/conception.md) : scène de départ, fins, choix non conditionnels sur chaque carrefour,
 * combat avec scène de victoire ET de défaite, PV bornées à 0 avec une valeur de départ positive,
 * aucun statId/itemId orphelin, aucune scène inaccessible.
 */
export const cryptStory: SeedStory = {
  title: 'La Crypte du Roi Oublié',
  summary:
    "Dans les entrailles d'une crypte oubliée, un roi déchu garde son dernier secret. Entre une Goule affamée et un passage dérobé, à vous de choisir votre chemin.",
  genre: 'Fantasy',
  coverUrl: '/uploads/crypte-couverture.png',
  published: true,
  hasCombat: true,
  stats: [
    { key: 'nom', name: 'Nom', type: 'text', defaultValue: 'Aventurier', min: null, max: null },
    { key: 'force', name: 'Force', type: 'number', defaultValue: '5', min: 0, max: 20 },
    { key: 'pv', name: 'PV', type: 'number', defaultValue: '12', min: 0, max: 20 },
  ],
  attackStatKey: 'force',
  hpStatKey: 'pv',
  enemies: [
    {
      key: 'goule',
      name: 'Goule',
      imageUrl: '/uploads/goule.png',
      attack: 5,
      hp: 8,
      shield: 2,
      extraStats: [{ name: 'Élément', value: 'Ténèbres' }],
      defeatEffects: [{ type: 'item', itemKey: 'cle', qty: 1 }],
    },
  ],
  items: [
    {
      key: 'potion',
      name: 'Potion de soin',
      description: "Une fiole trouvée aux abords de la crypte. Elle referme les blessures les plus vilaines.",
      imageUrl: '/uploads/potion-de-soin.png',
      useEffects: [{ type: 'stat', statKey: 'pv', delta: 6 }],
    },
    {
      key: 'cle',
      name: 'Clé rouillée',
      description: 'Une vieille clé rongée par la rouille. Elle doit bien ouvrir quelque chose, quelque part.',
      imageUrl: '/uploads/cle-rouillee.png',
      useEffects: null,
    },
  ],
  startSceneKey: 'entree',
  scenes: [
    {
      key: 'entree',
      title: 'Entrée de la crypte',
      text: "La lourde porte de pierre s'ouvre en grinçant sur un escalier qui s'enfonce dans l'obscurité. Une statue érodée du roi oublié se dresse près de l'entrée, une épée rouillée entre ses mains de pierre. Au pied du socle, vous ramassez une fiole de potion abandonnée par un précédent aventurier.",
      backgroundUrl: '/uploads/crypte-entree.png',
      isEnding: false,
      enemyKey: null,
      winSceneKey: null,
      loseSceneKey: null,
      onEnterEffects: [{ type: 'item', itemKey: 'potion', qty: 1 }],
    },
    {
      key: 'couloir',
      title: 'Le couloir des échos',
      text: "Le couloir s'étire, ponctué de gouttes d'eau qui résonnent contre la pierre humide. Plus loin, un grondement sourd trahit une présence hostile. Sur votre gauche, un pan de mur écroulé pourrait être forcé par une poigne assez puissante.",
      backgroundUrl: '/uploads/couloir-echos.png',
      isEnding: false,
      enemyKey: null,
      winSceneKey: null,
      loseSceneKey: null,
      onEnterEffects: [],
    },
    {
      key: 'passageSecret',
      title: 'La fuite par le passage secret',
      text: "Le passage débouche sur une bouche d'aération et l'air frais de la nuit. Vous vous extirpez de la crypte, indemne mais les mains vides. Le Roi Oublié gardera ses secrets pour un autre aventurier.",
      backgroundUrl: '/uploads/passage-secret.png',
      isEnding: true,
      enemyKey: null,
      winSceneKey: null,
      loseSceneKey: null,
      onEnterEffects: [],
    },
    {
      key: 'antichambre',
      title: 'Antichambre de la Goule',
      text: "La lumière de votre torche révèle une Goule tapie parmi des ossements épars. Elle se redresse en poussant un cri rauque et charge sans sommation. Il n'y a plus d'échappatoire : il faut se battre.",
      backgroundUrl: '/uploads/antichambre-goule.png',
      isEnding: false,
      enemyKey: 'goule',
      winSceneKey: 'repaire',
      loseSceneKey: 'vaincu',
      onEnterEffects: [],
    },
    {
      key: 'repaire',
      title: 'Le repaire vidé',
      text: "La Goule s'effondre dans un dernier râle. En fouillant sa dépouille, vous découvrez une clé rouillée accrochée à un lambeau de tissu. Face à vous, une porte scellée porte le sceau du roi oublié.",
      backgroundUrl: '/uploads/antichambre-goule.png',
      isEnding: false,
      enemyKey: null,
      winSceneKey: null,
      loseSceneKey: null,
      // La clé est désormais dans le butin (defeatEffects) de la Goule, pas ici : sinon double récompense.
      onEnterEffects: [],
    },
    {
      key: 'vaincu',
      title: 'Vaincu par la Goule',
      text: "La Goule vous a laissé pour mort parmi les ossements. Vous reprenez vos esprits bien plus tard, à peine assez valide pour ramper hors de la crypte. Le Roi Oublié aura eu raison de vous.",
      backgroundUrl: null,
      isEnding: true,
      enemyKey: null,
      winSceneKey: null,
      loseSceneKey: null,
      onEnterEffects: [],
    },
    {
      key: 'tresor',
      title: 'La chambre du trésor',
      text: "Derrière la porte scellée repose la couronne du Roi Oublié, intacte après des siècles d'oubli. Vous la soulevez, et pour la première fois depuis mille ans, la crypte porte un nouveau nom : le vôtre.",
      backgroundUrl: '/uploads/chambre-tresor.png',
      isEnding: true,
      enemyKey: null,
      winSceneKey: null,
      loseSceneKey: null,
      onEnterEffects: [],
    },
    {
      key: 'sortiePrecipitee',
      title: 'La sortie précipitée',
      text: "Vous rebroussez chemin sans attendre, la clé rouillée serrée dans votre poing. La couronne du roi restera scellée derrière sa porte, pour une autre fois. Vous ressortez à l'air libre, vivant, et c'est déjà beaucoup.",
      backgroundUrl: null,
      isEnding: true,
      enemyKey: null,
      winSceneKey: null,
      loseSceneKey: null,
      onEnterEffects: [],
    },
  ],
  choices: [
    {
      fromKey: 'entree',
      toKey: 'couloir',
      label: "Arracher l'épée rouillée des mains de la statue du roi",
      condition: null,
      effects: [{ type: 'stat', statKey: 'force', delta: 1 }],
    },
    {
      fromKey: 'entree',
      toKey: 'couloir',
      label: "Ignorer la statue et descendre directement l'escalier",
      condition: null,
      effects: [],
    },
    {
      fromKey: 'couloir',
      toKey: 'passageSecret',
      label: 'Forcer le passage écroulé à mains nues',
      condition: { type: 'stat', statKey: 'force', op: '>=', value: 7 },
      effects: [],
    },
    {
      fromKey: 'couloir',
      toKey: 'antichambre',
      label: "Poursuivre vers le grondement, l'arme au poing",
      condition: null,
      effects: [],
    },
    {
      fromKey: 'repaire',
      toKey: 'tresor',
      label: 'Ouvrir la porte scellée avec la clé rouillée',
      condition: { type: 'item', itemKey: 'cle', op: 'has' },
      effects: [],
    },
    {
      fromKey: 'repaire',
      toKey: 'sortiePrecipitee',
      label: 'Ressortir sans attendre par le couloir des échos',
      condition: null,
      effects: [],
    },
  ],
};

/** Histoire brouillon : seulement 2 scènes, de quoi éditer sans avoir à jouer la première histoire. */
export const lighthouseStory: SeedStory = {
  title: 'Le Phare des Brumes',
  summary:
    "Sur une côte battue par les brumes, un phare éteint depuis des années s'est rallumé cette nuit, sans qu'aucune main ne l'ait actionné.",
  genre: 'Mystère',
  coverUrl: null,
  published: false,
  hasCombat: false,
  stats: [],
  attackStatKey: null,
  hpStatKey: null,
  enemies: [],
  items: [],
  startSceneKey: 'quai',
  scenes: [
    {
      key: 'quai',
      title: 'Le quai désert',
      text: "La brume avale le port endormi. Au loin, le phare s'est rallumé pour la première fois depuis des années. Un vieux carnet de bord traîne sur les planches humides du quai.",
      backgroundUrl: null,
      isEnding: false,
      enemyKey: null,
      winSceneKey: null,
      loseSceneKey: null,
      onEnterEffects: [],
    },
    {
      key: 'escalier',
      title: "L'escalier du phare",
      text: "L'escalier de fer grimpe en spirale dans l'obscurité, ponctué par le grincement du vieux mécanisme. Chaque marche semble raconter une histoire différente. Ce chapitre reste à écrire.",
      backgroundUrl: null,
      isEnding: false,
      enemyKey: null,
      winSceneKey: null,
      loseSceneKey: null,
      onEnterEffects: [],
    },
  ],
  choices: [
    {
      fromKey: 'quai',
      toKey: 'escalier',
      label: 'Monter vers le phare',
      condition: null,
      effects: [],
    },
  ],
};
