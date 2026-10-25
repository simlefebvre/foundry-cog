import test from "node:test"
import assert from "node:assert/strict"

import { getAttackAbilityId, getDiceFormula, getTestDieFaces, getTestRollPenalty } from "../module/helpers/dice-formula.mjs"

test("construit les formules standard, bonus et malus avec le dé demandé", () => {
  assert.equal(getDiceFormula("standard"), "1d20")
  assert.equal(getDiceFormula("bonus"), "2d20kh")
  assert.equal(getDiceFormula("malus"), "2d20kl")

  assert.equal(getDiceFormula("standard", 12), "1d12")
  assert.equal(getDiceFormula("bonus", 12), "2d12kh")
  assert.equal(getDiceFormula("malus", 12), "2d12kl")
})

test("les statuts Blessé et Confus ne réduisent le dé que pour les caractéristiques visées", () => {
  const wounded = new Set(["wounded"])
  const confused = new Set(["confused"])

  for (const abilityId of ["for", "dex", "con"]) {
    assert.equal(getTestDieFaces(wounded, abilityId), 12)
    assert.equal(getTestDieFaces(confused, abilityId), 20)
  }

  for (const abilityId of ["int", "per", "cha"]) {
    assert.equal(getTestDieFaces(confused, abilityId), 12)
    assert.equal(getTestDieFaces(wounded, abilityId), 20)
  }

  assert.equal(getTestDieFaces(wounded, "other"), 20)
  assert.equal(getTestDieFaces(confused, "other"), 20)
  assert.equal(getTestDieFaces(new Set(["weakened"]), "other"), 12)
  assert.equal(getTestDieFaces(new Set(["immobilized"]), "for"), 12)
  assert.equal(getTestDieFaces(new Set(["immobilized"]), "int"), 12)
  assert.equal(getTestDieFaces(new Set(["immobilized"]), "other"), 12)
})

test("associe les attaques à distance, de mêlée et magiques à leur caractéristique", () => {
  assert.equal(getAttackAbilityId("melee"), "for")
  assert.equal(getAttackAbilityId("ranged"), "dex")
  assert.equal(getAttackAbilityId("magical"), "int")
  assert.equal(getAttackAbilityId("other"), undefined)
})

test("Épuisé et Fatigué appliquent le plus fort de leurs malus", () => {
  assert.equal(getTestRollPenalty(new Set()), 0)
  assert.equal(getTestRollPenalty(new Set(["tired"])), 2)
  assert.equal(getTestRollPenalty(new Set(["exhausted"])), 5)
  assert.equal(getTestRollPenalty(new Set(["exhausted", "tired"])), 5)
})
