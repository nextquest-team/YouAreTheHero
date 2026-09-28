// Toutes les tables de l'app, dans un ordre indifférent : TRUNCATE ... CASCADE embarque les
// tables dépendantes. Utilisé par le seed et par les tests pour vider la base.
export const ALL_TABLES = [
  'saves',
  'favorites',
  'reviews',
  'choices',
  'scenes',
  'items',
  'enemies',
  'stat_definitions',
  'stories',
  'media',
  'users',
] as const;
