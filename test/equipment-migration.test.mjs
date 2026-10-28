import assert from "node:assert/strict"
import test from "node:test"
import { migrateEquipmentSubtype } from "../module/helpers/equipment-migration.mjs"

test("migre les anciens boucliers en armures", () => {
  const source = { subtype: "shield", defense: 2, equipped: true }

  migrateEquipmentSubtype(source)

  assert.deepEqual(source, { subtype: "armor", defense: 2, equipped: true })
})

test("ne modifie pas les autres sous-types d'équipement", () => {
  const source = { subtype: "weapon" }

  migrateEquipmentSubtype(source)

  assert.deepEqual(source, { subtype: "weapon" })
})
