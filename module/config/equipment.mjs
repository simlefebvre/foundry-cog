export const EQUIPMENT_SUBTYPES = {
  armor: {
    id: "armor",
    label: "CO.equipment.subtypes.armor",
  },
  shield: {
    id: "shield",
    label: "CO.equipment.subtypes.shield",
  },
  weapon: {
    id: "weapon",
    label: "CO.equipment.subtypes.weapon",
  },
  consumable: {
    id: "consumable",
    label: "CO.equipment.subtypes.consumable",
  },
  misc: {
    id: "misc",
    label: "CO.equipment.subtypes.misc",
  },
}

export const RANGED_WEAPON_STATES = {
  normal: { id: "normal", label: "CO.equipment.rangedStates.normal" },
  misfire: { id: "misfire", label: "CO.equipment.rangedStates.misfire" },
  broken: { id: "broken", label: "CO.equipment.rangedStates.broken" },
}

// hasStates : false si l'arme n'a que l'état normal (pas d'incident de tir ni de casse)
export const RANGED_WEAPON_TYPES = {
  archaic: { id: "archaic", label: "CO.equipment.rangedTypes.archaic", hasStates: true },
  firearm: { id: "firearm", label: "CO.equipment.rangedTypes.firearm", hasStates: true },
  heavy: { id: "heavy", label: "CO.equipment.rangedTypes.heavy", hasStates: true },
  sonic: { id: "sonic", label: "CO.equipment.rangedTypes.sonic", hasStates: false },
  plasma: { id: "plasma", label: "CO.equipment.rangedTypes.plasma", hasStates: true },
  laser: { id: "laser", label: "CO.equipment.rangedTypes.laser", hasStates: true },
  ionic: { id: "ionic", label: "CO.equipment.rangedTypes.ionic", hasStates: true },
}

// COF2 Livre de Règles, Page 193
export const EQUIPMENT_RARITY = {
  common: {
    id: "common",
    label: "CO.rarity.common",
  },
  precious: {
    id: "precious",
    label: "CO.rarity.precious",
  },
  exotic: {
    id: "exotic",
    label: "CO.rarity.exotic",
  },
  rare: {
    id: "rare",
    label: "CO.rarity.rare",
  },
  veryRare: {
    id: "veryRare",
    label: "CO.rarity.veryRare",
  },
  unique: {
    id: "unique",
    label: "CO.rarity.unique",
  },
}

/**
 * Devise par défaut du système (crédit unique).
 * Un module de contenu d'univers peut REMPLACER l'ensemble à son hook
 * `init` via `game.system.CONST.CURRENCY = {...}`, AVANT que le schéma `wealth` des acteurs (character/
 * encounter) ne soit figé : `defineSchema` est paresseux (appelé au plus tôt à setup/ready, donc après
 * tous les init de modules). Le data path de la richesse est `system.wealth.<id>.value`.
 * Contrat : chaque entrée = { id, label } ; `label` est une clé i18n localisée à l'affichage par le
 * helper Handlebars `getCurrencyLabel` — un module fournit ses propres clés dans son namespace.
 */
export const EQUIPMENT_CURRENCIES = {
  credit: {
    id: "credit",
    label: "CO.currency.credit",
  },
}
