/**
 * Actions générales ajoutées aux nouveaux personnages.
 * @type {{name: string, slug: string, type: string, actionType: string, description: string}[]}
 */
export const DEFAULT_CHARACTER_ACTIONS = [
  {
    name: "Aider",
    slug: "aider",
    type: "buff",
    actionType: "a",
    description:
      "Choisissez un compagnon avant son jet d’attaque. Il reçoit +2 à ses attaques ou à ses DM jusqu’à la fin de son prochain tour. Si plusieurs personnages l’aident pour le même test, le bonus s’applique à l’attaque et aux DM.",
  },
  {
    name: "Combat à deux armes",
    slug: "combat-a-deux-armes",
    type: "melee",
    actionType: "l",
    description: "Avec une arme de contact à une main dans chaque main, ou deux pistolets, effectuez chaque attaque avec 1d12 au lieu de 1d20. Les DM restent normaux.",
  },
  {
    name: "Défense simple",
    slug: "defense-simple",
    type: "buff",
    actionType: "a",
    description: "Au contact, augmentez votre DEF de +2 jusqu’au début de votre prochain tour.",
  },
  {
    name: "Défense totale",
    slug: "defense-totale",
    type: "buff",
    actionType: "l",
    description: "Au contact, augmentez votre DEF de +5 jusqu’au début de votre prochain tour.",
  },
  {
    name: "Lancer une grenade",
    slug: "lancer-une-grenade",
    type: "ranged",
    actionType: "l",
    description:
      "Nécessite la voie des armes lourdes. Visez une zone : test d’attaque à distance ND 15 jusqu’à 15 m, puis ND 20 jusqu’à 30 m. Un échec éloigne ou empêche l’explosion ; un échec critique menace le lanceur ou un allié, au choix du MJ. Le lancer depuis un couvert est possible avec -5. Une réussite critique ne double pas les DM.",
  },
  {
    name: "Mettre en joue",
    slug: "mettre-en-joue",
    type: "ranged",
    actionType: "a",
    description: "Visez une cible située à moins de 5 m. Jusqu’au début de votre prochain tour, vous pouvez l’attaquer à tout moment, y compris en interrompant son tour.",
  },
  {
    name: "Remettre en état son arme",
    slug: "remettre-en-etat-son-arme",
    type: "ranged",
    actionType: "m",
    description: "Permet, lorsque la situation le nécessite, de réutiliser une arme à feu ou à énergie après un incident de tir.",
  },
  {
    name: "Se mettre à couvert",
    slug: "se-mettre-a-couvert",
    type: "buff",
    actionType: "l",
    description:
      "À distance, déplacez-vous jusqu’à 20 m pour rejoindre un couvert partiel ou créez-en un en déplaçant des objets. Tant que vous y restez, les attaques à distance contre vous subissent -2.",
  },
  {
    name: "Tir visé",
    slug: "tir-vise",
    type: "ranged",
    actionType: "l",
    description: "Ajoutez votre PER à l’attaque ou aux DM. Si vous êtes en appui sur un trépied et/ou tirez en position couchée, ajoutez votre PER aux deux.",
  },
]

export const DEFAULT_CHARACTER_ACTION_SLUGS = new Set(DEFAULT_CHARACTER_ACTIONS.map(({ slug }) => slug))
