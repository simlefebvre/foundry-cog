import test from "node:test"
import assert from "node:assert/strict"

import { FAMILIES, PROFILE_FAMILY_ALIASES } from "../module/config/profile.mjs"

test("les familles disponibles sont Action, Aventure et Réflexion, sans valeur de vigueur", () => {
  assert.deepEqual(Object.keys(FAMILIES).sort(), ["action", "aventure", "reflexion"])
  assert.deepEqual(FAMILIES.action, { label: "CO.profile.family.action", recoveryDice: "d10", fp: 2 })
  assert.deepEqual(FAMILIES.aventure, { label: "CO.profile.family.aventure", recoveryDice: "d8", fp: 4 })
  assert.deepEqual(FAMILIES.reflexion, { label: "CO.profile.family.reflexion", recoveryDice: "d6", fp: 2 })
})

test("les anciens identifiants de famille sont associés aux nouvelles familles", () => {
  assert.deepEqual(PROFILE_FAMILY_ALIASES, {
    combattant: "action",
    aventurier: "aventure",
    mage: "reflexion",
    mystique: "aventure",
  })
})
