// Couleurs propres à l'écran de jeu : la page reste une page de carnet dans les deux
// thèmes, et le combat passe sur fond d'encre (accent éclairci pour garder l'AA).
export const gameColors = {
  parchment: '#FBF6EC',
  ink: '#1D1A16',
  inkSoft: '#574E44',
  paper: '#F3EBDB', // texte sur encre, 16:1
  paperMuted: '#CFC4B1', // texte secondaire sur encre, 10:1
  accentOnInk: '#F08A74', // 7:1 sur encre
  hpFill: '#B3321F',
  shieldFill: '#574E44',
  scrim: 'rgba(29, 26, 22, 0.85)',
} as const;
