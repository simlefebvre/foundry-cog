/**
 * Renames the former magic combat score and its combat modifiers in stored data.
 * @param {object} source The actor or item system source data.
 * @returns {object} The migrated source data.
 */
export function migratePsychicScore(source) {
  if (source.combat && source.combat.psychic === undefined && source.combat.magic !== undefined) {
    source.combat.psychic = source.combat.magic
  }
  if (source.combat) delete source.combat.magic

  const migrateModifiers = (modifiers = []) => {
    for (const modifier of modifiers) {
      if (modifier.subtype === "combat" && modifier.target === "magic") modifier.target = "psychic"
    }
  }

  migrateModifiers(source.modifiers)
  for (const action of source.actions ?? []) migrateModifiers(action.modifiers)
  for (const effect of source.currentEffects ?? []) migrateModifiers(effect.modifiers)
  return source
}

/**
 * Renames the former encounter-level magic score.
 * @param {object} source The encounter system source data.
 * @returns {object} The migrated source data.
 */
export function migrateEncounterPsychicScore(source) {
  if (source.psychic === undefined && source.magic !== undefined) source.psychic = source.magic
  delete source.magic
  return source
}
