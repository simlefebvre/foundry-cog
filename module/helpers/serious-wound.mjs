/**
 * Publie une demande de test ou de durée liée à une blessure grave.
 * @param {Actor} actor Personnage concerné.
 * @param {"initial"|"minutes"|"repeat"|"repeatRoll"|"hours"|"recover"} stage Étape à afficher.
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
 * Applique les conséquences d'un test de choc et gère le jet de durée.
 * @param {object} result Résultat analysé du test de caractéristique.
 * @param {"initial"|"repeat"|"minutes"|"hours"} stage Étape du test.
 * @param {Actor} actor Personnage concerné.
 * @returns {Promise<void>}
 */
export async function resolveShockTest(result, stage, actor) {
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
      await ChatMessage.create({
        content: game.i18n.format("CO.notif.shockTest.wakesUp", { actorName: actor.name }),
        speaker: ChatMessage.getSpeaker({ actor, scene: canvas.scene }),
        whisper: [],
        blind: false,
      })
    }
    return
  }

  if (!result.isFailure) return

  if (!actor.statuses.has("unconscious")) {
    await actor.toggleStatusEffect("unconscious", { active: true })
  }
  await createShockTestRequest(actor, stage === "initial" ? "minutes" : "hours")
}
