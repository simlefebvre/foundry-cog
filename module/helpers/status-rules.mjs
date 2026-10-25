/**
 * Résout les remplacements de statuts déclarés par les modules de règles.
 * Une protection contre les cycles évite qu'une configuration fautive bloque Foundry.
 *
 * @param {string} statusId Identifiant demandé.
 * @param {Record<string, string>} replacements Table source -> destination.
 * @returns {string} Identifiant effectif.
 */
export function resolveStatusId(statusId, replacements = {}) {
  if (typeof statusId !== "string") return statusId

  let resolved = statusId
  const visited = new Set()
  while (replacements[resolved] && !visited.has(resolved)) {
    visited.add(resolved)
    resolved = replacements[resolved]
  }
  return resolved
}

/**
 * Cherche si l'un des statuts de la cible impose un critique pour le type d'attaque.
 *
 * @param {Iterable<string>} statuses Statuts actifs de la cible.
 * @param {string} actionType Type d'action (melee, ranged, magical, spell...).
 * @param {Record<string, {automaticCritical: "all"|string[]}>} rules Règles par statut.
 * @returns {string|null} Statut ayant imposé le critique, ou null.
 */
export function findAutomaticCriticalStatus(statuses, actionType, rules = {}) {
  for (const statusId of statuses ?? []) {
    const selector = rules[statusId]?.automaticCritical
    if (selector === "all" || (Array.isArray(selector) && selector.includes(actionType))) return statusId
  }
  return null
}

/**
 * Cherche si l'un des statuts de la cible transforme une attaque réussie en critique.
 *
 * @param {Iterable<string>} statuses Statuts actifs de la cible.
 * @param {string} actionType Type d'action.
 * @param {Record<string, {criticalOnHit: "all"|string[]}>} rules Règles par statut.
 * @returns {string|null} Statut appliquant le critique, ou null.
 */
export function findCriticalOnHitStatus(statuses, actionType, rules = {}) {
  for (const statusId of statuses ?? []) {
    const selector = rules[statusId]?.criticalOnHit
    if (selector === "all" || (Array.isArray(selector) && selector.includes(actionType))) return statusId
  }
  return null
}

/**
 * Indique si la cécité interdit une attaque à distance.
 *
 * @param {Iterable<string>} statuses Statuts actifs de l'attaquant.
 * @param {string} actionType Type d'action.
 * @returns {boolean} true si l'attaque à distance est interdite.
 */
export function isRangedAttackBlockedByBlindness(statuses, actionType) {
  return actionType === "ranged" && new Set(statuses ?? []).has("blind")
}
