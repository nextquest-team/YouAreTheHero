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
