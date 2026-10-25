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

/**
 * Vérifie si un personnage a satisfait toutes les conditions pour récupérer d'Affaibli.
 *
 * @param {object} options Conditions de récupération.
 * @param {boolean} options.hasRested Une nuit de repos a été effectuée depuis l'affaiblissement.
 * @param {number} options.hpValue Points de vie actuels.
 * @param {number} options.hpMax Points de vie maximum.
 * @param {boolean} options.hasSeriousWound Une blessure grave est encore active.
 * @returns {boolean} true si l'état Affaibli peut être retiré.
 */
export function canRecoverFromWeakened({ hasRested, hpValue, hpMax, hasSeriousWound }) {
  return hasRested && hpValue >= hpMax && !hasSeriousWound
}

/**
 * Vérifie si un personnage a satisfait les conditions pour récupérer de Blessé.
 *
 * @param {object} options Conditions de récupération.
 * @param {number} options.hpValue Points de vie actuels.
 * @param {number} options.hpMax Points de vie maximum.
 * @param {boolean} options.hasSeriousWound Une blessure grave est encore active.
 * @returns {boolean} true si l'état Blessé peut être retiré.
 */
export function canRecoverFromWounded({ hpValue, hpMax, hasSeriousWound }) {
  return hpValue >= hpMax && !hasSeriousWound
}

/**
 * Retourne les états supprimés par une nuit complète de repos.
 *
 * @param {Iterable<string>} statuses États actuellement actifs.
 * @returns {string[]} États récupérés après le repos.
 */
export function getFullRestRecoveredStatuses(statuses) {
  const activeStatuses = new Set(statuses ?? [])
  return ["confused", "exhausted", "tired"].filter((statusId) => activeStatuses.has(statusId))
}
