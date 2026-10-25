export const ABILITIES = {
  dex: {
    id: "dex",
    label: "CO.abilities.long.dex",
  },
  con: {
    id: "con",
    label: "CO.abilities.long.con",
  },
  for: {
    id: "for",
    label: "CO.abilities.long.for",
  },
  per: {
    id: "per",
    label: "CO.abilities.long.per",
  },
  cha: {
    id: "cha",
    label: "CO.abilities.long.cha",
  },
  int: {
    id: "int",
    label: "CO.abilities.long.int",
  },
}

export const RESOURCES = {
  fortune: {
    id: "fortune",
    label: "CO.resources.long.fortune",
    ability: "cha",
  },
}

export const COMBAT = {
  init: {
    id: "init",
    label: "CO.combat.long.init",
    ability: "per",
  },
  def: {
    id: "def",
    label: "CO.combat.long.def",
    ability: "dex",
  },
  melee: {
    id: "melee",
    label: "CO.combat.long.melee",
    ability: "for",
  },
  ranged: {
    id: "ranged",
    label: "CO.combat.long.ranged",
    ability: "dex",
  },
  psychic: {
    id: "psychic",
    label: "CO.combat.long.psychic",
    ability: "int",
  },
  crit: {
    id: "crit",
    label: "CO.combat.long.crit",
    ability: "",
  },
  dr: {
    id: "dr",
    label: "CO.ui.dr",
    ability: "",
  },
}

export const ATTACK_TYPE = {
  melee: {
    id: "melee",
    label: "CO.combat.long.melee",
    ability: "for",
  },
  ranged: {
    id: "ranged",
    label: "CO.combat.long.ranged",
    ability: "dex",
  },
  magic: {
    id: "magic",
    label: "CO.combat.long.psychic",
    ability: "int",
  },
}

export const LIVING_STANDARDS = {
  wealthy: "CO.livingStandard.wealthy",
  poor: "CO.livingStandard.poor",
  modest: "CO.livingStandard.modest",
  comfortable: "CO.livingStandard.comfortable",
}

export const LIVING_STANDARD_RANK = {
  poor: 0,
  modest: 1,
  comfortable: 2,
  wealthy: 3,
}

export const BASE_FORTUNE = 2
export const BASE_INITIATIVE = 10
export const BASE_DEFENSE = 10
export const BASE_CRITICAL = 20
