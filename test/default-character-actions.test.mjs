import assert from "node:assert/strict"
import test from "node:test"

import { DEFAULT_CHARACTER_ACTIONS } from "../module/config/default-character-actions.mjs"

test("les actions générales par défaut couvrent les neuf manœuvres et leurs types", () => {
  assert.deepEqual(
    DEFAULT_CHARACTER_ACTIONS.map(({ name, type, actionType }) => [name, type, actionType]),
    [
      ["Aider", "buff", "a"],
      ["Combat à deux armes", "melee", "l"],
      ["Défense simple", "buff", "a"],
      ["Défense totale", "buff", "l"],
      ["Lancer une grenade", "ranged", "l"],
      ["Mettre en joue", "ranged", "a"],
      ["Remettre en état son arme", "ranged", "m"],
      ["Se mettre à couvert", "buff", "l"],
      ["Tir visé", "ranged", "l"],
    ],
  )
  assert.ok(DEFAULT_CHARACTER_ACTIONS.every(({ slug, description }) => slug && description))
})
