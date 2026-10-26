/*
ACTIVE_EFFECT_MODES : CUSTOM = 0, MULTIPLY = 1, ADD = 2, DOWNGRADE = 3, UPGRADE = 4, OVERRIDE = 5

États préjudiciables
  Aveuglé : -5 en Init., aux attaques de mêlée et en DEF. Les attaques à distance et les attaques magiques nécessitant de voir la cible sont impossibles.
  Affaibli : utilise un d12 à la place d'un d20 pour tous les tests.
  Épuisé : -5 à tous les jets.
  Fatigué : -2 à tous les jets.
  Blessé : utilise un d12 à la place d'un d20 pour les tests de FOR, DEX et CON.
  Confus : utilise un d12 à la place d'un d20 pour les tests d'INT, PER et CHA.
  Étourdi : Aucune action possible et -5 en DEF.
  Immobilisé : pas de déplacement, dé malus aux tests d’attaque et d12 à la place du d20 pour tous les tests.
  Invalide : Le déplacement est limité à 5 m par action de mouvement.
  Ralenti : Une seule action par round (action d’attaque ou de mouvement).
  Renversé : -5 en attaque et DEF, nécessite une action d’attaque pour se relever.
  Surpris : Pas d’action et ‑5 en DEF au premier round de combat.

  Aveuglé : blind
  Affaibli : weakened
  Épuisé : exhausted
  Fatigué : tired
  Blessé : wounded
  Étourdi : stun
  Immobilisé : immobilized
  Invalide : invalid
  Ralenti : slowed
  Renversé : overturned
  Surpris : surprised

Autres états
  dead : Mort
  confused : Confus
  unconscious : Inconscient

*/

export const REMOVED_STATUS_EFFECT_IDS = ["outOfBreath", "paralysis", "invisible", "poison", "bleeding", "silence", "enslaved", "other", "customEffect"]

export const CUSTOM_STATUS_EFFECT = [
  {
    id: "dead",
    name: "CO.customStatus.dead",
    img: "icons/svg/skull.svg",
    changes: [
      {
        key: "system.attributes.hp.value",
        mode: 5,
        value: 0,
      },
    ],
    description: "CO.customStatus.deadDescription",
  },
  {
    id: "confused",
    name: "CO.customStatus.confused",
    img: "icons/svg/daze.svg",
    description: "CO.customStatus.confusedDescription",
  },
  {
    id: "wounded",
    name: "CO.customStatus.wounded",
    img: "icons/svg/blood.svg",
    description: "CO.customStatus.woundedDescription",
  },
  {
    id: "exhausted",
    name: "CO.customStatus.exhausted",
    img: "icons/svg/downgrade.svg",
    description: "CO.customStatus.exhaustedDescription",
  },
  {
    id: "tired",
    name: "CO.customStatus.tired",
    img: "icons/svg/downgrade.svg",
    description: "CO.customStatus.tiredDescription",
  },
  {
    id: "immobilized",
    name: "CO.customStatus.immobilized",
    img: "systems/cog/ui/effects/immobilized.webp",
    changes: [
      {
        key: "system.attributes.movement.base",
        mode: 5,
        value: 0,
      },
      {
        key: "system.attributes.movement.bonuses.sheet",
        mode: 5,
        value: 0,
      },
      {
        key: "system.attributes.movement.bonuses.effects",
        mode: 5,
        value: 0,
      },
    ],
    description: "CO.customStatus.immobilizedDescription",
  },
  {
    id: "stun",
    name: "CO.customStatus.stun",
    img: "icons/svg/daze.svg",
    changes: [
      {
        key: "system.combat.def.bonuses.effects",
        mode: 2,
        value: -5,
      },
    ],
    description: "CO.customStatus.stunDescription",
  },
  {
    id: "blind",
    name: "CO.customStatus.blind",
    img: "icons/svg/blind.svg",
    changes: [
      {
        key: "system.combat.melee.bonuses.effects",
        mode: 2,
        value: -5,
      },
      {
        key: "system.combat.init.bonuses.effects",
        mode: 2,
        value: -5,
      },
      {
        key: "system.combat.def.bonuses.effects",
        mode: 2,
        value: -5,
      },
    ],
    description: "CO.customStatus.blindDescription",
  },
  {
    id: "invalid",
    name: "CO.customStatus.invalid",
    img: "systems/cog/ui/effects/disably.webp",
    changes: [
      {
        key: "system.attributes.movement.bonuses.effects",
        mode: 2,
        value: -5,
      },
    ],
    description: "CO.customStatus.invalidDescription",
  },
  {
    id: "slowed",
    name: "CO.customStatus.slowed",
    img: "systems/cog/ui/effects/slow.webp",
    description: "CO.customStatus.slowedDescription",
  },
  {
    id: "overturned",
    name: "CO.customStatus.overturned",
    img: "systems/cog/ui/effects/upsidedown.webp",
    changes: [
      {
        key: "system.combat.melee.bonuses.effects",
        mode: 2,
        value: -5,
      },
      {
        key: "system.combat.ranged.bonuses.effects",
        mode: 2,
        value: -5,
      },
      {
        key: "system.combat.psychic.bonuses.effects",
        mode: 2,
        value: -5,
      },
      {
        key: "system.combat.def.bonuses.effects",
        mode: 2,
        value: -5,
      },
    ],
    description: "CO.customStatus.overturnedDescription",
  },
  {
    id: "surprised",
    name: "CO.customStatus.surprised",
    img: "systems/cog/ui/effects/surprised.webp",
    changes: [
      {
        key: "system.combat.def.bonuses.effects",
        mode: 2,
        value: -5,
      },
    ],
    description: "CO.customStatus.surprisedDescription",
  },
  {
    id: "weakened",
    name: "CO.customStatus.weakened",
    img: "icons/svg/downgrade.svg",
    description: "CO.customStatus.weakenedDescription",
  },
  {
    id: "seriousWound",
    name: "CO.customStatus.seriousWound",
    img: "icons/svg/blood.svg",
    description: "CO.customStatus.seriousWoundDescription",
  },
  {
    id: "unconscious",
    name: "CO.customStatus.unconscious",
    img: "icons/svg/unconscious.svg",
    description: "CO.customStatus.unconsciousDescription",
  },
  // Les postures défensives (défense partielle et totale) sont une manœuvre propre à COF2 :
  // elles sont fournies par un module de contenu via game.system.CONST.defenseStances
]

export const CUSTOM_EFFECT = {
  damageOrHeal: {
    id: "damageOrHeal",
    name: "CO.customEffect.damageOrHeal",
    description: "CO.customEffect.damageOrHealDescription",
  },
  status: {
    id: "status",
    name: "CO.customEffect.status",
    description: "CO.customEffect.statusDescription",
  },
  buff: {
    id: "buff",
    name: "CO.customEffect.buff",
    description: "CO.customEffect.buffDescription",
  },
  debuff: {
    id: "debuff",
    name: "CO.customEffect.debuff",
    description: "CO.customEffect.debuffDescription",
  },
}

export const CUSTOM_EFFECT_ELEMENT = {
  acid: {
    id: "acid",
    label: "CO.customEffect.acid",
    description: "CO.customEffect.acidDescription",
  },
  lightning: {
    id: "lightning",
    label: "CO.customEffect.lightning",
    description: "CO.customEffect.lightningDescription",
  },
  fire: {
    id: "fire",
    label: "CO.customEffect.fire",
    description: "CO.customEffect.fireDescription",
  },
  ice: {
    id: "ice",
    label: "CO.customEffect.ice",
    description: "CO.customEffect.iceDescription",
  },
  disease: {
    id: "disease",
    label: "CO.customEffect.disease",
    description: "CO.customEffect.diseaseDescription",
  },
  poison: {
    id: "poison",
    label: "CO.customEffect.poison",
    description: "CO.customEffect.poisonDescription",
  },
  putrid: {
    id: "putrid",
    label: "CO.customEffect.putrid",
    description: "CO.customEffect.putridDescription",
  },
  sacred: {
    id: "sacred",
    label: "CO.customEffect.sacred",
    description: "CO.customEffect.sacredDescription",
  },
}
