import type { SeedStory } from '../seed-data.js';
import { atLeast, choice, ending, gain, give, has, numberStat, scene, textStat } from './helpers.js';

/**
 * Romance sans combat, 21 scènes et 6 fins : une correspondance anonyme cachée dans les livres
 * d'une librairie de Montmartre. L'Audace ouvre les choix risqués, la Complicité les fins heureuses.
 */
export const lepicStory: SeedStory = {
  title: 'Les Lettres de la rue Lepic',
  summary:
    "Paris, 1925. Une lettre tombe d'un vieux recueil de Verlaine : « À qui trouvera ce livre ». Répondras-tu à cette voix sans visage, cachée quelque part entre les rayons d'une librairie de Montmartre ?",
  genre: 'Romance',
  coverUrl: null,
  published: true,
  hasCombat: false,
  stats: [
    numberStat('audace', 'Audace', 2, 0, 10),
    numberStat('complicite', 'Complicité', 0, 0, 10),
    textStat('signature', 'Signature', "L'Anonyme du troisième rayon"),
  ],
  attackStatKey: null,
  hpStatKey: null,
  enemies: [],
  items: [
    {
      key: 'lettre',
      name: 'Lettre anonyme',
      description: "Une écriture penchée, pressée, comme si on avait eu peur de changer d'avis.",
      imageUrl: null,
      useEffects: null,
    },
    {
      key: 'billet',
      name: 'Billet de théâtre',
      description: "Théâtre de l'Atelier, samedi soir, fauteuil 14. Offert par Camille.",
      imageUrl: null,
      useEffects: null,
    },
    {
      key: 'violette',
      name: 'Violette séchée',
      description: 'Glissée dans le pli de la dernière lettre. La respirer donne du courage.',
      imageUrl: null,
      useEffects: [gain('audace', 1)],
    },
  ],
  startSceneKey: 'librairie',
  scenes: [
    scene(
      'librairie',
      'Au Chat qui lit',
      "Paris, novembre 1925. La pluie a chassé tout le monde des pentes de Montmartre. Tu pousses la porte de la librairie Au Chat qui lit, rue Lepic, pour y dénicher un vieux Verlaine à deux sous. Derrière le comptoir, la libraire, Camille, lève à peine les yeux de son roman. Au moment de payer, une enveloppe glisse d'entre les pages et tombe sur le parquet. Elle est adressée « À qui trouvera ce livre ».",
    ),
    scene(
      'confidence',
      'Le sourire de Camille',
      "Camille pose son roman. Tu lis à voix haute : « Toi qui aimes les vers, dis-moi lequel te tient éveillé la nuit. Réponds-moi dans Les Fleurs du mal, troisième rayon. Je passerai. » Camille sourit sans rien dire. Puis elle sort de sous le comptoir un billet de théâtre : « Je ne peux pas y aller samedi. Prends-le, ce serait dommage de le perdre. » Tu ne sais pas si elle se moque de toi ou si elle en sait plus qu'elle ne le dit.",
      { onEnterEffects: [give('billet')] },
    ),
    scene(
      'atelier',
      'La chambre sous les toits',
      "Ta chambre sous les toits sent la térébenthine et le café froid. Les dessins de la semaine sèchent sur une corde tendue au-dessus du lit. Tu relis la lettre trois fois. Quelqu'un, quelque part dans ce quartier, attend qu'un inconnu lui parle de poésie. Il faut décider quoi répondre, ou s'il faut répondre.",
    ),
    ending(
      'finTiroir',
      'Le tiroir',
      "La lettre reste dans le tiroir, entre deux factures et un ticket de métro. Parfois, en passant devant la librairie, tu crois voir Camille guetter le troisième rayon. Tu ne sauras jamais qui attendait ta réponse. Certaines histoires ne commencent que si on leur ouvre la porte.",
    ),
    scene(
      'reponse',
      'Un mois de lettres',
      "Le lendemain, tu glisses ta réponse dans Les Fleurs du mal, entre deux poèmes. Trois jours plus tard, une nouvelle enveloppe t'y attend. Puis une autre. Pendant un mois, vous vous écrivez tous les deux jours : les pavés mouillés, les films de Chaplin, la peur de ne rien faire de sa vie. Tu n'as jamais rien écrit d'aussi vrai à quelqu'un dont tu ignores le visage. Dans la dernière enveloppe, une violette séchée est glissée dans le pli.",
      { onEnterEffects: [give('violette'), gain('complicite', 1)] },
    ),
    scene(
      'rendezvous',
      'Samedi soir',
      "« Samedi, au bal du Moulin de la Galette. Je porterai une violette à la boutonnière. Si tu viens, porte la tienne. » Tu tournes la lettre dans tous les sens, le cœur battant. Samedi, c'est aussi le soir de la pièce, au Théâtre de l'Atelier.",
    ),
    scene(
      'encoreLettres',
      'Encore un peu',
      "Tu écris que tu as peur que la réalité abîme ce que vous avez construit. La réponse met une semaine à venir. Elle ne fait qu'une ligne : « Alors je t'attendrai encore un peu. » Tu comprends que tu viens de blesser quelqu'un que tu ne connais pas.",
    ),
    ending(
      'finSilence',
      'La violette dans le carnet',
      "Samedi passe, puis dimanche. Lundi, Les Fleurs du mal ont disparu du troisième rayon. Camille dit qu'un client l'a acheté, sans te regarder. Tu gardes la violette séchée dans ton carnet, entre deux croquis. Elle ne sent plus rien, mais tu ne peux pas te résoudre à la jeter.",
    ),
    scene(
      'bal',
      'Le Moulin de la Galette',
      "Le Moulin de la Galette tourne sous les lampions. L'orchestre joue une valse trop rapide et les danseurs se bousculent entre les tables. Tu cherches une violette à chaque boutonnière. Et soudain, tu la vois : Camille, près du comptoir, une violette épinglée à sa robe, qui scrute la foule sans te voir encore.",
    ),
    scene(
      'theatre',
      'Le fauteuil 14',
      "Au Théâtre de l'Atelier, la salle s'éteint. Le fauteuil voisin reste vide pendant tout le premier acte. À l'entracte, quelqu'un s'y assoit en silence : Camille, une violette à la boutonnière, le souffle court d'avoir couru. « Je t'ai donné ce billet exprès, murmure-t-elle. Il me fallait une excuse pour m'asseoir là. »",
      { onEnterEffects: [gain('complicite', 2)] },
    ),
    scene(
      'danse',
      'La valse',
      "Tu traverses la piste et tends la main. Camille voit la violette à ton revers et éclate de rire, un rire nerveux et soulagé : « C'était toi. Depuis le début, c'était toi. » Vous dansez mal, vous marchez sur les pieds de tout le monde, et c'est la plus belle valse de ta vie.",
    ),
    scene(
      'aveu',
      "La lettre qu'on n'envoie pas",
      "Tu lui tends la lettre que tu n'as jamais envoyée, celle où tu écrivais que tu aurais aimé que ce soit elle. Camille la lit, puis relève les yeux vers ta violette. Elle ne dit rien pendant un long moment. Puis elle glisse son bras sous le tien : « Viens, il y a trop de bruit ici. »",
    ),
    scene(
      'fuite',
      'La vitrine',
      "Tu fais demi-tour. Dehors, le froid te gifle et tu passes la nuit à te traiter de lâche. Lundi, la librairie est fermée. Une affichette sur la vitrine : « Fermeture. Merci pour toutes ces années. C. » En dessous, ajouté à la main : « Train de 10 h 12, gare de Lyon. Au cas où. »",
    ),
    scene(
      'gare',
      'Quai numéro 7',
      "Tu dévales la butte, prends le métro dans le mauvais sens, te trompes deux fois de couloir. À 10 h 11, tu aperçois Camille sur le quai numéro 7, une valise à la main. Tu cries son nom par-dessus les sifflets. Elle se retourne.",
    ),
    scene(
      'escaliers',
      'Les escaliers de la butte',
      "Vous montez les escaliers de la butte jusqu'au Sacré-Cœur pendant que la nuit s'éclaircit. Paris s'étend en dessous, gris et doré. Camille raconte qu'elle a commencé les lettres pour ne plus être seule derrière son comptoir. Puis elle t'avoue le reste : dans un mois, elle part à Marseille reprendre la librairie de sa tante.",
    ),
    ending(
      'finRester',
      "Quelqu'un qui a trouvé le bon livre",
      "« Rester ? » répète Camille. Elle regarde la ville, puis toi. « Ma tante trouvera quelqu'un d'autre. » Au printemps, la vitrine du Chat qui lit se couvre de tes dessins. Les clients demandent qui les a faits. Camille répond toujours la même chose : « Quelqu'un qui a trouvé le bon livre. »",
    ),
    ending(
      'finMarseille',
      'Au Chat qui lit, deuxième du nom',
      "Un mois plus tard, tu fais tes adieux à ta chambre sous les toits. Le train file vers le sud, Camille dort contre ton épaule, ton carton à dessins sur les genoux. À Marseille, la nouvelle librairie sent le sel et la poussière. Tu peins l'enseigne toi-même : Au Chat qui lit, deuxième du nom.",
    ),
    ending(
      'finLettres',
      'Une boîte pleine de lettres',
      "Camille part un mardi, sous la pluie. Chaque semaine, une enveloppe arrive de Marseille, avec l'écriture penchée que tu connais par cœur. Chaque semaine, tu réponds par un dessin. Au bout d'un an, tu remplis une boîte entière. Au bout de deux, elle revient. Certaines histoires prennent leur temps.",
    ),
    ending(
      'finVitrine',
      'Le colis de Marseille',
      "Tu rentres chez toi. Les semaines passent et la vitrine du Chat qui lit reste vide. Un matin, un colis arrive de Marseille : un Verlaine, sans lettre. Seulement une violette séchée, glissée à la page de ton poème préféré.",
    ),
    ending(
      'finQuai',
      'Sans bagage',
      "Le chef de gare siffle. Tu sautes dans le wagon au moment où il s'ébranle, sans valise, sans manteau, sans aucun plan. Camille rit, les larmes aux yeux : « Tu n'as même pas de manteau. » Tu réponds qu'il paraît qu'il fait chaud, à Marseille. Derrière la vitre, Paris rétrécit.",
    ),
    ending(
      'finPromesse',
      'La promesse du mois de mai',
      "Le train part. Camille se penche à la fenêtre et te lance sa violette, que tu rattrapes de justesse. Tu tiens ta promesse au mois de mai : un billet aller simple pour Marseille, et ton carton à dessins sous le bras.",
    ),
  ],
  choices: [
    choice('librairie', 'confidence', "Ouvrir l'enveloppe devant Camille", { effects: [give('lettre'), gain('complicite', 1)] }),
    choice('librairie', 'atelier', "Glisser l'enveloppe dans ta poche et filer", { effects: [give('lettre')] }),

    choice('confidence', 'atelier', 'Rentrer écrire ta réponse'),
    choice('confidence', 'atelier', "Demander à Camille si elle connaît l'auteur de la lettre", {
      effects: [gain('audace', 1)],
    }),

    choice('atelier', 'reponse', 'Écrire une réponse sincère, avec ton vers préféré à la fin', {
      effects: [gain('complicite', 1)],
    }),
    choice('atelier', 'reponse', 'Répondre par un dessin : la rue Lepic sous la pluie', {
      condition: atLeast('audace', 3),
      effects: [gain('complicite', 2)],
    }),
    choice('atelier', 'finTiroir', 'Ranger la lettre dans un tiroir'),

    choice('reponse', 'rendezvous', 'Ouvrir la dernière lettre'),

    choice('rendezvous', 'bal', 'Aller au bal, la violette au revers'),
    choice('rendezvous', 'theatre', 'Donner plutôt rendez-vous au théâtre', {
      condition: has('billet'),
      effects: [gain('audace', 1)],
    }),
    choice('rendezvous', 'encoreLettres', 'Écrire que tu préfères rester sans visage'),

    choice('encoreLettres', 'bal', 'Te décider à aller au bal malgré tout', { effects: [gain('audace', 1)] }),
    choice('encoreLettres', 'finSilence', 'Laisser passer samedi'),

    choice('bal', 'danse', "L'inviter à danser", { condition: atLeast('audace', 3), effects: [gain('complicite', 2)] }),
    choice('bal', 'aveu', 'Lui tendre ta lettre en silence', { effects: [gain('complicite', 1)] }),
    choice('bal', 'fuite', "Faire demi-tour avant qu'elle ne te voie"),

    choice('theatre', 'escaliers', 'Quitter le théâtre avant la fin pour marcher avec elle'),
    choice('theatre', 'escaliers', "Rester jusqu'au rideau, sa main près de la tienne", { effects: [gain('complicite', 1)] }),

    choice('danse', 'escaliers', "Sortir prendre l'air"),
    choice('aveu', 'escaliers', 'La suivre dehors'),

    choice('fuite', 'gare', 'Courir à la gare de Lyon'),
    choice('fuite', 'finVitrine', 'Rentrer chez toi'),

    choice('gare', 'finQuai', 'Monter dans le train avec elle, sans bagage', { condition: atLeast('complicite', 3) }),
    choice('gare', 'finPromesse', 'Lui promettre de la rejoindre'),

    choice('escaliers', 'finRester', 'Lui demander de rester à Paris', { condition: atLeast('complicite', 6) }),
    choice('escaliers', 'finMarseille', 'Proposer de partir avec elle', { condition: atLeast('audace', 4) }),
    choice('escaliers', 'finLettres', "Lui promettre d'écrire chaque semaine"),
  ],
};
