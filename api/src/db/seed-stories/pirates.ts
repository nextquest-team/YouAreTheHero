import type { SeedStory } from '../seed-data.js';
import { atLeast, choice, ending, fight, gain, give, has, numberStat, scene, textStat, withBackdrops } from './helpers.js';

// Un décor par lieu, partagé par les scènes qui s'y déroulent.
const BACKDROPS: Record<string, string[]> = {
  '/uploads/pirates-decor-cale.jpg': ['cale', 'cachette', 'mutinerie'],
  '/uploads/pirates-decor-pont.jpg': ['pont', 'combatMalgrin', 'respect', 'capitaine', 'victoire', 'finCapitaine'],
  '/uploads/pirates-decor-mer.jpg': ['navire', 'finRetour'],
  '/uploads/pirates-decor-tempete.jpg': ['tempete', 'kraken', 'vigie'],
  '/uploads/pirates-decor-plage.jpg': ['naufrage', 'ile', 'finAbandon', 'finExplorateur'],
  '/uploads/pirates-decor-jungle.jpg': ['raccourci', 'tresor'],
  '/uploads/pirates-decor-grotte.jpg': ['grotte', 'duel', 'finRecoins'],
};

/**
 * Longue aventure avec combats, 23 scènes et 5 fins. Deux défaites sur trois ne sont pas fatales
 * (capture, naufrage) : elles renvoient dans l'histoire par un autre chemin. Seul le duel final
 * peut mal finir.
 */
export const piratesStory: SeedStory = {
  title: "Les Pirates de la Mer d'Encre",
  summary:
    "1721. Caché dans la cale d'un navire marchand, tu rêvais d'aventure. Puis le Corbeau Noir a hissé son pavillon à l'horizon, et son capitaine cherche quelqu'un qui sache lire une carte au trésor.",
  genre: 'Aventure',
  coverUrl: '/uploads/pirates-couverture.jpg',
  published: true,
  hasCombat: true,
  stats: [
    numberStat('pv', 'PV', 20, 0, 20),
    numberStat('force', 'Force', 5, 0, null),
    numberStat('reputation', 'Réputation', 0, 0, 10),
    textStat('rang', 'Rang', 'Mousse'),
  ],
  attackStatKey: 'force',
  hpStatKey: 'pv',
  items: [
    {
      key: 'rhum',
      name: 'Flasque de rhum',
      description: 'Ça brûle la gorge et ça fait oublier les plaies. Pour un temps.',
      imageUrl: '/uploads/pirates-objet-rhum.jpg',
      useEffects: [gain('pv', 6)],
    },
    {
      key: 'sabre',
      name: 'Sabre ébréché',
      description: "Ramassé sur le pont de la Sterne. Il a connu des jours meilleurs, toi aussi.",
      imageUrl: '/uploads/pirates-objet-sabre.jpg',
      useEffects: null,
    },
    {
      key: 'carte',
      name: 'Copie de la carte',
      description: "Recopiée à la bougie, en cachette. L'île aux Encres, et une croix que Corbeau n'a pas vue.",
      imageUrl: '/uploads/pirates-objet-carte.jpg',
      useEffects: null,
    },
    {
      key: 'biscuit',
      name: 'Biscuit de mer',
      description: 'Dur comme du bois, mais ça tient au corps.',
      imageUrl: '/uploads/pirates-objet-biscuit.jpg',
      useEffects: [gain('pv', 3)],
    },
  ],
  enemies: [
    {
      key: 'malgrin',
      name: 'Bosco Malgrin',
      imageUrl: '/uploads/pirates-ennemi-malgrin.jpg',
      attack: 4,
      hp: 8,
      shield: 0,
      extraStats: [{ name: 'Arme', value: 'Coutelas' }],
      defeatEffects: [give('rhum'), gain('reputation', 1)],
    },
    {
      key: 'kraken',
      name: 'Tentacule du kraken',
      imageUrl: '/uploads/pirates-ennemi-kraken.jpg',
      attack: 5,
      hp: 10,
      shield: 2,
      extraStats: [{ name: 'Longueur', value: 'Vingt brasses' }],
      defeatEffects: [gain('reputation', 2), gain('force', 1)],
    },
    {
      key: 'corbeau',
      name: 'Capitaine Corbeau',
      imageUrl: '/uploads/pirates-ennemi-corbeau.jpg',
      attack: 5,
      hp: 12,
      shield: 2,
      extraStats: [
        { name: 'Arme', value: 'Sabre et pistolet' },
        { name: 'Faiblesse', value: "L'orgueil" },
      ],
      defeatEffects: [gain('reputation', 3)],
    },
  ],
  startSceneKey: 'cale',
  scenes: withBackdrops([
    scene(
      'cale',
      'La cale de la Sterne',
      "Trois jours que tu vis entre les tonneaux de mélasse de la Sterne, un navire marchand en route pour les Antilles. Ce matin, un coup de canon fait trembler la coque. Des cris, des bruits de course sur le pont, le fracas du bois qui éclate. Par une fente entre deux planches, tu aperçois un pavillon noir frappé d'un corbeau.",
      { onEnterEffects: [give('biscuit', 2)] },
    ),
    scene(
      'cachette',
      'Entre les tonneaux',
      "Tu te recroquevilles derrière les tonneaux. Les pirates descendent dans la cale en riant, défoncent les caisses, boivent au goulot. L'un d'eux trébuche sur ton pied. Un silence, puis une grosse main t'attrape par le col : « Tiens donc. Le capitaine va vouloir voir ça. » Dans la bousculade, une flasque de rhum tombe d'une poche et roule jusqu'à toi. Tu la glisses sous ta chemise.",
      { onEnterEffects: [give('rhum')] },
    ),
    scene(
      'pont',
      'Le pont en flammes',
      "Sur le pont, c'est le chaos. Les marins de la Sterne se rendent un à un. Tu ramasses un sabre ébréché tombé dans le sang et le sel. Devant toi se dresse un colosse au crâne rasé, un coutelas à la main : Malgrin, le bosco du Corbeau Noir. « Un mousse avec un sabre ? Viens donc, qu'on rigole. »",
    ),
    fight(
      'combatMalgrin',
      'Malgrin',
      "Le bosco attaque le premier, et il frappe fort. L'équipage des deux navires fait cercle autour de vous. Personne ne parie sur toi.",
      { enemy: 'malgrin', win: 'respect', lose: 'capitaine' },
    ),
    scene(
      'respect',
      'Le respect',
      "Malgrin s'effondre sur le pont, plus vexé que blessé. Un silence stupéfait tombe sur les deux équipages. Puis un rire claque derrière toi : le capitaine Corbeau en personne, long manteau noir et plume de corbeau au chapeau. « Un clandestin qui met mon bosco au tapis ! Tu embarques avec nous. Et tu vas me rendre un service. »",
      { onEnterEffects: [gain('reputation', 2)] },
    ),
    scene(
      'capitaine',
      'Devant Corbeau',
      "On te jette aux pieds du capitaine Corbeau. Il te dévisage longuement, puis déroule une carte jaunie sur un tonneau. « Mes hommes savent tuer, pas lire. Toi, tu sais lire. Déchiffre-moi ça, et tu vivras. Refuse, et tu nageras. » Sur la carte, une île en forme de tache d'encre, et des annotations dans un vieil espagnol.",
    ),
    scene(
      'navire',
      'Le Corbeau Noir',
      "Trois semaines de mer. On t'a donné un hamac, une gamelle et une place à la table des cartes. Le jour, tu traduis les annotations pour Corbeau. La nuit, tu écoutes l'équipage parler du capitaine : il a jeté par-dessus bord le dernier cartographe, une fois l'île trouvée. Barnabé, le cuisinier, te glisse un soir : « Il n'y a pas que toi qui veux qu'il tombe. »",
    ),
    scene(
      'tempete',
      'La tempête',
      "Le ciel devient d'encre en quelques minutes. Les vagues passent par-dessus le bastingage, la grand-voile se déchire. Soudain, le navire s'arrête net, comme agrippé par en dessous. Un tentacule gigantesque jaillit de l'eau et s'enroule autour du grand mât. Les hommes hurlent. Corbeau, lui, te regarde : « C'est le moment de montrer ce que tu vaux. »",
    ),
    fight(
      'kraken',
      'Le kraken',
      "Le tentacule se tord, couvert de ventouses larges comme des assiettes. Tu t'accroches au mât d'une main, le sabre de l'autre.",
      { enemy: 'kraken', win: 'ile', lose: 'naufrage' },
    ),
    scene(
      'vigie',
      'La vigie',
      "Pendant que l'équipage tranche à la hache, tu grimpes jusqu'à la vigie, l'eau jusque dans les bottes. D'en haut, tu vois ce que personne ne voit : un couloir d'eau calme entre deux récifs. Tu cries la route au barreur. Le navire s'y engouffre, le tentacule lâche prise. À l'aube, une île noire se dessine à l'horizon.",
      { onEnterEffects: [gain('reputation', 1)] },
    ),
    scene(
      'naufrage',
      'Par-dessus bord',
      "Le tentacule te balaie du pont comme une miette. L'eau glacée, le noir, le goût du sel. Tu t'accroches à un tonneau et tu dérives toute la nuit. Au matin, les vagues te recrachent sur une plage de sable noir. Au loin, le Corbeau Noir, mâture brisée, jette l'ancre dans la même baie.",
      { onEnterEffects: [gain('pv', 4)] },
    ),
    scene(
      'ile',
      "L'île aux Encres",
      "Le sable est noir comme de la suie, la jungle d'un vert presque bleu. Corbeau débarque avec six hommes, la carte à la main, et prend le sentier qui monte vers une falaise percée d'une grotte. Il ne t'attend pas. Il n'a plus besoin de toi.",
    ),
    scene(
      'mutinerie',
      'La mutinerie',
      "Une nuit sans lune, Barnabé et une dizaine d'hommes te rejoignent dans la cale. Ils ont choisi : ce sera toi qui parleras à Corbeau. Au petit matin, vous l'encerclez sur le gaillard d'arrière. Le capitaine sourit, pas le moins du monde surpris. « Un duel, alors. Comme au bon vieux temps. »",
    ),
    scene(
      'raccourci',
      'La croix oubliée',
      "Ta copie de la carte montre ce que Corbeau n'a pas remarqué : une seconde croix, minuscule, au pied d'un arbre foudroyé, bien loin de la grotte. Tu t'enfonces sans personne dans la jungle. Une heure plus tard, ta pelle heurte quelque chose de dur. Un coffre, cerclé de fer, à peine plus grand qu'une malle de voyage.",
    ),
    scene(
      'grotte',
      'La grotte',
      "Tu suis Corbeau jusque dans la grotte. Au fond, un coffre énorme, vide, à part une pièce d'or et un message gravé dans le couvercle : « Le vrai trésor n'est pas ici. » Corbeau hurle de rage. Puis ses yeux se posent sur toi : « Tu as mal traduit. Exprès. » Il dégaine.",
    ),
    fight(
      'duel',
      'Le duel',
      "Le capitaine Corbeau salue, sabre levé, puis attaque avec une vitesse que tu n'imaginais pas. Il a dû gagner cent duels. Il suffit que tu gagnes celui-là.",
      { enemy: 'corbeau', win: 'victoire', lose: 'finAbandon' },
    ),
    scene(
      'victoire',
      'Le pavillon',
      "Corbeau tombe à genoux, son sabre glisse sur la pierre. L'équipage, qui avait tout vu, se tait. Puis Barnabé arrache la plume du chapeau du capitaine et te la tend. « Le Corbeau Noir a besoin d'un capitaine. » Tous les regards se tournent vers toi.",
    ),
    scene(
      'tresor',
      'Le coffre',
      "Le coffre ne contient presque pas d'or. Juste une bourse de doublons, un compas de marine et une carte bien plus grande, qui montre des côtes qu'aucun navigateur n'a jamais dessinées. Derrière toi, dans la jungle, des voix approchent : Corbeau a compris.",
      { onEnterEffects: [gain('reputation', 1)] },
    ),
    ending(
      'finCapitaine',
      'Capitaine',
      "Tu hisses un nouveau pavillon : un corbeau, oui, mais qui tient une plume au lieu d'un sabre. Sous ton commandement, le Corbeau Noir ne pille plus les navires marchands : il vend ses cartes aux plus offrants. Dans les tavernes des Antilles, on raconte l'histoire du clandestin devenu capitaine, et chaque fois l'histoire s'allonge.",
    ),
    ending(
      'finRetour',
      'Le retour au port',
      "Tu ramènes le Corbeau Noir à Port-Royal, Corbeau enchaîné dans la cale. Le gouverneur te remet une récompense qui te ferait vivre dix ans. Tu en donnes la moitié à l'équipage et à Barnabé, qui ouvre une taverne sur le port. Tu y as ta table, près de la fenêtre, face à la mer.",
    ),
    ending(
      'finAbandon',
      "L'île pour royaume",
      "Tu te réveilles dans la grotte déserte, le sabre brisé, le Corbeau Noir déjà loin à l'horizon. L'île aux Encres devient ton royaume : des noix de coco, du poisson grillé, un perroquet bavard. Des années plus tard, un navire aperçoit ta fumée. Tu as tant d'histoires à raconter qu'ils mettent trois jours à te croire.",
    ),
    ending(
      'finExplorateur',
      'Terra incognita',
      "Tu files par l'autre versant de l'île avec le coffre, et tu embarques sur la chaloupe du Corbeau Noir pendant que l'équipage cherche encore dans la grotte. Un mois plus tard, avec ta bourse de doublons, tu achètes un petit sloop. Tu le baptises l'Encre. Sur la grande carte, des côtes inconnues t'attendent.",
    ),
    ending(
      'finRecoins',
      "La pièce d'or",
      "Tu recules, les mains levées. Corbeau crache par terre, rengaine et ressort de la grotte en hurlant des ordres. Il repart sans toi. Tu restes des heures à fouiller les recoins, et tu ne trouves qu'une pièce d'or oubliée. Un pêcheur te ramène sur le continent une semaine plus tard. Tu portes la pièce autour du cou pour le reste de ta vie.",
    ),
  ], BACKDROPS),
  choices: [
    choice('cale', 'pont', 'Monter sur le pont'),
    choice('cale', 'cachette', 'Rester dans les tonneaux'),

    choice('cachette', 'capitaine', 'Te laisser conduire devant le capitaine'),

    choice('pont', 'combatMalgrin', 'Te battre contre Malgrin', { effects: [give('sabre'), gain('force', 1)] }),
    choice('pont', 'capitaine', 'Lâcher le sabre et te rendre'),

    choice('respect', 'navire', 'Embarquer sur le Corbeau Noir'),
    choice('capitaine', 'navire', 'Accepter de traduire la carte'),

    choice('navire', 'tempete', 'Recopier la carte en cachette, la nuit', { effects: [give('carte')] }),
    choice('navire', 'tempete', "Jouer aux dés avec l'équipage pour gagner sa confiance", {
      effects: [gain('reputation', 1)],
    }),
    choice('navire', 'mutinerie', 'Préparer une mutinerie avec Barnabé', { condition: atLeast('reputation', 2) }),

    choice('tempete', 'kraken', 'Trancher le tentacule', { condition: has('sabre') }),
    choice('tempete', 'vigie', 'Grimper à la vigie pour guider le navire'),

    choice('vigie', 'ile', "Débarquer sur l'île"),
    choice('naufrage', 'ile', "Rejoindre le sentier de l'île"),

    choice('ile', 'grotte', "Suivre Corbeau jusqu'à la grotte"),
    choice('ile', 'raccourci', 'Suivre la seconde croix de ta copie', { condition: has('carte') }),

    choice('mutinerie', 'duel', 'Accepter le duel'),

    choice('grotte', 'duel', 'Tirer ton sabre'),
    choice('grotte', 'finRecoins', 'Lever les mains et reculer'),

    choice('raccourci', 'tresor', 'Ouvrir le coffre'),

    choice('tresor', 'finExplorateur', "Emporter le coffre et filer par l'autre versant"),
    choice('tresor', 'duel', 'Attendre Corbeau de pied ferme', { condition: atLeast('force', 6) }),

    choice('victoire', 'finCapitaine', 'Prendre la plume et le commandement'),
    choice('victoire', 'finRetour', 'Ramener tout le monde au port'),
  ],
};
