// Tous les textes de l'interface. Une clé par écran ; chacun ajoute les siennes.
export const fr = {
  common: {
    back: 'Retour',
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    loading: 'Chargement…',
  },
  creatorTabs: {
    stories: 'Mes histoires',
    profile: 'Profil',
  },
  creatorStories: {
    overline: 'Espace créateur',
    title: 'Mes histoires',
    newStory: 'Nouvelle histoire',
    empty: "Tu n'as pas encore écrit d'histoire.",
  },
  profile: {
    title: 'Profil',
    appearance: 'Apparence',
    darkMode: 'Mode sombre',
    darkModeHint: "Change les couleurs de l'application",
    logout: 'Se déconnecter',
  },
} as const;
