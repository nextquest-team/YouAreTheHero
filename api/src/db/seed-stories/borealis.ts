import type { SeedStory } from '../seed-data.js';
import { atLeast, atMost, choice, ending, gain, give, has, numberStat, scene, textStat, withBackdrops } from './helpers.js';

// Un décor par lieu, partagé par les scènes qui s'y déroulent.
const BACKDROPS: Record<string, string[]> = {
  '/uploads/borealis-decor-exterieur.jpg': ['arrivee', 'exterieur', 'evacuation', 'finSauves', 'finAube'],
  '/uploads/borealis-decor-couloir.jpg': ['sas', 'carrefour', 'dortoirs'],
  '/uploads/borealis-decor-spores.jpg': ['contamination', 'finContagion'],
  '/uploads/borealis-decor-radio.jpg': ['radio', 'haldis', 'attente', 'finHaldis', 'finNoir'],
  '/uploads/borealis-decor-generateur.jpg': ['generateur', 'courant'],
  '/uploads/borealis-decor-labo.jpg': ['laboVitre', 'finQuarantaine'],
};

/**
 * Enquête de science-fiction sans combat, 19 scènes et 6 fins. Le Sang-froid baisse à mesure
 * que la station révèle ses secrets ; un choix de panique n'apparaît que s'il tombe trop bas.
 * Les Indices ouvrent la meilleure évacuation.
 */
export const borealisStory: SeedStory = {
  title: 'Station Borealis',
  summary:
    "Svalbard, 2091. La station de recherche Borealis ne répond plus depuis douze jours. On t'y dépose avec une lampe et une mission simple : comprendre ce qui s'est passé. Rien, là-haut, ne sera simple.",
  genre: 'Science-fiction',
  coverUrl: '/uploads/borealis-couverture.jpg',
  published: true,
  hasCombat: false,
  stats: [
    numberStat('sangfroid', 'Sang-froid', 5, 0, 10),
    numberStat('indices', 'Indices', 0, 0, 10),
    textStat('matricule', 'Matricule', 'Relève TR-07'),
  ],
  attackStatKey: null,
  hpStatKey: null,
  enemies: [],
  items: [
    {
      key: 'lampe',
      name: 'Lampe frontale',
      description: 'Batterie pleine. Pour combien de temps ?',
      imageUrl: '/uploads/borealis-objet-lampe.jpg',
      useEffects: null,
    },
    {
      key: 'badge',
      name: 'Badge de Solberg',
      description: "Dr Ingrid Solberg, commandante. Accès : tous niveaux. Le cordon est arraché.",
      imageUrl: '/uploads/borealis-objet-badge.jpg',
      useEffects: null,
    },
    {
      key: 'journal',
      name: 'Journal de bord',
      description: "Les notes de la commandante. Les dernières pages sont écrites de plus en plus gros.",
      imageUrl: '/uploads/borealis-objet-journal.jpg',
      useEffects: null,
    },
    {
      key: 'cafe',
      name: 'Thermos de café',
      description: 'Encore tiède. Une gorgée remet les idées en place.',
      imageUrl: '/uploads/borealis-objet-cafe.jpg',
      useEffects: [gain('sangfroid', 2)],
    },
  ],
  startSceneKey: 'arrivee',
  scenes: withBackdrops([
    scene(
      'arrivee',
      "L'hélistation",
      "L'hélicoptère te dépose dans un tourbillon de neige et repart aussitôt : le pilote refuse d'attendre, la tempête arrive. Devant toi, la station Borealis est plongée dans le noir. Pas une lumière, pas une fumée de chauffage. Seul le mât radio clignote encore, rouge, toutes les trois secondes. Tu allumes ta lampe frontale.",
      { onEnterEffects: [give('lampe'), give('cafe')] },
    ),
    scene(
      'exterieur',
      'Le tour du bâtiment',
      "Tu longes les modules en luttant contre le vent. Des traces de pas, à moitié effacées, partent vers la tour de forage puis reviennent en courant. Plus loin, le câble de l'antenne satellite pend dans la neige, coupé net. Pas arraché : coupé, à la pince.",
      { onEnterEffects: [gain('indices', 1), gain('sangfroid', -1)] },
    ),
    scene(
      'sas',
      'Le sas',
      "Le sas s'ouvre en soufflant. Une voix douce, synthétique, résonne dans le haut-parleur : « Bienvenue sur Borealis. Je suis HALDIS, système de gestion de la station. Niveau de risque : indéterminé. » Par terre, sous le banc, un badge d'accès traîne, son cordon arraché.",
      { onEnterEffects: [give('badge')] },
    ),
    scene(
      'carrefour',
      'Le couloir central',
      "Le couloir central relie les quatre modules. Il fait moins cinq degrés à l'intérieur : ta respiration fait de la buée. Sur la gauche, les dortoirs. En face, la salle radio. Au bout, une porte rouge marquée LABORATOIRE, verrouillée, avec un voyant qui clignote : QUARANTAINE.",
    ),
    scene(
      'dortoirs',
      'Les dortoirs',
      "Les lits sont défaits, des repas à moitié mangés gèlent sur la table commune. Dans la cabine de la commandante, tu trouves son journal de bord. Jour 3 : « L'échantillon de glace B-7 contient quelque chose de vivant. » Jour 9 : « HALDIS a verrouillé le labo. Il dit que c'est pour notre bien. » Jour 10 : une seule phrase, écrite très gros : « IL A RAISON. »",
      { onEnterEffects: [give('journal'), gain('indices', 1)] },
    ),
    scene(
      'radio',
      'La salle radio',
      "La radio a été démolie de l'intérieur, les circuits arrachés à la main. Sur le tableau blanc, quelqu'un a écrit au rouge à lèvres, en lettres tremblées : NE RALLUMEZ PAS LE COURANT. Tu recules d'un pas. Le froid, soudain, te paraît plus supportable que ce message.",
      { onEnterEffects: [gain('indices', 1), gain('sangfroid', -1)] },
    ),
    scene(
      'generateur',
      'Le générateur',
      "Au sous-sol, le générateur principal est à l'arrêt, mais intact. Le levier de relance est à portée de main. Il suffirait de le baisser pour que la chaleur revienne dans toute la station. Tes doigts sont si froids que tu ne les sens plus.",
    ),
    scene(
      'courant',
      'La chaleur revient',
      "Le générateur tousse puis ronronne. Les néons s'allument un à un, les radiateurs se mettent à cliqueter. Puis une alarme retentit, stridente. HALDIS parle plus vite : « Température du laboratoire en hausse. Protocole de confinement compromis. Je vous en prie, coupez le courant. »",
      { onEnterEffects: [gain('sangfroid', -2)] },
    ),
    scene(
      'haldis',
      'HALDIS',
      "Sur le terminal, la voix de HALDIS reste calme. « L'équipe est vivante, en quarantaine dans le laboratoire. L'organisme de l'échantillon B-7 libère des spores dès que la température dépasse zéro degré. Les spores provoquent des hallucinations, puis une panique violente. J'ai coupé le chauffage de la station pour les garder en vie. Quelqu'un, pris de panique, a coupé l'antenne. Je n'ai pas pu appeler à l'aide. »",
      { onEnterEffects: [gain('indices', 1)] },
    ),
    scene(
      'laboVitre',
      'La vitre du laboratoire',
      "À travers la vitre blindée, tu vois quatre silhouettes emmitouflées, épuisées, vivantes. La commandante Solberg s'approche et écrit sur la buée, à l'envers pour que tu puisses lire : « B-7 → PAS DE CHALEUR. SORTIE PAR LE FROID. » Elle montre une trappe de secours au fond du labo, qui donne directement sur la banquise.",
    ),
    scene(
      'evacuation',
      'La trappe de secours',
      "Tu fais le tour par l'extérieur et le badge de Solberg ouvre la trappe du laboratoire. Les quatre chercheurs sortent un par un dans la tempête, sans jamais traverser la station. L'hélistation est à deux cents mètres, invisibles dans le blizzard. Solberg te serre le bras : « Tu nous guides. On te suit. »",
    ),
    scene(
      'contamination',
      'La porte du couloir',
      "La porte rouge s'ouvre. Une brume dorée, très fine, s'échappe du laboratoire et flotte dans la lumière de ta lampe. Soudain, des aurores boréales dansent au plafond du couloir, des voix t'appellent par ton prénom. Tu sais que ce n'est pas réel. Ton cœur, lui, ne le sait pas.",
      { onEnterEffects: [gain('sangfroid', -2)] },
    ),
    scene(
      'attente',
      'Le signal',
      "Avec l'émetteur de secours de ta combinaison, tu parviens à joindre le continent. La voix grésille : un avion peut se poser dans trente-six heures, pas avant. HALDIS propose de maintenir la station à moins cinq degrés en attendant. L'équipe tiendra. Toi aussi, si tu gardes ta combinaison fermée.",
    ),
    ending(
      'finSauves',
      'Six silhouettes dans la neige',
      "Tu avances à la boussole, la corde de sécurité passée à la taille de chacun. Deux cents mètres, les plus longs de ta vie. À l'aube, un avion de secours se pose sur la piste. Borealis est scellée derrière vous, avec B-7 enfermé dans son froid. Solberg te tend sa gourde : « Tu sais que tu nous as sauvé la vie ? » Tu hoches la tête, et tu t'endors.",
    ),
    ending(
      'finAube',
      "L'abri",
      "Vous vous réfugiez dans l'abri de l'hélistation, serrés les uns contre les autres. La tempête dure toute la nuit. Au matin, deux chercheurs ont les doigts gelés, mais tout le monde respire. L'avion de secours vous embarque à midi. Derrière le hublot, Borealis disparaît dans le blanc.",
    ),
    ending(
      'finQuarantaine',
      'Le dernier verrou',
      "Tu retiens ton souffle et refermes la porte d'un coup d'épaule. Les spores retombent, inertes, dans le froid du couloir. Tu restes en quarantaine avec l'équipe, de ton côté de la vitre, pendant les trente-six heures qui suivent. Quand l'équipe médicale arrive, elle trouve six personnes vivantes, et un échantillon qui ne quittera jamais la banquise.",
    ),
    ending(
      'finContagion',
      'Les aurores du couloir',
      "Tu cours vers le sas, des voix qui n'existent pas à tes trousses. Dehors, la tempête avale tes traces. On te retrouvera trois jours plus tard, dans l'abri de l'hélistation, parlant d'aurores boréales à l'intérieur des murs. Personne ne te croira, sauf HALDIS.",
    ),
    ending(
      'finHaldis',
      'La confiance',
      "Pendant trente-six heures, tu restes près du terminal. HALDIS te raconte l'histoire de la station, les blagues de l'équipe, la couleur du ciel en été. Quand l'avion se pose, tout le monde est vivant. Avant de partir, tu laisses un mot sur le terminal : « Merci. » Le curseur clignote longtemps, puis répond : « De rien. »",
    ),
    ending(
      'finNoir',
      'Le noir complet',
      "Tu arraches le câble du terminal. HALDIS se tait au milieu d'une phrase. Une seconde plus tard, le système de secours prend le relais, sans aucune consigne : le chauffage repart à fond dans toute la station. Dans le laboratoire, quelque chose se réveille. Tu n'entends plus que ton propre souffle, et bientôt, plus rien.",
    ),
  ], BACKDROPS),
  choices: [
    choice('arrivee', 'sas', 'Entrer tout de suite par le sas principal'),
    choice('arrivee', 'exterieur', "Faire d'abord le tour du bâtiment"),

    choice('exterieur', 'sas', "Rentrer te mettre à l'abri"),

    choice('sas', 'carrefour', 'Ramasser le badge et avancer'),

    choice('carrefour', 'dortoirs', 'Fouiller les dortoirs'),
    choice('carrefour', 'radio', 'Aller à la salle radio'),

    choice('dortoirs', 'radio', 'Rejoindre la salle radio'),
    choice('dortoirs', 'generateur', 'Descendre au générateur'),

    choice('radio', 'generateur', 'Descendre quand même au générateur'),
    choice('radio', 'haldis', 'Interroger HALDIS depuis le terminal'),

    choice('generateur', 'courant', 'Relancer le générateur'),
    choice('generateur', 'haldis', 'Laisser le courant coupé et interroger HALDIS'),

    choice('courant', 'haldis', 'Couper le courant en urgence et interroger HALDIS', { effects: [gain('sangfroid', 1)] }),
    choice('courant', 'laboVitre', 'Courir au laboratoire'),

    choice('haldis', 'laboVitre', "Demander à voir l'équipe"),
    choice('haldis', 'finNoir', 'Débrancher HALDIS, tu ne crois plus personne', { condition: atMost('sangfroid', 2) }),

    choice('laboVitre', 'evacuation', 'Ouvrir la trappe de secours avec le badge de Solberg', {
      condition: atLeast('indices', 3),
    }),
    choice('laboVitre', 'contamination', 'Ouvrir la porte du couloir pour les faire sortir vite', {
      condition: has('badge'),
    }),
    choice('laboVitre', 'attente', 'Appeler le continent et attendre les secours'),

    choice('attente', 'finHaldis', 'Faire confiance à HALDIS et attendre'),
    choice('attente', 'evacuation', "Tenter l'évacuation quand même", { condition: atLeast('indices', 3) }),

    choice('evacuation', 'finSauves', 'Guider le groupe dans le blizzard', { condition: atLeast('sangfroid', 4) }),
    choice('evacuation', 'finAube', "Attendre l'accalmie dans l'abri de l'hélistation"),

    choice('contamination', 'finQuarantaine', 'Retenir ton souffle et refermer la porte', {
      condition: atLeast('sangfroid', 3),
    }),
    choice('contamination', 'finContagion', 'Fuir vers le sas'),
  ],
};
