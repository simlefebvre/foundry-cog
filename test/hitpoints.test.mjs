import test from "node:test"
import assert from "node:assert/strict"

import Hitpoints from "../module/helpers/hitpoints.mjs"

test("les dégâts appliqués par un MJ passent par applyDamage", async () => {
  const previousGame = globalThis.game
  const damageCalls = []
  globalThis.game = {
    actors: { get: () => ({ name: "Personnage source" }) },
    user: { isGM: true },
  }

  const targetActor = {
    system: {
      attributes: {
        hp: { value: 20, max: 20 },
        tempDm: 0,
      },
    },
    applyDamage: async (damage) => damageCalls.push(damage),
  }

  try {
    await Hitpoints.applyToSingleTarget({
      targetActor,
      fromActor: "source-id",
      source: "Attaque",
      type: "half",
      amount: 11,
      drChecked: true,
      tempDamage: false,
    })
    await Hitpoints.applyToSingleTarget({
      targetActor,
      fromActor: "source-id",
      source: "Attaque",
      type: "full",
      amount: 4,
      drChecked: false,
      tempDamage: true,
    })
  } finally {
    if (previousGame === undefined) delete globalThis.game
    else globalThis.game = previousGame
  }

  assert.deepEqual(damageCalls, [
    { source: "Attaque (Personnage source)", damage: 6, ignoreDR: false },
    { source: "Attaque (Personnage source)", damage: 4, isTemporaryDamage: true, ignoreDR: true },
  ])
})
