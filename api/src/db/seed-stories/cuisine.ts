import type { SeedStory } from '../seed-data.js';
import { atLeast, choice, ending, gain, give, has, numberStat, scene, textStat } from './helpers.js';

/**
 * Tranche de vie sans combat, 13 scènes et 4 fins toutes heureuses : un concours de gâteaux
 * dans un village breton. La Saveur s'additionne au fil des choix et décide du palmarès.
 */
export const kitchenStory: SeedStory = {
  title: 'Le Kouign-amann de Mamie Rose',
  summary:
    "Mamie Rose s'est cassé le poignet la veille du concours de gâteaux de Plouhinec, qu'elle gagne depuis trente ans. C'est à toi de reprendre le tablier, sous ses ordres, depuis le canapé.",
  genre: 'Tranche de vie',
  coverUrl: null,
  published: true,
  hasCombat: false,
  stats: [
    numberStat('saveur', 'Saveur', 0, 0, 20),
    numberStat('calme', 'Calme', 3, 0, 5),
    textStat('tablier', 'Tablier', 'Commis de Mamie Rose'),
  ],
  attackStatKey: null,
  hpStatKey: null,
  enemies: [],
  items: [
    {
      key: 'carnet',
      name: 'Carnet de recettes',
      description: "Couverture en toile cirée, pages collées de beurre. L'écriture de Rose penche à gauche.",
      imageUrl: null,
      useEffects: null,
    },
    {
      key: 'beurre',
      name: 'Beurre demi-sel',
      description: 'Une motte généreuse. Rose dit que tout le secret est là.',
      imageUrl: null,
      useEffects: null,
    },
    {
      key: 'cidre',
      name: 'Bouteille de cidre',
      description: 'Offerte par Yann, de la ferme de Kerbastard. Brut, évidemment.',
      imageUrl: null,
      useEffects: null,
    },
    {
      key: 'astuce',
      name: 'Astuce de Mme Le Goff',
      description: "Griffonnée sur un ticket de caisse : « Une pincée de fleur de sel sur le dessus, juste avant d'enfourner. »",
      imageUrl: null,
      useEffects: [gain('saveur', 1)],
    },
    {
      key: 'caramel',
      name: 'Bonbon au caramel',
      description: 'Rose en cache partout. Un seul suffit à te calmer.',
      imageUrl: null,
      useEffects: [gain('calme', 1)],
    },
  ],
  startSceneKey: 'cuisine',
  scenes: [
    scene(
      'cuisine',
      'La cuisine de Rose',
      "Sept heures du matin à Plouhinec. Mamie Rose trône sur le canapé, le poignet dans le plâtre, un bol de café dans la main valide. « Le concours est à seize heures. Trente ans que je le gagne, ce n'est pas un bout de plâtre qui va m'arrêter. C'est toi qui feras le kouign-amann, et je te dirai quoi faire. » Elle te lance son carnet de recettes et un bonbon au caramel.",
      { onEnterEffects: [give('carnet'), give('caramel')] },
    ),
    scene(
      'carnet',
      'Le carnet',
      "Page 12, entre une tache de beurre et une recette de far : « Kouign-amann. Du beurre de chez Yann, jamais d'autre. Une larme de cidre dans la pâte, ne le dis à personne. Trois tours, pas quatre. Et surtout, garder son calme quand ça caramélise. » En marge, au crayon : « Mme Le Goff triche, j'en suis sûre. »",
      { onEnterEffects: [gain('saveur', 1)] },
    ),
    scene(
      'marche',
      'Le marché du samedi',
      "Le marché bat son plein sous les halles. La file devant le stand de Yann, le fermier de Kerbastard, fait déjà le tour de la fontaine. En face, la supérette vend du beurre en plaquettes, sans attendre. Et là-bas, devant le rayon farine, tu reconnais Mme Le Goff, la rivale de toujours.",
    ),
    scene(
      'yann',
      'Le stand de Yann',
      "Vingt minutes de queue plus tard, Yann te reconnaît : « Le petit-enfant de Rose ! Comment va son poignet ? » Il enveloppe une motte de beurre dans du papier, refuse que tu paies et glisse une bouteille de cidre dans ton panier. « Pour la pâte. Elle ne le dit à personne, mais tout le monde sait. »",
      { onEnterEffects: [give('beurre'), give('cidre'), gain('saveur', 3)] },
    ),
    scene(
      'superette',
      'La supérette',
      "Tu attrapes deux plaquettes de beurre au rayon frais. Au moment de payer, Mme Le Goff se glisse derrière toi dans la file. Elle regarde ton panier, puis ton visage. « Alors c'est toi qui remplaces Rose cette année ? Bon courage. »",
      { onEnterEffects: [give('beurre'), gain('saveur', 1)] },
    ),
    scene(
      'legoff',
      'Mme Le Goff',
      "Tu lui demandes pourquoi elle en veut tant à ta grand-mère. Mme Le Goff hésite, puis soupire : elles étaient amies, avant. Un concours perdu en 1994, un mot de trop, trente ans de silence. Avant de partir, elle griffonne quelque chose au dos de son ticket et te le tend sans un mot.",
      { onEnterEffects: [give('astuce')] },
    ),
    scene(
      'petrin',
      'Le pétrin',
      "La farine vole jusqu'au plafond. Depuis le canapé, Rose commente chacun de tes gestes : « Plus vite ! Moins fort ! Tu n'es pas en train de pétrir une pâte à pizza ! » La pâte est prête pour le beurre. C'est le moment de décider comment tu vas la travailler.",
    ),
    scene(
      'four',
      'Le four',
      "Le kouign-amann dore dans le four. L'odeur de beurre et de sucre envahit toute la maison. Soudain, Pompon, le chat de Rose, saute sur le plan de travail et renverse le sucrier. Au même moment, une fumée suspecte s'échappe de la porte du four. Rose crie depuis le salon : « Ça sent le brûlé ! »",
    ),
    scene(
      'jury',
      'La salle des fêtes',
      "Seize heures, salle des fêtes de Plouhinec. Douze gâteaux attendent sur la grande table, dont celui de Mme Le Goff, parfait comme toujours. Rose est venue, le bras en écharpe, installée au premier rang comme une reine. Les trois jurés goûtent chaque part en silence. Puis ils arrivent devant le tien.",
    ),
    ending(
      'finPremier',
      'Le ruban bleu',
      "Le président du jury repose sa fourchette, ferme les yeux, et ne dit rien pendant un long moment. « Premier prix. » Rose se lève en renversant sa chaise et crie plus fort que tout le monde. Ce soir-là, le ruban bleu rejoint les trente autres au-dessus de la cheminée. Rose y épingle une étiquette : « Celui-là n'est pas le mien. »",
    ),
    ending(
      'finPublic',
      'Le prix du public',
      "Le jury donne le premier prix à Mme Le Goff, comme prévu. Mais à la fin de l'après-midi, ton plateau est le premier vide, et les villageois votent pour toi au prix du public. Rose hausse les épaules : « Le jury, c'est trois personnes. Le public, c'est tout Plouhinec. »",
    ),
    ending(
      'finRose',
      'Le goûter',
      "Tu ne gagnes rien, et tu t'en fiches un peu. Le soir, tu rapportes ce qui reste du kouign-amann à la maison. Rose en mange trois parts, avec la main gauche, en disant qu'il manque un tour de pâte. Puis elle te sourit : « L'an prochain, on le fait à quatre mains. »",
    ),
    ending(
      'finAmies',
      'Deux chaises au premier rang',
      "Pendant que le jury délibère, tu apportes une part à Mme Le Goff, avec la fleur de sel sur le dessus. Elle goûte, reconnaît son astuce, et éclate de rire. Puis elle traverse la salle et s'assoit à côté de Rose. Personne n'entend ce qu'elles se disent. Mais le lendemain, elles prennent le café ensemble pour la première fois en trente ans.",
    ),
  ],
  choices: [
    choice('cuisine', 'carnet', 'Lire le carnet de Rose'),
    choice('cuisine', 'marche', 'Filer au marché sans perdre de temps'),

    choice('carnet', 'marche', 'Filer au marché'),

    choice('marche', 'yann', 'Faire la queue chez Yann'),
    choice('marche', 'superette', 'Prendre du beurre à la supérette'),

    choice('yann', 'petrin', 'Rentrer vite à la maison'),

    choice('superette', 'legoff', "Lui demander ce qu'elle reproche à ta grand-mère"),
    choice('superette', 'petrin', 'Payer et rentrer sans répondre'),

    choice('legoff', 'petrin', 'Rentrer, le ticket dans la poche'),

    choice('petrin', 'four', 'Ajouter une larme de cidre, comme dans le carnet', {
      condition: has('cidre'),
      effects: [gain('saveur', 3), give('cidre', -1)],
    }),
    choice('petrin', 'four', 'Faire trois tours de pâte, pas un de plus', {
      condition: has('carnet'),
      effects: [gain('saveur', 2)],
    }),
    choice('petrin', 'four', 'Improviser, en suivant ton instinct', { effects: [gain('saveur', 1)] }),

    choice('four', 'jury', 'Baisser le four et garder ton calme', {
      condition: atLeast('calme', 3),
      effects: [gain('saveur', 2)],
    }),
    choice('four', 'jury', 'Ouvrir la porte du four pour vérifier', { effects: [gain('saveur', -1), gain('calme', -1)] }),
    choice('four', 'jury', 'Appeler Rose à la rescousse', { effects: [gain('calme', 1)] }),

    choice('jury', 'finPremier', 'Écouter le verdict', { condition: atLeast('saveur', 8) }),
    choice('jury', 'finPublic', 'Servir des parts au public en attendant', { condition: atLeast('saveur', 5) }),
    choice('jury', 'finAmies', 'Apporter une part à Mme Le Goff', { condition: has('astuce') }),
    choice('jury', 'finRose', 'Rejoindre Rose au premier rang'),
  ],
};
