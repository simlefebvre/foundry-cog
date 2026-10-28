/**
 * Converts the removed shield equipment subtype to armor.
 * @param {object} source Equipment system data.
 */
export function migrateEquipmentSubtype(source) {
  if (source.subtype === "shield") source.subtype = "armor"
}
