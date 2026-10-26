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
