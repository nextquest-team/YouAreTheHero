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
    media: 'Médiathèque',
    profile: 'Profil',
  },
  imagePicker: {
    camera: 'Photo',
    cameraHint: "Ouvre l'appareil photo",
    library: 'Galerie',
    libraryHint: 'Ouvre la galerie de ton téléphone',
    cameraDenied:
      "L'accès à l'appareil photo est refusé. Autorise-le dans les réglages du téléphone.",
    failed: "L'image n'a pas pu être chargée. Réessaie.",
  },
  media: {
    overline: 'Espace créateur',
    title: 'Médiathèque',
    intro: 'Les images qui illustrent tes histoires : couvertures, décors, ennemis et objets.',
    newImage: 'Nouvelle image',
    empty: 'Aucune image pour le moment.',
    imageLabel: 'Image de la médiathèque',
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
