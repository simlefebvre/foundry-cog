import test from "node:test"
import assert from "node:assert/strict"

import { cancelSeriousWound, createShockTestRequest, resolveShockTest } from "../module/helpers/serious-wound.mjs"

function installFoundryMocks() {
  const previousGlobals = {
    ChatMessage: globalThis.ChatMessage,
    CONST: globalThis.CONST,
    Roll: globalThis.Roll,
    canvas: globalThis.canvas,
    foundry: globalThis.foundry,
    game: globalThis.game,
  }
  const chatMessages = []
  const rolls = []
  const renderedTemplates = []
  const formattedMessages = []

  globalThis.ChatMessage = {
    create: async (data) => {
      chatMessages.push(data)
      return data
    },
    getSpeaker: () => ({}),
  }
  globalThis.CONST = { CHAT_MESSAGE_STYLES: { OTHER: 0 } }
  globalThis.Roll = class {
    constructor(formula) {
      this.formula = formula
      this.total = 4
    }

    async evaluate() {
      return this
    }

    async toMessage(data, options) {
      rolls.push({ formula: this.formula, ...data, options })
    }
  }
  globalThis.canvas = { scene: {} }
  globalThis.foundry = {
    applications: {
      handlebars: {
        renderTemplate: async (_template, data) => {
          renderedTemplates.push(data)
          return data.stage
        },
      },
    },
  }
  globalThis.game = {
    i18n: {
      format: (key, data) => {
        formattedMessages.push({ key, data })
        return key.replace(/\{(\w+)\}/g, (_match, placeholder) => data[placeholder] ?? `{${placeholder}}`)
      },
      localize: (key) => key,
    },
  }

  return {
    chatMessages,
    rolls,
    renderedTemplates,
    formattedMessages,
    restore() {
      for (const [key, value] of Object.entries(previousGlobals)) {
        if (value === undefined) delete globalThis[key]
        else globalThis[key] = value
      }
    },
  }
}

test("un échec au test de choc inflige inconscient et demande 1d6 minutes", async () => {
  const mocks = installFoundryMocks()
  const statuses = new Set()
  const toggles = []
  const actor = {
    name: "Aventurière",
    uuid: "Actor.test",
    statuses,
    toggleStatusEffect: async (status, options) => {
      toggles.push([status, options.active])
      if (options.active) statuses.add(status)
      else statuses.delete(status)
    },
  }

  try {
    await resolveShockTest({ isFailure: true, isSuccess: false }, "initial", actor)

    assert.deepEqual(toggles, [["unconscious", true]])
    assert.equal(mocks.chatMessages[0].content, "minutes")
  } finally {
    mocks.restore()
  }
})

test("une réussite au test de choc du MJ retire inconscient", async () => {
  const mocks = installFoundryMocks()
  const statuses = new Set(["unconscious"])
  const actor = {
    name: "Aventurière",
    uuid: "Actor.test",
    statuses,
    toggleStatusEffect: async (status, options) => {
      if (options.active) statuses.add(status)
      else statuses.delete(status)
    },
  }

  try {
    await resolveShockTest({ isFailure: false, isSuccess: true }, "repeat", actor)

    assert.equal(statuses.has("unconscious"), false)
    assert.equal(mocks.chatMessages.length, 1)
    assert.match(mocks.chatMessages[0].content, /wakesUp/)
  } finally {
    mocks.restore()
  }
})

test("un jet de durée en minutes propose un nouveau test au MJ", async () => {
  const mocks = installFoundryMocks()
  const actor = { name: "Aventurière", uuid: "Actor.test" }

  try {
    await resolveShockTest({}, "minutes", actor)

    assert.equal(mocks.rolls[0].formula, "1d6")
    assert.match(mocks.rolls[0].flavor, /minuteResult/)
    assert.deepEqual(mocks.rolls[0].options, { messageMode: "publicroll" })
    assert.equal(mocks.chatMessages[0].content, "repeat")
  } finally {
    mocks.restore()
  }
})

test("un jet de durée en heures propose au MJ de retirer inconscient", async () => {
  const mocks = installFoundryMocks()
  const actor = { name: "Aventurière", uuid: "Actor.test" }

  try {
    await resolveShockTest({}, "hours", actor)

    assert.equal(mocks.rolls[0].formula, "1d6")
    assert.equal(mocks.chatMessages[0].content, "recover")
    assert.equal(mocks.renderedTemplates[0].buttonClass, "gm-only")
  } finally {
    mocks.restore()
  }
})

test("la demande de nouveau test est publique et peut être lancée par le joueur", async () => {
  const mocks = installFoundryMocks()
  const actor = { name: "Aventurière", uuid: "Actor.test" }

  try {
    await createShockTestRequest(actor, "repeatRoll")

    assert.equal(mocks.renderedTemplates[0].stage, "repeatRoll")
    assert.equal(mocks.renderedTemplates[0].buttonClass, "")
    assert.deepEqual(mocks.chatMessages[0].whisper, [])
    assert.equal(mocks.chatMessages[0].blind, false)
  } finally {
    mocks.restore()
  }
})

test("une demande de test identifie le personnage et l'étape dans sa carte de chat", async () => {
  const mocks = installFoundryMocks()
  const actor = { name: "Aventurière", uuid: "Actor.test", hasLuckyPoints: true }

  try {
    const message = await createShockTestRequest(actor, "initial")

    assert.equal(mocks.renderedTemplates[0].hasLuckyPoints, true)
    assert.equal(message.content, "initial")
    assert.equal(message.type, "check")
    assert.deepEqual(message.speaker, {})
    assert.deepEqual(message.whisper, [])
    assert.equal(message.blind, false)
    assert.deepEqual(mocks.formattedMessages[0], {
      key: "CO.notif.shockTest.initial.description",
      data: { actorName: "Aventurière" },
    })
  } finally {
    mocks.restore()
  }
})

test("annuler une blessure grave dépense un point et retire aussi Affaibli", async () => {
  const statuses = new Set(["seriousWound", "weakened"])
  const calls = []
  const actor = {
    hasLuckyPoints: true,
    statuses,
    spendLuckyPoints: async (amount) => calls.push(["spend", amount]),
    toggleStatusEffect: async (status, options) => {
      calls.push(["toggle", status, options.active])
      statuses.delete(status)
    },
    activateCOStatusEffect: async (options) => {
      calls.push(["activate", options.effectid, options.state])
      statuses.delete(options.effectid)
    },
    unsetFlag: async (...args) => calls.push(["unsetFlag", ...args]),
  }

  const cancelled = await cancelSeriousWound(actor)

  assert.equal(cancelled, true)
  assert.deepEqual(calls, [
    ["spend", 1],
    ["toggle", "seriousWound", false],
    ["activate", "weakened", false],
    ["unsetFlag", "cog", "statuses.weakenedRested"],
    ["unsetFlag", "cog", "statuses.weakenedFromOneHP"],
  ])
  assert.equal(statuses.has("seriousWound"), false)
  assert.equal(statuses.has("weakened"), false)
})

test("l'annulation de blessure grave ne dépense rien si les conditions ne sont plus réunies", async () => {
  let spent = false
  const actor = {
    hasLuckyPoints: false,
    statuses: new Set(["seriousWound"]),
    spendLuckyPoints: async () => {
      spent = true
    },
  }

  assert.equal(await cancelSeriousWound(actor), false)
  assert.equal(spent, false)
})
