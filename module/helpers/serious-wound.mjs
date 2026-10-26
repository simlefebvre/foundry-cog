import { postStatusChangeCard } from "./status-log.mjs"

/**
 * Publie une demande de test ou de durée liée à une blessure grave.
 * @param {Actor} actor Personnage concerné.
 * @param {"initial"|"minutes"|"repeat"|"repeatRoll"|"hours"|"recover"|"woundRecovery"} stage Étape à afficher.
 * @returns {Promise<ChatMessage>}
 */
export async function createShockTestRequest(actor, stage) {
  const content = await foundry.applications.handlebars.renderTemplate("systems/cog/templates/chat/shock-test-card.hbs", {
    actorName: actor.name,
    actorUuid: actor.uuid,
    stage,
    title: game.i18n.localize(`CO.notif.shockTest.${stage}.title`),
    description: game.i18n.format(`CO.notif.shockTest.${stage}.description`, { actorName: actor.name }),
    buttonLabel: game.i18n.localize(`CO.notif.shockTest.${stage}.button`),
    buttonClass: stage === "repeat" || stage === "recover" ? "gm-only" : "",
    hasLuckyPoints: stage === "initial" && actor.hasLuckyPoints,
    isWoundRecovery: stage === "woundRecovery",
  })

  return ChatMessage.create({
    content,
    speaker: ChatMessage.getSpeaker({ actor, scene: canvas.scene }),
    type: "check",
    whisper: [],
    blind: false,
  })
}

/**
 * Dépense un point de chance pour annuler une blessure grave et l'état Affaibli associé.
 * @param {Actor} actor Personnage concerné.
 * @returns {Promise<boolean>} true si la blessure grave a été annulée.
 */
export async function cancelSeriousWound(actor) {
  if (!actor?.hasLuckyPoints || !actor.statuses?.has("seriousWound")) return false

  await actor.spendLuckyPoints(1)
  await actor.toggleStatusEffect("seriousWound", { active: false })
  await postStatusChangeCard(actor, "seriousWound", false, "luckyPointCancelled")
  if (actor.statuses.has("weakened")) {
    await actor.activateCOStatusEffect({ state: false, effectid: "weakened" })
    await postStatusChangeCard(actor, "weakened", false, "luckyPointCancelled")
  }
  await actor.unsetFlag("cog", "statuses.weakenedRested")
  await actor.unsetFlag("cog", "statuses.weakenedFromOneHP")
  return true
}

/**
 * Applique les conséquences d'un test de choc et gère le jet de durée.
 * @param {object} result Résultat analysé du test de caractéristique.
 * @param {"initial"|"repeat"|"minutes"|"hours"} stage Étape du test.
 * @param {Actor} actor Personnage concerné.
 * @returns {Promise<void>}
 */
export async function resolveShockTest(result, stage, actor) {
  if (stage === "woundRecovery") {
    if (!result.isSuccess || !actor.statuses.has("seriousWound")) return
    await actor.toggleStatusEffect("seriousWound", { active: false })
    await postStatusChangeCard(actor, "seriousWound", false, "seriousWoundHealed")
    return
  }

  if (stage === "minutes" || stage === "hours") {
    const durationRoll = await new Roll("1d6").evaluate()
    const unit = stage === "minutes" ? "minute" : "hour"
    const flavor = game.i18n.format(`CO.notif.shockTest.${unit}Result`, {
      actorName: actor.name,
      duration: durationRoll.total,
    })

    await durationRoll.toMessage(
      {
        speaker: ChatMessage.getSpeaker({ actor, scene: canvas.scene }),
        flavor,
        style: CONST.CHAT_MESSAGE_STYLES.OTHER,
      },
      { messageMode: "publicroll" },
    )
    await createShockTestRequest(actor, stage === "hours" ? "recover" : "repeat")
    return
  }

  if (result.isSuccess) {
    if (stage === "repeat" && actor.statuses.has("unconscious")) {
      await actor.toggleStatusEffect("unconscious", { active: false })
      await postStatusChangeCard(actor, "unconscious", false, "shockSucceeded")
    }
    return
  }

  if (!result.isFailure) return

  if (!actor.statuses.has("unconscious")) {
    await actor.toggleStatusEffect("unconscious", { active: true })
    await postStatusChangeCard(actor, "unconscious", true, "shockFailed")
  }
  await createShockTestRequest(actor, stage === "initial" ? "minutes" : "hours")
}
