import assert from "node:assert/strict"
import test from "node:test"
import Utils from "../module/helpers/utils.mjs"
import { migrateEncounterPsychicScore, migratePsychicScore } from "../module/helpers/psychic-migration.mjs"

test("reconnaît @atp et conserve @atm comme raccourcis d'attaque psychique", () => {
  assert.equal(Utils.getAttackTypeFromFormula("@atp"), "magical")
  assert.equal(Utils.getAttackTypeFromFormula("@atm"), "magical")
})

test("migre le score psychique des acteurs", () => {
  const source = {
    combat: { magic: { base: 2, bonuses: { sheet: 1 } } },
    currentEffects: [{ modifiers: [{ subtype: "combat", target: "magic" }] }],
  }

  migratePsychicScore(source)

  assert.deepEqual(source.combat.psychic, { base: 2, bonuses: { sheet: 1 } })
  assert.equal(source.combat.magic, undefined)
  assert.equal(source.currentEffects[0].modifiers[0].target, "psychic")
})

test("migre le score psychique des rencontres", () => {
  const source = { magic: 8 }

  migrateEncounterPsychicScore(source)

  assert.equal(source.psychic, 8)
  assert.equal(source.magic, undefined)
})

test("migre les cibles de modificateurs d'items et conserve les autres", () => {
  const source = {
    modifiers: [
      { subtype: "combat", target: "magic" },
      { subtype: "damage", target: "magic" },
    ],
    actions: [{ modifiers: [{ subtype: "combat", target: "magic" }] }],
  }

  migratePsychicScore(source)

  assert.equal(source.modifiers[0].target, "psychic")
  assert.equal(source.modifiers[1].target, "magic")
  assert.equal(source.actions[0].modifiers[0].target, "psychic")
})
