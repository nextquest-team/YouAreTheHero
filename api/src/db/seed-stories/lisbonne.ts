import type { SeedStory } from '../seed-data.js';
import { atLeast, choice, ending, gain, give, has, numberStat, scene, textStat } from './helpers.js';

/**
 * Romance contemporaine sans combat, 19 scènes et 6 fins. Deux personnages à qui s'attacher,
 * Inês et Tomás, chacun suivi par sa propre stat : la fête de Santo António révèle vers qui
 * le joueur a penché pendant l'été.
 */
export const lisbonStory: SeedStory = {
  title: 'Un été à Lisbonne',
  summary:
    "Trois mois de stage, une colocation perchée dans l'Alfama et une ville qui sent la sardine grillée. Entre Inês, qui restaure les azulejos du quartier, et Tomás, ton colocataire guitariste, l'été risque de passer trop vite.",
  genre: 'Romance',
  coverUrl: null,
  published: true,
  hasCombat: false,
  stats: [
    numberStat('ines', 'Inês', 0, 0, 10),
    numberStat('tomas', 'Tomás', 0, 0, 10),
    numberStat('portugais', 'Portugais', 0, 0, 5),
    textStat('quartier', 'Quartier', 'Alfama'),
  ],
  attackStatKey: null,
  hpStatKey: null,
  enemies: [],
  items: [
    {
      key: 'cle',
      name: 'Clé de la coloc',
      description: "Accrochée à un porte-clés en forme de sardine. La porte d'entrée coince quand il pleut.",
      imageUrl: null,
      useEffects: null,
    },
    {
      key: 'dico',
      name: 'Dictionnaire de poche',
      description: "Glissé dans ta valise au dernier moment. Le feuilleter t'apprend quelques mots de plus.",
      imageUrl: null,
      useEffects: [gain('portugais', 1)],
    },
    {
      key: 'vinyle',
      name: 'Vinyle de fado',
      description: "Amália Rodrigues, pochette usée. Tomás dit que tout ce qu'il sait vient de là.",
      imageUrl: null,
      useEffects: null,
    },
    {
      key: 'azulejo',
      name: 'Azulejo fêlé',
      description: 'Un carreau bleu et blanc, trop abîmé pour le mur, offert par Inês.',
      imageUrl: null,
      useEffects: null,
    },
  ],
  startSceneKey: 'arrivee',
  scenes: [
    scene(
      'arrivee',
      'Rua dos Remédios',
      "Ta valise rebondit sur les pavés glissants de l'Alfama. Au troisième étage d'une maison couverte de carreaux bleus, un garçon aux cheveux en bataille t'ouvre en riant : Tomás, ton colocataire pour l'été. Il te tend une clé, s'excuse pour le désordre et repart porter des amplis plus grands que lui vers la terrasse du toit.",
      { onEnterEffects: [give('cle'), give('dico')] },
    ),
    scene(
      'terrasse',
      'Le toit',
      "Depuis le toit, on voit le Tage briller entre les cheminées. Une fois les amplis installés, Tomás attrape sa guitare et joue quelques accords, les yeux fermés. « Vendredi, je chante dans une tasca du quartier. Il y a une place pour toi au premier rang, si tu veux. »",
      { onEnterEffects: [gain('tomas', 1)] },
    ),
    scene(
      'cafe',
      'Café Azul',
      "Au coin de la rue, le Café Azul tient dans un mouchoir de poche. Derrière le comptoir, une jeune femme aux mains tachées de peinture bleue sert des bicas bien serrés. Elle s'appelle Inês. Le jour, elle restaure les azulejos des façades ; le matin, elle aide sa grand-mère au café. Elle attend patiemment ta commande.",
    ),
    scene(
      'semaine',
      'La première semaine',
      "La première semaine file entre le stage, les tramways bondés et les pastéis de nata. Le vendredi soir arrive trop vite. Tomás t'a rappelé le concert trois fois. Inês, elle, t'a proposé de la rejoindre sur son chantier au coucher du soleil, pour voir la ville depuis l'échafaudage.",
    ),
    scene(
      'fado',
      'La tasca',
      "La tasca compte six tables et une seule ampoule. Quand Tomás chante, tout le monde se tait, même le patron. Au dernier morceau, il cherche ton regard et annonce : « Celle-ci, je l'ai écrite cette semaine. » À la fin, il te glisse dans les mains un vinyle usé : « Pour que tu comprennes d'où ça vient. »",
      { onEnterEffects: [gain('tomas', 1), give('vinyle')] },
    ),
    scene(
      'azulejos',
      "L'échafaudage",
      "Inês te fait grimper sur l'échafaudage d'une vieille façade. Vous remplacez des carreaux un par un pendant que le ciel vire à l'orange. Elle raconte que le propriétaire du Café Azul veut doubler le loyer à la rentrée, et que sa grand-mère refuse d'en parler. Avant de redescendre, elle te donne un carreau fêlé : « Il est trop abîmé pour le mur, mais pas pour toi. »",
      { onEnterEffects: [gain('ines', 1), give('azulejo')] },
    ),
    scene(
      'tram',
      'Le tram 28',
      "Dimanche, vous partez tous les trois en tram 28 vers le château. À mi-côte, le vieux wagon jaune s'arrête dans un grincement : panne. Le conducteur allume une cigarette, fataliste. Tomás propose de finir à pied jusqu'aux remparts. Inês doit redescendre aider sa grand-mère, et te demande si tu veux venir.",
    ),
    scene(
      'chateau',
      'Castelo de São Jorge',
      "Sur les remparts, les paons crient et le soleil tombe sur les toits rouges. Tomás s'assoit sur le muret, les jambes dans le vide. Il avoue que la chanson de la tasca parlait de toi, et qu'il n'a jamais su chanter autre chose que la vérité.",
      { onEnterEffects: [gain('tomas', 1)] },
    ),
    scene(
      'avo',
      'La cuisine de Rosa',
      "Dans l'arrière-cuisine du Café Azul, avó Rosa t'enfile un tablier sans te demander ton avis. Elle t'apprend à plier la pâte feuilletée des pastéis, et rit chaque fois que tu en rates un. Inês vous regarde depuis la porte, un sourire qu'elle ne cache pas.",
      { onEnterEffects: [gain('ines', 1)] },
    ),
    scene(
      'festa',
      'La nuit de Santo António',
      "Le 12 juin, l'Alfama entière descend dans la rue. Des guirlandes de papier relient les balcons, les sardines grillent à chaque coin et l'air sent le charbon et le basilic. La tradition veut qu'on offre un manjerico, un petit pot de basilic piqué d'un poème, à la personne qu'on aime. Tu en tiens un entre les mains depuis une heure.",
    ),
    scene(
      'baiserInes',
      "Le manjerico d'Inês",
      "Tu tends le pot à Inês. Elle lit le poème à voix haute, en corrigeant ton portugais, puis t'embrasse au milieu de la foule, sous une pluie de confettis. Plus tard, assise sur les marches du café, elle t'avoue qu'elle a trouvé un moyen de garder le Café Azul, mais qu'il lui faudrait quelqu'un pour l'aider cet hiver.",
    ),
    scene(
      'baiserTomas',
      'Le manjerico de Tomás',
      "Tu tends le pot à Tomás. Il le regarde longtemps, comme une partition qu'il déchiffre, puis t'embrasse sans un mot, sa guitare coincée entre vous deux. Sur le toit, à l'aube, il t'annonce qu'un label de Porto lui propose une tournée à la rentrée. Il ne veut pas partir sans savoir.",
    ),
    scene(
      'aube',
      "L'aube sur le Tage",
      "Tu offres ton manjerico à avó Rosa, qui le serre contre elle en riant. Tu danses jusqu'à l'aube avec Inês, avec Tomás, avec des inconnus. Au matin, vous êtes tous les trois assis sur le quai, les pieds au-dessus de l'eau. Il ne reste que deux semaines avant ton vol retour.",
    ),
    ending(
      'finInesReste',
      'Le Café Azul, un hiver',
      "Tu prolonges ton séjour. L'hiver, tu sers des bicas le matin et tu repeins la devanture l'après-midi. Au printemps, le Café Azul a un nouveau bail, et un carreau fêlé est scellé au-dessus de la porte. Inês dit que c'est le plus beau du quartier.",
    ),
    ending(
      'finInesRetour',
      'Un carreau fêlé',
      "Tu rentres en France avec un carreau fêlé dans ta valise. Tous les dimanches, Inês t'appelle depuis le café, et avó Rosa crie des conseils de cuisine derrière elle. En juin prochain, tu as déjà réservé ton billet pour Santo António.",
    ),
    ending(
      'finTomasTournee',
      'La tournée',
      "Tu poses ton préavis de stage et montes dans le van de Tomás. Porto, Coimbra, Faro : trente concerts en deux mois, des nuits trop courtes et des petits-déjeuners sur des aires d'autoroute. Chaque soir, il chante la chanson de la tasca, et chaque soir, il la chante pour toi.",
    ),
    ending(
      'finTomasChanson',
      'Une chanson à la radio',
      "Tu rentres en France comme prévu. En octobre, une chanson passe à la radio, une voix que tu reconnaîtrais entre mille. Le refrain parle d'un toit dans l'Alfama et d'un manjerico. Ton téléphone vibre : « Tu l'as entendue ? Je viens te la chanter en vrai. »",
    ),
    ending(
      'finAmis',
      "L'été des amis",
      "Deux semaines plus tard, Inês et Tomás t'accompagnent à l'aéroport avec une boîte de pastéis. Tu pleures au contrôle de sécurité, sans honte. Tu n'as pas trouvé l'amour cet été, mais deux personnes qui t'attendront chaque juin, sur un toit de l'Alfama.",
    ),
    ending(
      'finLisboeta',
      'Lisboeta',
      "Tu annules ton billet retour. Le portugais te vient maintenant sans réfléchir, et les voisins t'appellent par ton prénom. Tu trouves un travail, un petit appartement avec vue sur le Tage, et une place réservée au Café Azul. Cet été, c'est la ville elle-même qui t'a gardé le cœur.",
    ),
  ],
  choices: [
    choice('arrivee', 'terrasse', 'Aider Tomás à monter ses amplis'),
    choice('arrivee', 'cafe', 'Descendre boire un café au coin de la rue'),

    choice('terrasse', 'cafe', 'Descendre découvrir le quartier'),

    choice('cafe', 'semaine', 'Tenter ta commande en portugais', { effects: [gain('portugais', 1), gain('ines', 1)] }),
    choice('cafe', 'semaine', 'Commander en anglais'),

    choice('semaine', 'fado', 'Aller au concert de Tomás'),
    choice('semaine', 'azulejos', 'Rejoindre Inês sur son chantier'),

    choice('fado', 'tram', "Rester après la fermeture pour l'écouter jouer", { effects: [gain('tomas', 2)] }),
    choice('fado', 'tram', 'Rentrer dormir'),

    choice('azulejos', 'tram', "Lui promettre de l'aider à sauver le café", { effects: [gain('ines', 2)] }),
    choice('azulejos', 'tram', 'Regarder la ville en silence'),

    choice('tram', 'chateau', 'Finir à pied avec Tomás'),
    choice('tram', 'avo', 'Redescendre avec Inês'),

    choice('chateau', 'festa', 'Attendre la fête de Santo António'),

    choice('avo', 'festa', 'Faire la vaisselle en chantant faux'),
    choice('avo', 'festa', 'Raconter ta semaine à Rosa en portugais', {
      condition: atLeast('portugais', 1),
      effects: [gain('ines', 2), gain('portugais', 1)],
    }),

    choice('festa', 'baiserInes', 'Offrir ton manjerico à Inês', { condition: atLeast('ines', 4) }),
    choice('festa', 'baiserTomas', 'Offrir ton manjerico à Tomás', { condition: atLeast('tomas', 4) }),
    choice('festa', 'aube', 'Danser avec tout le monde'),

    choice('baiserInes', 'finInesReste', "Rester à Lisbonne pour l'aider cet hiver", { condition: has('azulejo') }),
    choice('baiserInes', 'finInesRetour', 'Rentrer en promettant de revenir'),

    choice('baiserTomas', 'finTomasTournee', 'Partir en tournée avec lui', { condition: has('vinyle') }),
    choice('baiserTomas', 'finTomasChanson', 'Rentrer en France, sa chanson dans la tête'),

    choice('aube', 'finAmis', 'Rentrer comme prévu'),
    choice('aube', 'finLisboeta', 'Annuler ton billet retour', { condition: atLeast('portugais', 2) }),
  ],
};
