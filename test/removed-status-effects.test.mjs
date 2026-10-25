import test from "node:test"
import assert from "node:assert/strict"

import { CUSTOM_STATUS_EFFECT, CUSTOM_EFFECT, REMOVED_STATUS_EFFECT_IDS } from "../module/config/effects.mjs"
import { RESOLVER_ADDITIONAL_EFFECT_STATUS } from "../module/config/action.mjs"
import Utils from "../module/helpers/utils.mjs"

test("les anciens états ne sont plus proposés, sans retirer les effets personnalisés", () => {
  const registeredStatuses = new Set(CUSTOM_STATUS_EFFECT.map(({ id }) => id))
  const selectableStatuses = new Set(Object.values(RESOLVER_ADDITIONAL_EFFECT_STATUS).map(({ id }) => id))

  for (const id of REMOVED_STATUS_EFFECT_IDS) {
    assert.equal(registeredStatuses.has(id), false, `${id} ne doit plus être enregistré`)
    assert.equal(selectableStatuses.has(id), false, `${id} ne doit plus être sélectionnable`)
  }
  assert.deepEqual(Object.keys(CUSTOM_EFFECT), ["damageOrHeal", "status", "buff", "debuff"])
})

test("le nettoyage retire uniquement les anciens états des acteurs et tokens", async () => {
  const removedActor = {
    uuid: "Actor.removed",
    effects: [{ id: "old", statuses: new Set(["paralysis"]) }],
    async deleteEmbeddedDocuments(type, ids) {
      assert.equal(type, "ActiveEffect")
      this.deleted = ids
    },
  }
  const tokenActor = {
    uuid: "Scene.scene.Token.token.Actor",
    effects: [{ id: "legacy-marker", statuses: new Set(["customEffect"]) }],
    async deleteEmbeddedDocuments(type, ids) {
      assert.equal(type, "ActiveEffect")
      this.deleted = ids
    },
  }
  const retainedActor = {
    uuid: "Actor.module",
    effects: [{ id: "module", statuses: new Set(["moduleStatus"]) }],
    async deleteEmbeddedDocuments() {
      assert.fail("un statut d'un module ne doit pas être supprimé")
    },
  }
  const previousGame = globalThis.game
  const previousUi = globalThis.ui
  globalThis.game = {
    actors: [removedActor, retainedActor],
    scenes: [{ tokens: [{ actor: tokenActor }] }],
    i18n: { format: (_key, { count }) => `${count} removed` },
  }
  globalThis.ui = { notifications: { info: () => {} } }

  try {
    assert.equal(await Utils.removeRemovedStatusEffects(), 2)
    assert.deepEqual(removedActor.deleted, ["old"])
    assert.deepEqual(tokenActor.deleted, ["legacy-marker"])
  } finally {
    if (previousGame === undefined) delete globalThis.game
    else globalThis.game = previousGame
    if (previousUi === undefined) delete globalThis.ui
    else globalThis.ui = previousUi
  }
})
