// Types du contrat d'API (docs/conception.md, section 7). Toutes les URL d'image sont
// des chemins relatifs ("/uploads/abc.jpg") : on les passe à assetUrl() pour les afficher.

export type Role = 'PLAYER' | 'CREATOR';

export type User = {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  avatarUrl: string | null;
  createdAt: string;
};

export type AuthResponse = { token: string; user: User };

export type RegisterInput = {
  email: string;
  password: string;
  displayName: string;
  role: Role;
};

export type ApiErrorBody = {
  error: { code: string; message: string; [extra: string]: unknown };
};

export type StorySummary = {
  id: string;
  title: string;
  summary: string;
  genre: string;
  coverUrl: string | null;
  hasCombat: boolean;
  author: { id: string; displayName: string };
  avgRating: number | null;
  isFavorite: boolean;
};

export type StatDefinition = {
  id: string;
  name: string;
  type: 'number' | 'text';
  defaultValue: string;
  min: number | null;
  max: number | null;
};

export type GameStatus = 'IN_PROGRESS' | 'FINISHED' | 'DEAD';

export type StoryDetail = StorySummary & {
  stats: StatDefinition[];
  mySave: { status: GameStatus; updatedAt: string } | null;
};

export type Review = {
  id: string;
  rating: number;
  comment: string | null;
  author: { id: string; displayName: string };
  createdAt: string;
};

export type ReviewList = {
  avgRating: number | null;
  count: number;
  mine: Review | null;
  // Vrai quand le joueur a terminé l'histoire : seul cas où il peut donner son avis.
  canReview: boolean;
  reviews: Review[];
};

export type SaveSummary = {
  story: { id: string; title: string; coverUrl: string | null };
  status: GameStatus;
  updatedAt: string;
};

export type StartGameInput = {
  textStats?: Record<string, string>;
  heroFaceUrl?: string;
};

export type GameState = {
  storyId: string;
  status: GameStatus;
  scene: { id: string; title: string; text: string; backgroundUrl: string | null; isEnding: boolean };
  choices: { id: string; label: string; locked: boolean; conditionLabel: string | null }[];
  stats: { id: string; name: string; type: 'number' | 'text'; value: number | string; min: number | null; max: number | null }[];
  // Stat qui sert de points de vie (null pour une histoire sans PV)
  hpStatId: string | null;
  heroFaceUrl: string | null;
  inventory: {
    id: string;
    name: string;
    imageUrl: string | null;
    description: string | null;
    qty: number;
    usable: boolean;
  }[];
  changes: { label: string; kind: 'stat' | 'item'; delta: number }[];
  combat: null | {
    enemy: {
      name: string;
      imageUrl: string | null;
      attack: number;
      hpMax: number;
      shieldMax: number;
      extraStats: { name: string; value: string }[];
    };
    enemyHp: number;
    enemyShield: number;
    heroHp: number;
    log: string[];
  };
};

export type Media = { id: string; url: string; createdAt: string };

// Détail d'un 409 (IMAGE_IN_USE, STAT_IN_USE...) : les endroits qui utilisent encore la ressource.
export type Usage = {
  kind: 'story' | 'scene' | 'enemy' | 'item' | 'choice';
  id: string;
  storyId: string;
  label: string;
};

// Histoire vue par son créateur (/me/stories), publiée ou en brouillon.
export type CreatorStory = {
  id: string;
  title: string;
  summary: string;
  genre: string;
  coverUrl: string | null;
  hasCombat: boolean;
  startSceneId: string | null;
  attackStatId: string | null;
  hpStatId: string | null;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

// Condition d'un choix et effets (choix, entrée de scène, objet utilisé, butin d'un ennemi).
// Une quantité négative d'objet le retire de l'inventaire.
export type Condition =
  | { type: 'stat'; statId: string; op: '>=' | '<=' | '=='; value: number }
  | { type: 'item'; itemId: string; op: 'has' | 'not_has' };

export type Effect = { type: 'stat'; statId: string; delta: number } | { type: 'item'; itemId: string; qty: number };

export type Enemy = {
  id: string;
  name: string;
  imageUrl: string | null;
  attack: number;
  hp: number;
  shield: number;
  extraStats: { name: string; value: string }[];
  defeatEffects: Effect[];
  sortOrder: number;
};

// useEffects null : l'objet ne s'utilise pas depuis le sac.
export type Item = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  useEffects: Effect[] | null;
  sortOrder: number;
};

export type Choice = {
  id: string;
  toSceneId: string;
  label: string;
  condition: Condition | null;
  effects: Effect[];
  sortOrder: number;
};

export type Scene = {
  id: string;
  title: string;
  text: string;
  backgroundUrl: string | null;
  isEnding: boolean;
  enemyId: string | null;
  winSceneId: string | null;
  loseSceneId: string | null;
  onEnterEffects: Effect[];
  sortOrder: number;
  choices: Choice[];
};

// Histoire complète renvoyée par GET /me/stories/:id.
export type CreatorStoryFull = CreatorStory & {
  stats: StatDefinition[];
  enemies: Enemy[];
  items: Item[];
  scenes: Scene[];
};

// Corps des créations ; au PATCH tous les champs sont facultatifs, null efface un champ nullable.
export type ItemInput = {
  name: string;
  description: string | null;
  imageUrl: string | null;
  useEffects: Effect[] | null;
};

export type EnemyInput = {
  name: string;
  imageUrl: string | null;
  attack: number;
  hp: number;
  shield: number;
  extraStats: { name: string; value: string }[];
  defeatEffects: Effect[];
};

export type SceneInput = {
  title: string;
  text: string;
  backgroundUrl: string | null;
  isEnding: boolean;
  enemyId: string | null;
  winSceneId: string | null;
  loseSceneId: string | null;
  onEnterEffects: Effect[];
};

export type ChoiceInput = {
  toSceneId: string;
  label: string;
  condition: Condition | null;
  effects: Effect[];
};

export type CreateStoryInput = {
  title: string;
  summary: string;
  genre: string;
  coverUrl?: string;
  hasCombat?: boolean;
};

export type UpdateStoryInput = Partial<Omit<CreateStoryInput, 'coverUrl'>> & {
  coverUrl?: string | null;
  startSceneId?: string | null;
  attackStatId?: string | null;
  hpStatId?: string | null;
};

export type StatInput = {
  name: string;
  type: 'number' | 'text';
  defaultValue: string;
  min: number | null;
  max: number | null;
};

// Problème relevé avant publication (détail d'un 422 STORY_INVALID, ou avertissement d'une publication réussie).
export type PublishIssue = { code: string; message: string; sceneId: string | null };

export type PublishResult = CreatorStory & { warnings: PublishIssue[] };
