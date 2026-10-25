import test from "node:test"
import assert from "node:assert/strict"

import {
  canRecoverFromWeakened,
  canRecoverFromWounded,
  findAutomaticCriticalStatus,
  findCriticalOnHitStatus,
  getFullRestRecoveredStatuses,
  isRangedAttackBlockedByBlindness,
  resolveStatusId,
} from "../module/helpers/status-rules.mjs"
import Utils from "../module/helpers/utils.mjs"

test("resolveStatusId suit les remplacements et résiste aux cycles", () => {
  assert.equal(resolveStatusId("unconscious", { unconscious: "immobilized" }), "immobilized")
  assert.equal(resolveStatusId("a", { a: "b", b: "a" }), "a")
})

test("findAutomaticCriticalStatus respecte le type d'action", () => {
  const statuses = new Set(["immobilized"])
  const meleeOnly = { immobilized: { automaticCritical: ["melee"] } }
  const allAttacks = { immobilized: { automaticCritical: "all" } }

  assert.equal(findAutomaticCriticalStatus(statuses, "melee", meleeOnly), "immobilized")
  assert.equal(findAutomaticCriticalStatus(statuses, "ranged", meleeOnly), null)
  assert.equal(findAutomaticCriticalStatus(statuses, "spell", allAttacks), "immobilized")
})

test("un statut peut imposer un critique uniquement si l'attaque touche", () => {
  const rules = { unconscious: { criticalOnHit: "all" } }
  const status = findCriticalOnHitStatus(new Set(["unconscious"]), "melee", rules)
  const hit = Utils._computeOutcome(15, 17, {})
  const miss = Utils._computeOutcome(18, 17, {})

  assert.equal(status, "unconscious")
  assert.equal(hit.isSuccess, true)
  assert.equal(miss.isSuccess, false)
})

test("la cécité interdit les attaques à distance seulement", () => {
  assert.equal(isRangedAttackBlockedByBlindness(new Set(["blind"]), "ranged"), true)
  assert.equal(isRangedAttackBlockedByBlindness(new Set(["blind"]), "melee"), false)
  assert.equal(isRangedAttackBlockedByBlindness(new Set(), "ranged"), false)
})

test("Affaibli nécessite une nuit de repos, tous les PV et l'absence de blessure grave", () => {
  const recovered = { hasRested: true, hpValue: 20, hpMax: 20, hasSeriousWound: false }

  assert.equal(canRecoverFromWeakened(recovered), true)
  assert.equal(canRecoverFromWeakened({ ...recovered, hasRested: false }), false)
  assert.equal(canRecoverFromWeakened({ ...recovered, hpValue: 19 }), false)
  assert.equal(canRecoverFromWeakened({ ...recovered, hasSeriousWound: true }), false)
})

test("Blessé nécessite tous les PV et l'absence de blessure grave, sans nuit de repos", () => {
  const recovered = { hpValue: 20, hpMax: 20, hasSeriousWound: false }

  assert.equal(canRecoverFromWounded(recovered), true)
  assert.equal(canRecoverFromWounded({ ...recovered, hpValue: 19 }), false)
  assert.equal(canRecoverFromWounded({ ...recovered, hasSeriousWound: true }), false)
})

test("une nuit complète de repos retire Confus, Épuisé et Fatigué seulement", () => {
  assert.deepEqual(getFullRestRecoveredStatuses(new Set(["confused", "exhausted", "tired", "weakened", "wounded"])), ["confused", "exhausted", "tired"])
  assert.deepEqual(getFullRestRecoveredStatuses(new Set(["weakened", "wounded"])), [])
})

test("un critique lié à Inconscient est recalculé selon la réussite après un point de chance", () => {
  const [hit] = Utils.recomputeTargetResults([{ difficulty: 15, criticalOnHitStatus: "unconscious" }], 17, {})
  const [miss] = Utils.recomputeTargetResults([{ difficulty: 18, criticalOnHitStatus: "unconscious" }], 17, {})

  assert.equal(hit.isSuccess, true)
  assert.equal(hit.isCritical, true)
  assert.equal(miss.isSuccess, false)
  assert.equal(miss.isCritical, false)
})

test("un critique forcé survit au recalcul après un point de chance", () => {
  const [result] = Utils.recomputeTargetResults([{ forcedOutcome: "critical", isSuccess: false, isFailure: true, isCritical: false, isFumble: true, needsOppositeRoll: true }], 1, {
    isFumble: true,
  })

  assert.deepEqual(
    { isSuccess: result.isSuccess, isFailure: result.isFailure, isCritical: result.isCritical, isFumble: result.isFumble, needsOppositeRoll: result.needsOppositeRoll },
    { isSuccess: true, isFailure: false, isCritical: true, isFumble: false, needsOppositeRoll: false },
  )
})
