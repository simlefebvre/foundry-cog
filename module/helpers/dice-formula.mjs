/**
 * Construit la partie dé d'un jet standard, avec bonus ou avec malus.
 *
 * @param {"standard"|"bonus"|"malus"} dice Type de jet.
 * @param {number} faces Nombre de faces du dé.
 * @returns {string} Formule des dés.
 */
export function getDiceFormula(dice, faces = 20) {
  if (dice === "bonus") return `2d${faces}kh`
  if (dice === "malus") return `2d${faces}kl`
  return `1d${faces}`
}

/**
 * Détermine le nombre de faces du dé selon les statuts et la caractéristique testée.
 *
 * @param {Iterable<string>} statuses Statuts actifs.
 * @param {string} abilityId Identifiant de la caractéristique testée.
 * @returns {number} Nombre de faces du dé.
 */
export function getTestDieFaces(statuses, abilityId) {
  const activeStatuses = new Set(statuses ?? [])
  if (activeStatuses.has("weakened") || activeStatuses.has("immobilized")) return 12
  if (activeStatuses.has("wounded") && ["for", "dex", "con"].includes(abilityId)) return 12
  if (activeStatuses.has("confused") && ["int", "per", "cha"].includes(abilityId)) return 12
  return 20
}

/**
 * Associe un type d'attaque à la caractéristique utilisée par le personnage.
 *
 * @param {string} attackType Type d'attaque.
 * @returns {string|undefined} Caractéristique associée.
 */
export function getAttackAbilityId(attackType) {
  if (attackType === "melee") return "for"
  if (attackType === "ranged") return "dex"
  if (attackType === "magical") return "int"
  return undefined
}

/**
 * Renvoie le malus numérique le plus élevé imposé par un état de fatigue.
 *
 * @param {Iterable<string>} statuses Statuts actifs.
 * @returns {number} Malus à appliquer au résultat du jet.
 */
export function getTestRollPenalty(statuses) {
  const activeStatuses = new Set(statuses ?? [])
  if (activeStatuses.has("exhausted")) return 5
  if (activeStatuses.has("tired")) return 2
  return 0
}
